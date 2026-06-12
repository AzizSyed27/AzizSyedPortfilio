// Synthetic HandLandmarker results for the ?debug=hand surface — lets the
// debug panel and Playwright drive the cursor pipeline without a camera.
// Only the landmarks the cursor system reads need to be geometrically honest:
// palm points 0/5/9/13/17 (centroid + knuckle span 5↔17) and tips 4/8 (pinch).

import { TUNE } from "../config";

// Palm layout in camera-normalized units, centered so the centroid of
// {0, 5, 9, 13, 17} lands exactly on the requested (cx, cy).
const PALM_OFFSETS = {
  0: [0, 0.06],      // wrist
  5: [-0.03, -0.03], // index MCP
  9: [0, -0.035],    // middle MCP
  13: [0.02, -0.033],// ring MCP
  17: [0.04, -0.025],// pinky MCP
};

// Tip landmark for each finger MCP, used by the pose articulation.
const FINGER_TIPS = { 5: 8, 9: 12, 13: 16, 17: 20 };

/**
 * Build a one-hand HandLandmarkerResult-shaped object whose palm centroid is
 * (cx, cy) in camera space. pinch=true puts the thumb tip on the index tip.
 * pose: 'open' | 'fist' articulates the four fingertips on the wrist→MCP ray
 * at extension factor 1.8 / 0.85 (the ratio poses.js measures reads exactly
 * that). pose undefined keeps the legacy M1 geometry, which deliberately
 * classifies as a null pose (index ~1.51, others ~0.65).
 */
export function makeFrame({ cx, cy, pinch = false, pose }) {
  const keys = Object.keys(PALM_OFFSETS);
  const mean = keys.reduce(
    (m, k) => [m[0] + PALM_OFFSETS[k][0] / keys.length, m[1] + PALM_OFFSETS[k][1] / keys.length],
    [0, 0],
  );

  const lm = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));
  for (const k of keys) {
    lm[k] = {
      x: cx + PALM_OFFSETS[k][0] - mean[0],
      y: cy + PALM_OFFSETS[k][1] - mean[1],
      z: 0,
    };
  }

  if (pose === "open" || pose === "fist") {
    const k = pose === "open" ? 1.8 : 0.85;
    const wrist = lm[0];
    for (const [mcp, tip] of Object.entries(FINGER_TIPS)) {
      lm[tip] = {
        x: wrist.x + (lm[mcp].x - wrist.x) * k,
        y: wrist.y + (lm[mcp].y - wrist.y) * k,
        z: 0,
      };
    }
    // Thumb tip: pinch puts it on the index tip; otherwise keep it far from
    // the index tip — a fist must not be vetoed by the pinch-exclusion guard.
    lm[4] = pinch
      ? { x: lm[8].x + 0.003, y: lm[8].y, z: 0 }
      : { x: lm[8].x + 0.06, y: lm[8].y + 0.02, z: 0 };
  } else {
    // Legacy M1 geometry (null pose): index tip above the index MCP; thumb
    // tip either far (open) or touching (pinch).
    lm[8] = { x: lm[5].x, y: lm[5].y - 0.05, z: 0 };
    lm[4] = pinch
      ? { x: lm[8].x + 0.003, y: lm[8].y, z: 0 }
      : { x: lm[8].x + 0.06, y: lm[8].y + 0.01, z: 0 };
  }

  return {
    landmarks: [lm],
    worldLandmarks: [lm],
    handednesses: [[{ categoryName: "Right", displayName: "Right", score: 0.99 }]],
    handedness: [[{ categoryName: "Right", displayName: "Right", score: 0.99 }]],
  };
}

/**
 * Inverse of the cursor's comfort-box mapping (including the mirror), using
 * the live TUNE values — "what camera position puts the cursor on this
 * viewport point?" Recompute after mutating TUNE.comfortBox.
 */
export function viewportToCamera(x, y) {
  const cb = TUNE.comfortBox;
  const nx = x / window.innerWidth;
  const ny = y / window.innerHeight;
  return {
    cx: 1 - (cb.centerX - cb.width / 2 + nx * cb.width),
    cy: cb.centerY - cb.height / 2 + ny * cb.height,
  };
}
