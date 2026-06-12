// Two-hand spatial tracker (M3): spread-zoom + rotate over the 3D gallery,
// and pull-apart over an armed project card. Pure factory — no DOM, no
// arbitrator import; the caller (HandGestures) supplies per-frame context and
// receives intents through callbacks.
//
// FSM: IDLE → (2 hands) → CANDIDATE → (eligibility class held engageMs) →
// ENGAGED(mode) → release. The 200ms engage dwell is the stability filter
// for this gesture — no per-hand StabilityFilter. All emits are incremental,
// so a hand dropping mid-gesture exits gracefully with nothing to snap back.
//
// Dead-zone rule: suppressed emits do NOT advance the prev baselines — slow
// deliberate motion accumulates past the threshold; zero-mean jitter never
// does.

import { TUNE } from "../config";

const wrapToPi = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

// Stable pair geometry: order by handedness label (Left first), fall back to
// x-sort when MediaPipe duplicates labels. Span is order-independent; angle
// ordering flips are absorbed by the maxStepRad guard.
function pairGeometry(hands) {
  let [a, b] = hands;
  const swap =
    a.label === b.label ? a.wx > b.wx : a.label === "Right" && b.label === "Left";
  if (swap) [a, b] = [b, a];
  return {
    span: Math.hypot(b.wx - a.wx, b.wy - a.wy),
    angle: Math.atan2(b.wy - a.wy, b.wx - a.wx),
  };
}

const isGrip = (g) => g === "FIST" || g === "PINCH";

export function createTwoHand({ onEngage, onZoom, onRotate, onPullApart, onRelease }) {
  let phase = "IDLE"; // IDLE | CANDIDATE | ENGAGED
  let mode = null; // 'SPATIAL' | 'PULL'
  let eligClass = "NONE";
  let eligStartMs = 0;
  let lastTwoHandsMs = 0;
  let capturedProject = null;
  let baselineSpan = 0;
  let prevSpan = 0;
  let prevAngle = 0;
  // debug/test signal
  let spanRatio = 1;
  let lastZoomFactor = 1;
  let totalRotateRad = 0;
  let zoomEmits = 0;
  let rotateEmits = 0;

  const reset = () => {
    phase = "IDLE";
    mode = null;
    eligClass = "NONE";
    capturedProject = null;
    spanRatio = 1;
    totalRotateRad = 0;
    zoomEmits = 0;
    rotateEmits = 0;
  };

  const classify = (hands, ctx) => {
    const grips = hands.map((h) => h.grip);
    if (grips.every(isGrip) && capturedProject && !ctx.modalOpen && ctx.pullCooldownOk) {
      return "PULL";
    }
    if (!grips.some(isGrip) && ctx.galleryAvailable && !ctx.modalOpen) {
      return "SPATIAL";
    }
    return "NONE";
  };

  return {
    frame(hands, ctx, nowMs) {
      const c = TUNE.twoHand;

      if (hands.length < 2) {
        if (phase !== "IDLE" && nowMs - lastTwoHandsMs > c.releaseGraceMs) {
          const wasEngaged = phase === "ENGAGED";
          reset();
          if (wasEngaged) onRelease?.("hand lost");
        }
        return; // brief one-hand dropouts: freeze, no emits
      }
      lastTwoHandsMs = nowMs;

      const { span, angle } = pairGeometry(hands);

      if (phase === "IDLE") {
        phase = "CANDIDATE";
        // Load-bearing capture point: the second hand just appeared, the
        // cursor is still live, its armed card (if any) is intact.
        capturedProject = ctx.armedProject;
        eligClass = classify(hands, ctx);
        eligStartMs = nowMs;
        return;
      }

      if (phase === "CANDIDATE") {
        // Refresh only from non-null (a suppression-driven clear upstream
        // passes null and must not erase the capture); a genuine re-aim
        // updates it.
        if (ctx.armedProject) capturedProject = ctx.armedProject;
        const cls = classify(hands, ctx);
        if (cls !== eligClass) {
          eligClass = cls;
          eligStartMs = nowMs;
        }
        if (eligClass !== "NONE" && nowMs - eligStartMs >= c.engageMs) {
          phase = "ENGAGED";
          mode = eligClass === "PULL" ? "PULL" : "SPATIAL";
          baselineSpan = prevSpan = span;
          prevAngle = angle;
          spanRatio = 1;
          totalRotateRad = 0;
          onEngage?.(mode);
        }
        return;
      }

      // ENGAGED
      if (span < c.minSpan) {
        prevSpan = span > 0 ? span : prevSpan;
        prevAngle = angle;
        return;
      }
      spanRatio = baselineSpan > 0 ? span / baselineSpan : 1;

      if (mode === "SPATIAL") {
        const r = span / prevSpan;
        if (Math.abs(r - 1) >= c.spanDeadZone) {
          // ControlsBridge MULTIPLIES camera distance — spreading (r > 1)
          // must shrink it, hence the negative exponent.
          lastZoomFactor = Math.pow(r, -c.zoomGain);
          onZoom?.(lastZoomFactor);
          zoomEmits += 1;
          prevSpan = span;
        }

        const dTheta = wrapToPi(angle - prevAngle);
        if (Math.abs(dTheta) > c.maxStepRad) {
          prevAngle = angle; // pairing flip / glitch: rebaseline, no emit
        } else if (Math.abs(dTheta) >= c.rotateDeadZoneRad) {
          onRotate?.(dTheta * c.rotateGainPx);
          totalRotateRad += dTheta;
          rotateEmits += 1;
          prevAngle = angle;
        }
        return;
      }

      // PULL
      if (spanRatio >= c.pullRatio) {
        const id = capturedProject;
        reset();
        onPullApart?.(id);
        onRelease?.("pull fired");
      }
    },

    reset,

    stats: () => ({
      phase,
      mode,
      spanRatio,
      lastZoomFactor,
      totalRotateRad,
      zoomEmits,
      rotateEmits,
      capturedProject,
    }),
  };
}
