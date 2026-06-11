// The inference-side half of the hand cursor. Pure JS, no React, no DOM:
// per frame it picks a hand, maps the palm centroid through the comfort box,
// smooths with one-euro, and runs the geometric pinch FSM. Output is the
// mutable `state` object (read by HandCursor's display loop) plus a single
// discrete `onPinch({x, y, tMs})` callback with the position frozen at
// pinch-start. Everything tunable reads TUNE live (debug sliders).

import { TUNE } from "../config";
import { createOneEuro2D } from "../oneEuro";

const TRAIL_LEN = 90;
const PALM_POINTS = [0, 5, 9, 13, 17]; // wrist + MCP knuckles

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function handednessAt(results, i) {
  const first = results.handednesses?.[i]?.[0] ?? results.handedness?.[i]?.[0];
  return {
    label: (first?.categoryName ?? first?.displayName ?? "Unknown").toString(),
    score: first?.score ?? 0,
  };
}

export function createCursorController({ onPinch }) {
  const filter = createOneEuro2D(TUNE.oneEuro);

  const state = {
    present: false,
    lastSeenMs: 0,
    side: null,
    x: -100,
    y: -100,
    rawX: -100,
    rawY: -100,
    pinch: { phase: "IDLE", ratio: 1 },
  };

  const trail = [];
  let confirmCount = 0;
  let lastFireMs = -Infinity;

  // Sticky hand selection: keep the tracked side while it's still present
  // (cursor must not teleport when a second hand enters for M3 gestures);
  // otherwise take the highest-score hand and reset the filters.
  function pickHand(results) {
    const hands = results.landmarks ?? [];
    if (hands.length === 0) return -1;

    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < hands.length; i++) {
      const h = handednessAt(results, i);
      if (state.side && h.label === state.side) return i;
      if (h.score > bestScore) {
        bestScore = h.score;
        best = i;
      }
    }
    state.side = handednessAt(results, best).label;
    filter.reset();
    return best;
  }

  function updatePinch(lm, tMs) {
    const span = Math.hypot(lm[5].x - lm[17].x, lm[5].y - lm[17].y);
    if (span < 1e-6) return; // edge-on hand, ratio meaningless — hold state

    const ratio = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y) / span;
    const p = state.pinch;
    p.ratio = ratio;

    if (p.phase === "IDLE") {
      if (ratio < TUNE.pinch.enter && tMs - lastFireMs > TUNE.pinch.cooldownMs) {
        p.phase = "CONFIRMING";
        confirmCount = 1;
      }
    } else if (p.phase === "CONFIRMING") {
      if (ratio < TUNE.pinch.enter) {
        confirmCount += 1;
        if (confirmCount >= TUNE.pinch.confirmFrames) {
          p.phase = "PINCHED";
          lastFireMs = tMs;
          onPinch?.({ x: state.x, y: state.y, tMs }); // frozen click point
        }
      } else {
        p.phase = "IDLE";
      }
    } else if (p.phase === "PINCHED") {
      if (ratio > TUNE.pinch.exit) p.phase = "IDLE";
    }
  }

  return {
    state,

    onFrame(results, meta) {
      const idx = pickHand(results);
      if (idx === -1) {
        // Missed detection: a single empty frame must not blink the cursor
        // or reset the filters — presence decays via lastSeenMs staleness
        // (the display loop's graceMs). Only after grace expires do we fully
        // reset, so reacquire starts clean and a blip never fires a gesture.
        if (state.present && meta.nowMs - state.lastSeenMs > TUNE.cursor.graceMs) {
          state.present = false;
          state.side = null;
          state.pinch.phase = "IDLE";
          filter.reset();
        }
        return;
      }

      const lm = results.landmarks[idx];

      let cx = 0;
      let cy = 0;
      for (const p of PALM_POINTS) {
        cx += lm[p].x / PALM_POINTS.length;
        cy += lm[p].y / PALM_POINTS.length;
      }

      // Comfort box → viewport, mirrored X (webcam is a mirror).
      const cb = TUNE.comfortBox;
      const nx = clamp01((1 - cx - (cb.centerX - cb.width / 2)) / cb.width);
      const ny = clamp01((cy - (cb.centerY - cb.height / 2)) / cb.height);
      state.rawX = nx * window.innerWidth;
      state.rawY = ny * window.innerHeight;

      const f = filter.filter({ x: state.rawX, y: state.rawY }, meta.nowMs);
      state.x = f.x;
      state.y = f.y;

      state.present = true;
      state.lastSeenMs = meta.nowMs;

      updatePinch(lm, meta.nowMs);

      trail.push({ rawX: state.rawX, rawY: state.rawY, x: state.x, y: state.y, ratio: state.pinch.ratio, t: meta.nowMs });
      if (trail.length > TRAIL_LEN) trail.shift();
    },

    getTrail: () => trail,

    reset() {
      state.present = false;
      state.side = null;
      state.pinch.phase = "IDLE";
      state.pinch.ratio = 1;
      filter.reset();
      trail.length = 0;
      confirmCount = 0;
    },
  };
}
