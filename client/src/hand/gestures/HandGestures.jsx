// Gesture controller: subscribes to inference frames, runs geometric pose
// detection → StabilityFilter → arbitrator → gesture detectors, and calls
// intents (scrollBy / nextPage / prevPage / closeOverlay) through refs.
// Mounted by OverlayHost while handState === 'live', mirroring HandCursor's
// structure. Gesture modules never touch the DOM — this component only
// dispatches intents.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useHandPipeline } from "../HandPipelineProvider";
import { useActions } from "../../intents/actions";
import { useOverlay } from "../../intents/OverlayContext";
import { StabilityFilter } from "../stability";
import { detectPose, fingerRatios } from "./poses";
import { createFistScroll } from "./fistScroll";
import { createSwipeDetector, evaluateGapSwipe } from "./swipe";
import { createFlickDetector } from "./flick";
import { DEBUG_PARAM, DEBUG_VALUE, GESTURE_TELEPORT_RESET, TUNE } from "../config";

const PALM_POINTS = [0, 5, 9, 13, 17];
// Flick is allowed shortly after a pinch release (spec §3: "from open palm
// or after pinch") — e.g. pinch-open a project, then flick it away.
const POST_PINCH_FLICK_MS = 400;

function handednessAt(results, i) {
  const first = results.handednesses?.[i]?.[0] ?? results.handedness?.[i]?.[0];
  return {
    label: (first?.categoryName ?? first?.displayName ?? "Unknown").toString(),
    score: first?.score ?? 0,
  };
}

