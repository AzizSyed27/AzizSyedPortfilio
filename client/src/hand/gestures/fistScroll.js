// Fist-scroll: while SCROLL owns the frame, vertical palm motion maps to
// per-frame scrollBy deltas (instant behavior — smooth would restart its
// animation every call); release hands off to an exponential-decay momentum
// rAF loop. Pure JS, no DOM reads — the scroll intent is injected.

import { TUNE } from "../config";

const VELOCITY_WINDOW_MS = 120;
const STALL_FRAMES = 5;

export function createFistScroll({ getScrollBy }) {
  let samples = []; // { y (camera-norm), nowMs }
  let raf = null;

  const stopMomentum = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  const dyFor = (deltaY) =>
    -deltaY * TUNE.scroll.gain * window.innerHeight * (TUNE.scroll.invert ? -1 : 1);

  return {
    start(y, nowMs) {
      stopMomentum();
      samples = [{ y, nowMs }];
    },

    move(y, nowMs) {
      const prev = samples[samples.length - 1];
      samples.push({ y, nowMs });
      while (samples.length > 2 && nowMs - samples[0].nowMs > VELOCITY_WINDOW_MS) samples.shift();
      if (!prev) return;

      let dy = dyFor(y - prev.y);
      const cap = TUNE.scroll.maxStepPx;
      if (dy > cap) dy = cap;
      if (dy < -cap) dy = -cap;
      if (dy !== 0) getScrollBy()(dy, { behavior: "instant" });
    },

    release() {
      // Momentum: initial velocity (px/s, post-gain) from the window ending
      // at the LAST fist sample — release() arrives ~100-120ms after the
      // fist was last seen (pose-stability clear delay), so measuring the
      // window from "now" would always find stale samples and never coast.
      const tail = samples[samples.length - 1];
      const recent = tail
        ? samples.filter((s) => tail.nowMs - s.nowMs <= VELOCITY_WINDOW_MS)
        : [];
      samples = [];
      if (recent.length < 2) return;
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.nowMs - first.nowMs) / 1000;
      if (dt <= 0) return;
      let v = dyFor(last.y - first.y) / dt;

      let prevT = performance.now();
      let lastScrollY = window.scrollY;
      let stalled = 0;
      const coast = (t) => {
        const stepDt = Math.min((t - prevT) / 1000, 0.05);
        prevT = t;
        v *= Math.exp(-TUNE.scroll.momentumDecay * stepDt);
        if (Math.abs(v) < TUNE.scroll.minMomentumPx) {
          raf = null;
          return;
        }
        getScrollBy()(v * stepDt, { behavior: "instant" });
        // Page bound: scrollY stops moving → quit instead of spinning.
        stalled = window.scrollY === lastScrollY ? stalled + 1 : 0;
        lastScrollY = window.scrollY;
        if (stalled >= STALL_FRAMES) {
          raf = null;
          return;
        }
        raf = requestAnimationFrame(coast);
      };
      raf = requestAnimationFrame(coast);
    },

    cancel() {
      stopMomentum();
      samples = [];
    },

    isCoasting: () => raf !== null,
  };
}
