// Flick detector: a short high-velocity burst that returns near its origin —
// the "shoo away" motion that dismisses overlays. Implemented as a burst FSM
// rather than a sliding window: the origin is captured when speed first
// exceeds the threshold, and the verdict is taken ONCE at the deceleration
// edge (speed fell below half the peak) by measuring distance back to that
// origin. A sliding window can't do this — by the time the hand decelerates
// the origin samples have expired and net displacement mis-reads the return
// stroke. Discrimination from swipe: a swipe ends far from its origin
// (netDisp ≥ minDisplacement 0.25 vs flick's < 0.12), and a sustained fast
// move outlives maxDurationMs, which cancels the burst. Pure JS; caller
// gates pose/context/cooldown.

import { TUNE } from "../config";

export function createFlickDetector() {
  let prev = null; // { x, y, nowMs } — pre-mirrored screen fractions
  let burst = null; // { originX, originY, startMs, peakV }
  let lastV = 0;

  return {
    push(x, y, nowMs) {
      if (prev) {
        const dt = (nowMs - prev.nowMs) / 1000;
        if (dt > 0) {
          lastV = Math.hypot(x - prev.x, y - prev.y) / dt;
          if (!burst && lastV > TUNE.flick.minVelocity) {
            burst = { originX: prev.x, originY: prev.y, startMs: prev.nowMs, peakV: lastV };
          } else if (burst) {
            if (lastV > burst.peakV) burst.peakV = lastV;
            // Sustained fast motion is a swipe-like move, not a flick.
            if (nowMs - burst.startMs > TUNE.flick.maxDurationMs) burst = null;
          }
        }
      }
      prev = { x, y, nowMs };
    },

    stats() {
      return {
        active: !!burst,
        peakV: burst?.peakV ?? 0,
        curV: lastV,
        netDisp: burst && prev ? Math.hypot(prev.x - burst.originX, prev.y - burst.originY) : 0,
      };
    },

    // One-shot: the burst is consumed at the deceleration edge whether or
    // not it qualifies (a failed burst must not linger and fire later).
    evaluate() {
      if (!burst || !prev) return false;
      if (lastV >= 0.5 * burst.peakV) return false; // still in the burst
      const net = Math.hypot(prev.x - burst.originX, prev.y - burst.originY);
      const fired = net < TUNE.flick.maxDisplacement;
      burst = null;
      return fired;
    },

    clear() {
      prev = null;
      burst = null;
      lastV = 0;
    },
  };
}