export function HandGestures() {
  const { subscribeFrame, arbitrator } = useHandPipeline();
  const actions = useActions();
  const overlay = useOverlay();
  const { pathname } = useLocation();

  const actionsRef = useRef(actions);

  const sysRef = useRef(null);
  if (!sysRef.current) {
    sysRef.current = {
      // Getter-backed cfg → pose stability is live-tunable from the sliders.
      stability: new StabilityFilter({
        get requiredStableMs() { return TUNE.poses.stableMs; },
        get requiredClearMs() { return TUNE.poses.clearMs; },
      }),
      fistScroll: createFistScroll({ getScrollBy: () => actionsRef.current.scrollBy }),
      swipe: createSwipeDetector(),
      flick: createFlickDetector(),
      // lastSx/lastSy/lastSeenMs/exitVx/lastArmedMs deliberately survive the
      // hand-lost reset — they are the pre-gap state the gap-swipe reads
      // (arming happens BEFORE the tracking gap).
      track: {
        side: null,
        present: false,
        lastSeenMs: 0,
        lastRatios: null,
        lastStability: null,
        lastSx: null,
        lastSy: null,
        exitVx: 0,
        smoothSpeed: 0,
        stillStartMs: null,
        lastArmedMs: -Infinity,
      },
    };
  }

  useEffect(() => {
    actionsRef.current = actions;
    arbitrator.context.overlayOpen = Boolean(
      overlay.openProjectId || overlay.cheatSheetOpen || overlay.themeWheelOpen,
    );
  });

  // Momentum must not bleed onto the next page.
  useEffect(() => {
    sysRef.current.fistScroll.cancel();
  }, [pathname]);

  useEffect(() => {
    const { stability, fistScroll, swipe, flick, track } = sysRef.current;
    const arb = arbitrator;

    // Same sticky pick as CursorController (duplicated deliberately — M1
    // stays untouched; M3's two-hand work must extract a shared selectHand).
    const pickHand = (results) => {
      const hands = results.landmarks ?? [];
      if (hands.length === 0) return -1;
      let best = -1;
      let bestScore = -1;
      for (let i = 0; i < hands.length; i++) {
        const h = handednessAt(results, i);
        if (track.side && h.label === track.side) return i;
        if (h.score > bestScore) {
          bestScore = h.score;
          best = i;
        }
      }
      track.side = handednessAt(results, best).label;
      return best;
    };

    // The hand returning to rest after a swipe always moves opposite to the
    // swipe that just fired — refuse that direction for returnSuppressMs.
    const isReturnMotion = (dir, nowMs) =>
      arb.lastSwipe.dir !== null &&
      dir !== arb.lastSwipe.dir &&
      nowMs - arb.lastSwipe.tMs < TUNE.swipe.returnSuppressMs;

    const onFrame = (results, meta) => {
      const idx = pickHand(results);

      if (idx === -1) {
        // Missed detection: freeze inside the grace window (no stability
        // update — StabilityFilter resets its candidate timer on null, and
        // the fake camera interleaves empty frames). Full reset after grace.
        if (track.present && meta.nowMs - track.lastSeenMs > TUNE.cursor.graceMs) {
          track.present = false;
          track.side = null;
          track.stillStartMs = null;
          track.lastStability = stability.update(null, meta.nowMs);
          arb.context.pose = null;
          arb.context.candidatePose = null;
          arb.context.swipeArmed = false;
          if (arb.state === "SCROLL") fistScroll.release(meta.nowMs);
          arb.to("IDLE", "hand lost", meta.nowMs);
          swipe.clear();
          flick.clear();
        }
        return;
      }

      const prevSeenMs = track.lastSeenMs; // pre-gap timestamp, read before overwrite
      track.present = true;
      track.lastSeenMs = meta.nowMs;

      const lm = results.landmarks[idx];
      let cx = 0;
      let cy = 0;
      for (const p of PALM_POINTS) {
        cx += lm[p].x / PALM_POINTS.length;
        cy += lm[p].y / PALM_POINTS.length;
      }
      const sx = 1 - cx; // pre-mirrored screen fraction
      const sy = cy;

      const st = stability.update(detectPose(lm), meta.nowMs);
      track.lastStability = st;
      track.lastRatios = fingerRatios(lm);
      arb.context.pose = st.stable;
      arb.context.candidatePose = st.candidate;

      if (arb.state === "IDLE") arb.to("CURSOR", "hand present", meta.nowMs);

      if (arb.state === "SWIPE_COOLDOWN" && meta.nowMs - arb.enteredAtMs > TUNE.swipe.cooldownMs) {
        arb.to("CURSOR", "swipe cooldown elapsed", meta.nowMs);
      }

      const modal = arb.context.overlayOpen;
      const gapMs = meta.nowMs - prevSeenMs;

      // Gap-swipe (fast-swipe path): a fast sweep motion-blurs the hand and
      // the landmarker drops it mid-motion — this reacquire frame is the
      // first the pipeline sees of the far side. Must be evaluated against
      // the PRE-GAP track state, before the teleport guard / state updates
      // below overwrite it.
      if (
        prevSeenMs > 0 &&
        gapMs > TUNE.swipe.gapMinMs &&
        !modal &&
        arb.state === "CURSOR" &&
        arb.canFire("swipe", meta.nowMs, TUNE.swipe.cooldownMs)
      ) {
        const dir = evaluateGapSwipe(
          {
            lastSx: track.lastSx,
            lastSy: track.lastSy,
            lastSeenMs: prevSeenMs,
            exitVx: track.exitVx,
            lastArmedMs: track.lastArmedMs,
          },
          sx,
          sy,
          meta.nowMs,
        );
        if (dir && isReturnMotion(dir, meta.nowMs)) {
          arb.note(`return-suppressed gap ${dir}`, meta.nowMs);
        } else if (dir) {
          arb.cooldowns.swipe = meta.nowMs;
          arb.lastSwipe.dir = dir;
          arb.lastSwipe.tMs = meta.nowMs;
          swipe.clear();
          flick.clear();
          arb.note(
            `GAP-SWIPE ${dir} (dx ${(sx - track.lastSx).toFixed(2)}, gap ${Math.round(gapMs)}ms)`,
            meta.nowMs,
          );
          arb.to("SWIPE_COOLDOWN", `gap-swipe ${dir}`, meta.nowMs);
          if (dir === "next") actionsRef.current.nextPage();
          else actionsRef.current.prevPage();
        }
      }

      // Teleport guard: an implausible single-frame jump is a detection
      // glitch or a fast reacquire, never a gesture — reset the motion
      // buffers so it can't read as an in-track swipe/flick. Also maintain
      // the pre-loss lateral velocity (EMA) the gap-swipe reads as exitVx;
      // it only accumulates across continuous frames (dt < 100ms).
      if (track.lastSx !== null) {
        if (Math.hypot(sx - track.lastSx, sy - track.lastSy) > GESTURE_TELEPORT_RESET) {
          swipe.clear();
          flick.clear();
        }
        const dt = gapMs / 1000;
        if (dt > 0 && dt < 0.1) {
          track.exitVx = 0.5 * track.exitVx + 0.5 * ((sx - track.lastSx) / dt);

          // Swipe arming: a NEAR-STILL open palm held primeDwellMs arms the
          // swipe; the arm stays valid primeGraceMs after stillness ends —
          // long enough to cover the fling (and, for the gap path, the
          // armed-at-loss check). Speed is EMA-smoothed before the
          // comparison: raw per-frame landmark jitter on a truly still hand
          // spikes past a tight threshold and would break the streak, while
          // slow deliberate wandering sits steadily above it.
          const speed = Math.hypot(sx - track.lastSx, sy - track.lastSy) / dt;
          track.smoothSpeed = 0.6 * track.smoothSpeed + 0.4 * speed;
          if (st.stable === "OPEN_PALM" && track.smoothSpeed < TUNE.swipe.primeMaxSpeed) {
            track.stillStartMs ??= meta.nowMs;
            if (meta.nowMs - track.stillStartMs >= TUNE.swipe.primeDwellMs) {
              track.lastArmedMs = meta.nowMs;
            }
          } else {
            track.stillStartMs = null;
          }
        } else {
          track.exitVx = 0; // motion across a gap is not exit velocity
          track.stillStartMs = null;
        }
      }
      track.lastSx = sx;
      track.lastSy = sy;
      arb.context.swipeArmed = meta.nowMs - track.lastArmedMs < TUNE.swipe.primeGraceMs;

      swipe.push(sx, meta.nowMs);
      flick.push(sx, sy, meta.nowMs);

      // Fist-scroll ownership (refused in modal context — spec §4: modals
      // shrink the gesture set; scrolling the page behind a backdrop is wrong).
      if (arb.state === "CURSOR" && !modal && st.stable === "FIST") {
        if (arb.to("SCROLL", "stable fist", meta.nowMs)) fistScroll.start(cy, meta.nowMs);
      } else if (arb.state === "SCROLL") {
        if (st.stable === "FIST") {
          // Feed motion only while the per-frame candidate is still FIST:
          // during the stability-clear lag (~clearMs) the hand has already
          // opened and is decelerating — pushing those stationary samples
          // would zero out the momentum velocity measured at release.
          if (st.candidate === "FIST") fistScroll.move(cy, meta.nowMs);
        } else {
          arb.to("CURSOR", "fist released", meta.nowMs);
          fistScroll.release(meta.nowMs);
        }
      }

      // Swipe: deliberate open-palm sweep, page context only.
      if (
        arb.state === "CURSOR" &&
        !modal &&
        st.stable === "OPEN_PALM" &&
        meta.nowMs - track.lastArmedMs < TUNE.swipe.primeGraceMs &&
        arb.canFire("swipe", meta.nowMs, TUNE.swipe.cooldownMs)
      ) {
        const dir = swipe.evaluate(meta.nowMs);
        if (dir && isReturnMotion(dir, meta.nowMs)) {
          swipe.clear(); // would re-evaluate every frame otherwise
          arb.note(`return-suppressed ${dir}`, meta.nowMs);
        } else if (dir) {
          arb.cooldowns.swipe = meta.nowMs;
          arb.lastSwipe.dir = dir;
          arb.lastSwipe.tMs = meta.nowMs;
          swipe.clear();
          flick.clear();
          arb.to("SWIPE_COOLDOWN", `swipe ${dir}`, meta.nowMs);
          if (dir === "next") actionsRef.current.nextPage();
          else actionsRef.current.prevPage();
        }
      }

      // Flick: modal context only — dismisses the overlay.
      if (
        modal &&
        arb.state === "CURSOR" &&
        arb.canFire("flick", meta.nowMs, TUNE.flick.cooldownMs)
      ) {
        const postPinch = meta.nowMs - arb.context.lastPinchReleaseMs < POST_PINCH_FLICK_MS;
        if ((st.stable === "OPEN_PALM" || postPinch) && flick.evaluate()) {
          arb.cooldowns.flick = meta.nowMs;
          flick.clear();
          arb.note("FLICK → closeOverlay", meta.nowMs);
          actionsRef.current.closeOverlay();
        }
      }
    };

    const unsubscribe = subscribeFrame(onFrame);
    return () => {
      unsubscribe();
      fistScroll.cancel();
      swipe.clear();
      flick.clear();
    };
  }, [subscribeFrame, arbitrator]);

  // Debug / Playwright surface.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get(DEBUG_PARAM) !== DEBUG_VALUE) return undefined;
    const { track } = sysRef.current;
    if (window.__handDebug) {
      window.__handDebug.gestures = {
        getPose: () => arbitrator.context.pose,
        getRatios: () => track.lastRatios,
        getStability: () => track.lastStability,
        getFlickStats: () => sysRef.current.flick.stats(),
      };
    }
    return () => {
      if (window.__handDebug) delete window.__handDebug.gestures;
    };
  }, [arbitrator]);

  return null;
}
