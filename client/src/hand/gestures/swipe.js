// Page-swipe detector: a deliberate lateral sweep of the open palm. Requires
// BOTH sustained velocity AND large displacement inside the time window —
// the spec calls swipe the usual false-positive offender, and either check
// alone fires on ordinary cursor repositioning. Pure JS; the caller gates on
// pose/arbitrator/cooldown and dispatches the nav intent.

import { TUNE } from "../config";

export function createSwipeDetector() {
  let samples = []; // { x (pre-mirrored screen fraction), nowMs }

  return {
    push(screenX, nowMs) {
      samples.push({ x: screenX, nowMs });
      while (samples.length > 2 && nowMs - samples[0].nowMs > TUNE.swipe.windowMs) samples.shift();
    },

    // → 'next' | 'prev' | null. Hand sweeping screen-left (dx < 0) pushes
    // content forward → next page; flipDirection swaps.
    evaluate(nowMs) {
      if (samples.length < 3) return null;
      const oldest = samples[0];
      const latest = samples[samples.length - 1];
      const dt = (latest.nowMs - oldest.nowMs) / 1000;
      if (dt <= 0 || nowMs - oldest.nowMs > TUNE.swipe.windowMs) return null;

      const dx = latest.x - oldest.x;
      const v = dx / dt;
      if (Math.abs(dx) < TUNE.swipe.minDisplacement) return null;
      if (Math.abs(v) < TUNE.swipe.minVelocity) return null;

      const dir = dx < 0 ? "next" : "prev";
      if (!TUNE.swipe.flipDirection) return dir;
      return dir === "next" ? "prev" : "next";
    },

    clear() {
      samples = [];
    },
  };
}

/**
 * Fast-swipe path: a fast lateral sweep motion-blurs the hand and the
 * landmarker drops it entirely mid-motion, re-acquiring only when the hand
 * stops — so the continuous detector above never sees it. The dropout itself
 * is the signature: stable OPEN_PALM exiting fast laterally → brief tracking
 * gap → re-acquired far to the side IN THE SAME DIRECTION.
 *
 * The exit-velocity + direction-agreement gates are the anti-false-positive
 * core: dropping your hand and raising it elsewhere has no lateral exit
 * velocity; a blur-out mid-swipe accelerates for 1–3 tracked frames first.
 *
 * pre = { lastSx, lastSy, lastSeenMs, exitVx, lastArmedMs } — state captured
 * on the last tracked frame before the gap. → 'next' | 'prev' | null.
 */
export function evaluateGapSwipe(pre, sx, sy, nowMs) {
  const c = TUNE.swipe;
  const gap = nowMs - pre.lastSeenMs;
  if (gap < c.gapMinMs || gap > c.gapMaxMs) return null;
  // The hand must have been ARMED (still open palm for primeDwellMs) when
  // tracking dropped — an exploring hand that blurs out is never armed, so
  // its dropout can't page. Checked at loss time, so gap length (already
  // bounded by gapMaxMs) doesn't eat into the grace window.
  if (pre.lastSeenMs - pre.lastArmedMs > c.primeGraceMs) return null;

  const dx = sx - pre.lastSx;
  const dy = sy - pre.lastSy;
  if (Math.abs(dx) < c.gapMinDisplacement) return null;
  if (Math.abs(dx) < c.gapLateralRatio * Math.abs(dy)) return null;
  // gapExitVelocity 0 = exit-velocity discrimination disabled (needed when
  // the camera blurs instantly from rest, so no acceleration is ever
  // tracked). The sign check must be skipped with it — sign(0) matches
  // nothing, and a near-zero EMA's sign is noise, not direction.
  if (c.gapExitVelocity > 0) {
    if (Math.abs(pre.exitVx) < c.gapExitVelocity) return null;
    if (Math.sign(pre.exitVx) !== Math.sign(dx)) return null;
  }

  const dir = dx < 0 ? "next" : "prev";
  if (!c.flipDirection) return dir;
  return dir === "next" ? "prev" : "next";
}
