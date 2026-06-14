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
import { detectPose, fingerRatios, isPalmUp } from "./poses";
import { createFistScroll } from "./fistScroll";
import { createSwipeDetector, evaluateGapSwipe } from "./swipe";
import { createFlickDetector } from "./flick";
import { createTwoHand } from "./twoHand";
import { DEBUG_PARAM, DEBUG_VALUE, GESTURE_TELEPORT_RESET, TUNE } from "../config";
import { THEME_ORDER } from "../../theme/ThemeProvider";

const PALM_POINTS = [0, 5, 9, 13, 17];
// Flick is allowed shortly after a pinch release (spec §3: "from open palm
// or after pinch") — e.g. pinch-open a project, then flick it away.
const POST_PINCH_FLICK_MS = 400;
// After the dial closes, ignore re-entry this long — the commit pinch (or its
// confirm-lag) is still held and would instantly reopen the dial.
const DIAL_REENTER_MS = 600;
// An up-flick lifts the cursor off the send zone before the burst resolves, so
// fire flick-send if the cursor was over it within this window.
const SEND_FLICK_WINDOW_MS = 450;

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
    const arb = arbitrator;
    // Shared frame clock for the twoHand callbacks (they fire synchronously
    // inside onFrame, which stamps this first).
    const frameNow = { t: 0 };

    const twoHand = createTwoHand({
      onEngage(mode) {
        const sys = sysRef.current;
        if (arb.state === "SCROLL") sys.fistScroll.cancel(); // no momentum
        arb.to("TWO_HAND", `two-hand ${mode}`, frameNow.t);
        arb.context.twoHandMode = mode;
        // Freeze the single-hand pose world for the duration: stability
        // nulled once (re-acquires through the normal path on exit), swipe
        // arming dropped, motion buffers cleared.
        sys.track.lastStability = sys.stability.update(null, frameNow.t);
        arb.context.pose = null;
        arb.context.candidatePose = null;
        arb.context.swipeArmed = false;
        sys.track.lastArmedMs = -Infinity;
        sys.track.stillStartMs = null;
        sys.swipe.clear();
        sys.flick.clear();
      },
      onZoom(factor) {
        actionsRef.current.zoomModel(factor);
      },
      onRotate(dxPx) {
        actionsRef.current.rotateModel(dxPx, 0);
      },
      onPullApart(id) {
        if (!id) return;
        arb.cooldowns.pull = frameNow.t;
        arb.note(`PULL-APART → openProject ${id}`, frameNow.t);
        actionsRef.current.openProject(id);
      },
      onRelease(reason) {
        const sys = sysRef.current;
        arb.context.twoHandMode = null;
        arb.to(sys.track.present ? "CURSOR" : "IDLE", `two-hand exit: ${reason}`, frameNow.t);
        sys.track.exitVx = 0; // first post-exit frame must not read as a gap-swipe
      },
    });

    sysRef.current = {
      frameNow,
      twoHand,
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
        lastHandCount: 0,
        exitVx: 0,
        vy: 0,
        smoothSpeed: 0,
        stillStartMs: null,
        lastArmedMs: -Infinity,
        lastArmedSendMs: -Infinity, // last frame the cursor was over the send zone
        // Theme dial (M4)
        dialMode: "ONE",     // 'ONE' = pinch-pill (same hand turns); 'TWO' = palm-up summon + other hand turns
        dialBaseRoll: 0,
        dialBaseIndex: 0,
        dialIndexDelta: 0,
        dialLastIndex: 0,
        dialPinchArmed: false,
        dialBaseSet: false,  // TWO mode: rotating hand's roll baseline captured yet?
        palmUpStartMs: null,
        palmLostMs: null,    // TWO mode: palm-up hand dropout timer (grace before close)
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
    const { stability, fistScroll, swipe, flick, track, twoHand, frameNow } = sysRef.current;
    const arb = arbitrator;

    // Gallery-surface cache (sanctioned read-only DOM query, same class as
    // the snapping registry): SPATIAL zoom/rotate only makes sense when the
    // 3D gallery viewport exists and is on screen.
    const galleryCache = { ok: false, lastMs: -Infinity };
    const galleryAvailable = (nowMs) => {
      if (nowMs - galleryCache.lastMs > 1000) {
        galleryCache.lastMs = nowMs;
        const el = document.querySelector(".g3d-viewport");
        if (!el) {
          galleryCache.ok = false;
        } else {
          const r = el.getBoundingClientRect();
          galleryCache.ok = r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
        }
      }
      return galleryCache.ok;
    };

    // Per-hand grip for the two-hand FSM: geometric pinch wins, then the raw
    // pose; the 200ms engage dwell is the stability filter here.
    const gripOf = (lm) => {
      const span = Math.hypot(lm[5].x - lm[17].x, lm[5].y - lm[17].y);
      if (span > 1e-6 && Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / span < TUNE.pinch.enter) {
        return "PINCH";
      }
      const pose = detectPose(lm);
      if (pose === "FIST") return "FIST";
      if (pose === "OPEN_PALM") return "OPEN";
      return "NEUTRAL";
    };

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

    // ── Theme dial (M4) ──
    // Turn the hand like a wheel: the angle of the index-MCP→pinky-MCP vector
    // (2D, robust) steps detents; pinch commits, flick cancels.
    const wrapPi = (a) => {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    };
    const rollAngle = (lm) => Math.atan2(lm[17].y - lm[5].y, lm[17].x - lm[5].x);
    const palmCentroid = (lm) => {
      let cx = 0, cy = 0;
      for (const p of PALM_POINTS) { cx += lm[p].x / PALM_POINTS.length; cy += lm[p].y / PALM_POINTS.length; }
      return { sx: 1 - cx, sy: cy };
    };
    const findPalmUp = (results) => {
      const hands = results.landmarks ?? [];
      for (let i = 0; i < hands.length; i++) if (isPalmUp(hands[i])) return i;
      return -1;
    };

    const resetDial = () => {
      track.dialIndexDelta = 0;
      track.dialPinchArmed = false;
      track.dialBaseSet = false;
      track.palmUpStartMs = null;
      track.palmLostMs = null;
    };

    // mode: 'ONE' (pinch-pill — that same hand turns) | 'TWO' (palm-up summon —
    // the OTHER hand turns). rollLm: the turning hand at entry (ONE), or null
    // (TWO — baseline is captured when the rotating hand first appears).
    const enterDial = (nowMs, mode, rollLm) => {
      let baseIndex = THEME_ORDER.indexOf(actionsRef.current.themeId);
      if (baseIndex < 0) baseIndex = 0;
      arb.context.requestDial = false;
      if (!arb.to("DIAL", `theme dial ${mode}`, nowMs)) return;
      track.dialMode = mode;
      track.dialBaseIndex = baseIndex;
      track.dialIndexDelta = 0;
      track.dialLastIndex = baseIndex;
      track.dialPinchArmed = false;
      track.palmUpStartMs = null;
      track.palmLostMs = null;
      if (rollLm) { track.dialBaseRoll = rollAngle(rollLm); track.dialBaseSet = true; }
      else track.dialBaseSet = false;
      arb.context.dialIndex = baseIndex;
      actionsRef.current.openThemeDial();
      actionsRef.current.previewTheme(THEME_ORDER[baseIndex]); // lift HUD → show current theme
    };

    const exitDial = (commit, nowMs) => {
      if (commit) actionsRef.current.commitTheme(THEME_ORDER[arb.context.dialIndex]);
      else actionsRef.current.cancelThemeDial();
      actionsRef.current.closeThemeDial();
      resetDial();
      arb.cooldowns.dial = nowMs; // swallow the still-held commit pinch's re-entry
      arb.context.requestDial = false;
      arb.to(track.present ? "CURSOR" : "IDLE", commit ? "dial commit" : "dial cancel", nowMs);
    };

    // Pinch-commit (latch) + flick-cancel + roll→detent for the controlling
    // hand (ONE: the single hand; TWO: the rotating hand). Returns true if the
    // dial exited so the caller stops.
    const controlHand = (lm, sx, sy, nowMs) => {
      const pinching = gripOf(lm) === "PINCH";
      // Commit only after one non-pinch frame, so the pinch that opened the
      // dial (still held on entry) can't auto-commit.
      if (!pinching) track.dialPinchArmed = true;
      if (track.dialPinchArmed && pinching) {
        arb.note(`dial commit → ${THEME_ORDER[arb.context.dialIndex]}`, nowMs);
        exitDial(true, nowMs);
        return true;
      }
      flick.push(sx, sy, nowMs);
      if (flick.evaluate()) {
        flick.clear();
        arb.note("dial cancel (flick)", nowMs);
        exitDial(false, nowMs);
        return true;
      }
      // Roll → detent (frozen while pinching so the commit can't reselect).
      if (!pinching) {
        if (!track.dialBaseSet) {
          track.dialBaseRoll = rollAngle(lm);
          track.dialBaseIndex = arb.context.dialIndex;
          track.dialIndexDelta = 0;
          track.dialBaseSet = true;
        }
        const detentRad = (TUNE.dial.rollPerDetentDeg * Math.PI) / 180;
        const pos = wrapPi(rollAngle(lm) - track.dialBaseRoll) / detentRad;
        const band = 0.5 + TUNE.dial.hysteresis;
        if (Math.abs(pos - track.dialIndexDelta) > band) track.dialIndexDelta = Math.round(pos);
        const dir = TUNE.dial.flipDirection ? -1 : 1;
        const n = THEME_ORDER.length;
        const idx = (((track.dialBaseIndex + track.dialIndexDelta * dir) % n) + n) % n;
        if (idx !== track.dialLastIndex) {
          track.dialLastIndex = idx;
          arb.context.dialIndex = idx;
          actionsRef.current.previewTheme(THEME_ORDER[idx]);
        }
      }
      return false;
    };

    const dialFrame = (results, lm, sx, sy, nowMs) => {
      if (track.dialMode !== "TWO") {
        controlHand(lm, sx, sy, nowMs); // ONE: the single hand controls
        return;
      }
      // TWO: Hand A holds palm-up to keep the wheel open; lowering it closes.
      const aIdx = findPalmUp(results);
      if (aIdx === -1) {
        track.palmLostMs ??= nowMs;
        if (nowMs - track.palmLostMs > TUNE.dial.palmHoldGraceMs) {
          arb.note("dial cancel (palm lowered)", nowMs);
          exitDial(false, nowMs);
        }
        return; // grace: a brief palm-up dropout doesn't close
      }
      track.palmLostMs = null;
      // Hand B = the other hand — it turns / pinches / flicks.
      const hands = results.landmarks ?? [];
      let bIdx = -1;
      for (let i = 0; i < hands.length; i++) { if (i !== aIdx) { bIdx = i; break; } }
      if (bIdx === -1) { track.dialBaseSet = false; return; } // only summon hand up — wait for B
      const bLm = hands[bIdx];
      const c = palmCentroid(bLm);
      controlHand(bLm, c.sx, c.sy, nowMs);
    };

    const onFrame = (results, meta) => {
      frameNow.t = meta.nowMs;
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
          arb.context.twoHandMode = null;
          if (arb.state === "SCROLL") fistScroll.release(meta.nowMs);
          if (arb.state === "DIAL") {
            actionsRef.current.cancelThemeDial();
            actionsRef.current.closeThemeDial();
            resetDial();
          }
          arb.to("IDLE", "hand lost", meta.nowMs);
          swipe.clear();
          flick.clear();
          twoHand.reset();
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
      const handCount = results.landmarks.length;

      // Theme dial (M4): once open it owns the frame — turn to select, pinch
      // to commit, flick to cancel. Handled before twoHand/single-hand.
      if (arb.state === "DIAL") {
        if (arb.context.requestDialClose) {
          arb.context.requestDialClose = false;
          arb.note("dial cancel (esc)", meta.nowMs);
          exitDial(false, meta.nowMs);
        } else {
          dialFrame(results, lm, sx, sy, meta.nowMs);
        }
        track.lastSx = sx;
        track.lastSy = sy;
        track.lastHandCount = handCount;
        return;
      }

      // Pinch on the theme pill (HandCursor set this) opens the one-hand dial
      // (same hand turns) — unless we just closed it (commit pinch still held).
      if (
        arb.context.requestDial &&
        (arb.state === "CURSOR" || arb.state === "PINCH_ACTIVE")
      ) {
        arb.context.requestDial = false;
        if (arb.canFire("dial", meta.nowMs, DIAL_REENTER_MS)) {
          enterDial(meta.nowMs, "ONE", lm);
          track.lastSx = sx;
          track.lastSy = sy;
          track.lastHandCount = handCount;
          return;
        }
      }

      if (arb.state === "IDLE") arb.to("CURSOR", "hand present", meta.nowMs);

      // Palm-up summon (M4.1, two-hand): hold an upward-facing palm (Hand A) to
      // open the theme dial; the OTHER hand turns it. Pre-empts M3 two-hand
      // spatial so summoning on the gallery never starts a zoom. Depth-based
      // (flaky) — pinch-the-pill stays the reliable one-hand entry.
      const puIdx = findPalmUp(results);
      if (
        arb.state === "CURSOR" && !arb.context.overlayOpen &&
        puIdx !== -1 && arb.canFire("dial", meta.nowMs, DIAL_REENTER_MS)
      ) {
        track.palmUpStartMs ??= meta.nowMs;
        if (meta.nowMs - track.palmUpStartMs >= TUNE.dial.palmUpDwellMs) {
          enterDial(meta.nowMs, "TWO", null);
          track.lastSx = sx;
          track.lastSy = sy;
          track.lastHandCount = handCount;
          return;
        }
      } else if (puIdx === -1) {
        track.palmUpStartMs = null;
      }

      // Two-hand spatial (M3): runs ahead of the single-hand world. Skipped
      // while a palm-up hand is summoning the dial (puIdx !== -1), but kept
      // running once already engaged so an in-progress zoom/rotate continues.
      const twoHandActive = arb.state === "TWO_HAND" || twoHand.stats().phase !== "IDLE";
      if (twoHandActive || (puIdx === -1 && handCount >= 2)) {
        const hands = [];
        for (let i = 0; i < Math.min(handCount, 2); i++) {
          const hlm = results.landmarks[i];
          hands.push({
            label: handednessAt(results, i).label,
            wx: 1 - hlm[0].x,
            wy: hlm[0].y,
            grip: gripOf(hlm),
          });
        }
        twoHand.frame(
          hands,
          {
            galleryAvailable: galleryAvailable(meta.nowMs),
            modalOpen: arb.context.overlayOpen,
            // Pass null once the cursor is suppressed — a suppression-driven
            // clear must not erase twoHand's captured card.
            armedProject:
              arb.state === "CURSOR" || arb.state === "PINCH_ACTIVE"
                ? arb.context.armedProject
                : null,
            pullCooldownOk: arb.canFire("pull", meta.nowMs, TUNE.twoHand.pullCooldownMs),
          },
          meta.nowMs,
        );
        if (arb.state === "TWO_HAND") {
          track.lastSx = sx;
          track.lastSy = sy;
          track.lastHandCount = handCount;
          return;
        }
      }

      const st = stability.update(detectPose(lm), meta.nowMs);
      track.lastStability = st;
      track.lastRatios = fingerRatios(lm);
      arb.context.pose = st.stable;
      arb.context.candidatePose = st.candidate;

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
        // One-hand rule: single hand on the reacquire frame AND before the gap.
        handCount === 1 &&
        track.lastHandCount === 1 &&
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
          track.vy = (sy - track.lastSy) / dt; // up is negative (flick-to-send)

          // Swipe arming: a NEAR-STILL open palm held primeDwellMs arms the
          // swipe; the arm stays valid primeGraceMs after stillness ends —
          // long enough to cover the fling (and, for the gap path, the
          // armed-at-loss check). Speed is EMA-smoothed before the
          // comparison: raw per-frame landmark jitter on a truly still hand
          // spikes past a tight threshold and would break the streak, while
          // slow deliberate wandering sits steadily above it.
          const speed = Math.hypot(sx - track.lastSx, sy - track.lastSy) / dt;
          track.smoothSpeed = 0.6 * track.smoothSpeed + 0.4 * speed;
          // Page swiping is a ONE-hand gesture: with a second hand in view
          // the arm never builds (and both fire paths below require a single
          // hand), so two-hand use can never page accidentally.
          if (handCount === 1 && st.stable === "OPEN_PALM" && track.smoothSpeed < TUNE.swipe.primeMaxSpeed) {
            track.stillStartMs ??= meta.nowMs;
            if (meta.nowMs - track.stillStartMs >= TUNE.swipe.primeDwellMs) {
              track.lastArmedMs = meta.nowMs;
            }
          } else {
            track.stillStartMs = null;
          }
        } else {
          track.exitVx = 0; // motion across a gap is not exit velocity
          track.vy = 0;
          track.stillStartMs = null;
        }
      }
      track.lastSx = sx;
      track.lastSy = sy;
      track.lastHandCount = handCount;
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
        handCount === 1 && // one-hand rule: no page swiping with two hands in view
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

      // Flick (out-and-back burst): modal context dismisses the overlay.
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

      // Flick-to-send: a fast UPWARD throw of the open palm while recently over
      // the Contact send zone (the throw lifts the cursor off it, so use
      // recency). Directional up-velocity — not the out-and-back flick.
      if (arb.context.armedSend) track.lastArmedSendMs = meta.nowMs;
      if (
        !modal &&
        arb.state === "CURSOR" &&
        meta.nowMs - track.lastArmedSendMs < SEND_FLICK_WINDOW_MS &&
        st.stable === "OPEN_PALM" &&
        track.vy < -TUNE.flick.minVelocity &&
        arb.canFire("flick", meta.nowMs, TUNE.flick.cooldownMs)
      ) {
        arb.cooldowns.flick = meta.nowMs;
        flick.clear();
        arb.note("FLICK-UP → submitContact", meta.nowMs);
        actionsRef.current.submitContact();
      }
    };

    const unsubscribe = subscribeFrame(onFrame);
    return () => {
      unsubscribe();
      fistScroll.cancel();
      swipe.clear();
      flick.clear();
      twoHand.reset();
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
        getTwoHand: () => sysRef.current.twoHand.stats(),
        getDial: () => ({ index: arbitrator.context.dialIndex, theme: THEME_ORDER[arbitrator.context.dialIndex] }),
      };
    }
    return () => {
      if (window.__handDebug) delete window.__handDebug.gestures;
    };
  }, [arbitrator]);

  return null;
}
