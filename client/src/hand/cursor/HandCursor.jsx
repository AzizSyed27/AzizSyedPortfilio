// The display-side half of the hand cursor and the sanctioned DOM seam.
// Mounted by OverlayHost while handState === 'live'. A display-rate rAF loop
// (refs only, zero React state) eases the rendered reticle toward the
// controller's filtered position, resolves magnetic snapping, applies the
// .armed class to exactly one target, and renders the design's free/snap
// reticles. Pinch dispatch: synthetic click on the armed element (every
// clickable routes through the intent layer via its own onClick), else
// closeOverlay when an overlay is open.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useHandPipeline } from "../HandPipelineProvider";
import { useActions } from "../../intents/actions";
import { useOverlay } from "../../intents/OverlayContext";
import { createCursorController } from "./CursorController";
import { createTargetRegistry } from "./snapping";
import { DEBUG_PARAM, DEBUG_VALUE, TUNE } from "../config";

const PINCH_PULSE_MS = 200;

export function HandCursor() {
  const { subscribeFrame, arbitrator } = useHandPipeline();
  const actions = useActions();
  const overlay = useOverlay();
  const { pathname } = useLocation();

  const rootRef = useRef(null);
  const reticleRef = useRef(null);
  const snapRef = useRef(null);
  const readoutRef = useRef(null);
  const tagRef = useRef(null);

  const actionsRef = useRef(actions);
  const overlayOpenRef = useRef(false);
  const armedRef = useRef(null);
  const pulseUntilRef = useRef(0);

  // Registry + controller live for the whole mount; created exactly once.
  const sysRef = useRef(null);
  if (!sysRef.current) {
    const registry = createTargetRegistry();
    const controller = createCursorController({
      onPinch: () => {
        // Arbitrator gates: pinch is a CURSOR-family gesture only, and a
        // fist being formed reads as a momentary pinch (~66ms confirm vs
        // FIST's 120ms stability) — candidatePose kills that false click.
        if (arbitrator.state !== "CURSOR" && arbitrator.state !== "PINCH_ACTIVE") return;
        if (arbitrator.context.candidatePose === "FIST") return;
        const armed = armedRef.current;
        if (armed?.el?.isConnected) {
          armed.el.click();
        } else if (overlayOpenRef.current) {
          actionsRef.current.closeOverlay();
        }
        pulseUntilRef.current = performance.now() + PINCH_PULSE_MS;
      },
    });
    sysRef.current = { registry, controller };
  }

  // Keep dispatch refs fresh without re-subscribing anything.
  useEffect(() => {
    actionsRef.current = actions;
    overlayOpenRef.current = Boolean(
      overlay.openProjectId || overlay.cheatSheetOpen || overlay.themeWheelOpen,
    );
  });

  // Inference-side subscription. The wrapper also mirrors the pinch FSM into
  // the arbitrator (HandCursor's two sanctioned transitions: CURSOR ↔
  // PINCH_ACTIVE) — release timestamps feed flick's just-after-pinch window.
  useEffect(() => {
    const { controller } = sysRef.current;
    let prevPhase = "IDLE";
    const onFrame = (results, meta) => {
      controller.onFrame(results, meta);
      const phase = controller.state.pinch.phase;
      // During TWO_HAND, skip the mirror writes (they'd be REJECTED and spam
      // the transitions ring — pinch grips are normal during a pull-apart);
      // prevPhase still tracks so the release edge stays correct after exit.
      if (arbitrator.state !== "TWO_HAND") {
        if (phase === "PINCHED" && prevPhase !== "PINCHED") {
          arbitrator.to("PINCH_ACTIVE", "pinch down", meta.nowMs);
        } else if (phase !== "PINCHED" && prevPhase === "PINCHED") {
          arbitrator.context.lastPinchReleaseMs = meta.nowMs;
          arbitrator.to("CURSOR", "pinch released", meta.nowMs);
        }
      }
      prevPhase = phase;
    };
    const unsubscribe = subscribeFrame(onFrame);
    return () => {
      unsubscribe();
      controller.reset();
    };
  }, [subscribeFrame, arbitrator]);

  // Rect-cache invalidation: scroll/resize, periodic catch-all for silent
  // layout changes, and route/overlay transitions (after a paint).
  useEffect(() => {
    const { registry } = sysRef.current;
    const mark = () => registry.markDirty();
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    const id = setInterval(mark, 1000 / TUNE.snap.rectRefreshHz);
    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => sysRef.current.registry.markDirty());
    return () => cancelAnimationFrame(raf);
  }, [pathname, overlay.openProjectId, overlay.cheatSheetOpen, overlay.themeWheelOpen]);

  // Debug / Playwright surface.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get(DEBUG_PARAM) !== DEBUG_VALUE) return undefined;
    const { controller, registry } = sysRef.current;
    if (window.__handDebug) {
      window.__handDebug.cursor = { getState: () => controller.state, getTrail: controller.getTrail };
      window.__handDebug.registry = { refresh: registry.refresh, list: registry.list };
    }
    return () => {
      if (window.__handDebug) {
        delete window.__handDebug.cursor;
        delete window.__handDebug.registry;
      }
    };
  }, []);

  // Display loop — all DOM writes happen here.
  useEffect(() => {
    const { registry, controller } = sysRef.current;
    let raf;
    let prevT = performance.now();
    let rx = -100;
    let ry = -100;
    let pull = 0; // 0..1 blend toward the snapped target center
    let snapped = null;
    let wasLost = true;
    let lastReadout = 0;

    const clearArmed = () => {
      if (snapped?.el) snapped.el.classList.remove("armed");
      snapped = null;
      armedRef.current = null;
      arbitrator.context.armedProject = null;
      if (rootRef.current) rootRef.current.dataset.snapped = "0";
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((t - prevT) / 1000, 0.05);
      prevT = t;

      const root = rootRef.current;
      const reticle = reticleRef.current;
      if (!root || !reticle) return;

      const st = controller.state;
      const lost = !st.present || performance.now() - st.lastSeenMs > TUNE.cursor.graceMs;
      // While another gesture family owns the frame (fist-scroll, swipe
      // cooldown, two-hand spatial) the cursor is fully suppressed — same
      // path as hand-lost, so there's never armed/snap residue and resume
      // pops cleanly.
      const suppressed =
        arbitrator.state === "SCROLL" ||
        arbitrator.state === "SWIPE_COOLDOWN" ||
        arbitrator.state === "TWO_HAND";
      root.classList.toggle("hc-hidden", lost || suppressed);
      if (lost || suppressed) {
        clearArmed();
        pull = 0;
        wasLost = true;
        return;
      }
      if (wasLost) {
        // Reacquired: appear at the new position, no swoop from the old one.
        rx = st.x;
        ry = st.y;
        wasLost = false;
      }

      const k = 1 - Math.exp(-TUNE.cursor.followRate * dt);
      rx += (st.x - rx) * k;
      ry += (st.y - ry) * k;

      const next = registry.findTarget(st.x, st.y, snapped);
      if (next?.el !== snapped?.el) {
        if (snapped?.el) snapped.el.classList.remove("armed");
        if (next?.el) next.el.classList.add("armed");
        snapped = next;
        armedRef.current = next;
        // Pull-apart (M3) reads this: which project card the hand is aimed at.
        arbitrator.context.armedProject = next?.el?.dataset?.handProject ?? null;
        root.dataset.snapped = next ? "1" : "0";
        if (next && tagRef.current) tagRef.current.textContent = `→ ${next.code}`;
      } else if (next) {
        snapped = next; // pick up refreshed rect
        armedRef.current = next;
      }

      const kp = 1 - Math.exp(-TUNE.snap.pullRate * dt);
      pull += ((snapped ? 1 : 0) - pull) * kp;

      let drawX = rx;
      let drawY = ry;
      if (snapped) {
        const r = snapped.rect;
        drawX = rx + ((r.left + r.right) / 2 - rx) * pull;
        drawY = ry + ((r.top + r.bottom) / 2 - ry) * pull;
        if (snapRef.current) {
          snapRef.current.style.transform = `translate(${r.left}px, ${r.top}px)`;
          snapRef.current.style.width = `${r.width}px`;
          snapRef.current.style.height = `${r.height}px`;
        }
      }

      reticle.style.transform = `translate(${drawX}px, ${drawY}px)`;
      reticle.classList.toggle(
        "hc-pinch",
        st.pinch.phase === "PINCHED" || performance.now() < pulseUntilRef.current,
      );

      if (t - lastReadout > 1000 / TUNE.cursor.readoutHz && readoutRef.current) {
        lastReadout = t;
        readoutRef.current.textContent =
          `x:${(st.x / window.innerWidth).toFixed(2)} y:${(st.y / window.innerHeight).toFixed(2)}`;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clearArmed();
      // Belt-and-braces: never leave armed residue after exit.
      document.querySelectorAll(".armed").forEach((el) => el.classList.remove("armed"));
    };
    // arbitrator is a stable mutable object from the provider — the dep
    // satisfies the linter without ever re-running the loop.
  }, [arbitrator]);

  return (
    <div ref={rootRef} className="hand-cursor hc-hidden" data-snapped="0" aria-hidden="true">
      <div ref={reticleRef} className="hc-reticle">
        <div className="hc-cross-h" />
        <div className="hc-cross-v" />
        <div className="hc-box"><i /></div>
        <div className="hc-dot" />
        <div ref={readoutRef} className="hc-readout">x:0.50 y:0.50</div>
      </div>
      <div ref={snapRef} className="hc-snap">
        <div className="hc-edge" />
        <div className="hc-sb tl" />
        <div className="hc-sb tr" />
        <div className="hc-sb bl" />
        <div className="hc-sb br" />
        <div ref={tagRef} className="hc-tag">→</div>
        <div className="hc-lock">LOCK</div>
      </div>
    </div>
  );
}
