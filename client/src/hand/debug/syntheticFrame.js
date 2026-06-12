// Synthetic HandLandmarker results for the ?debug=hand surface — lets the
// debug panel and Playwright drive the cursor/gesture pipeline without a
// camera. Only the landmarks the systems read need to be geometrically
// honest: palm points 0/5/9/13/17 (centroid + knuckle span 5↔17), tips 4/8
// (pinch), and the four fingertips when a pose is requested.

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

function buildHand({ cx, cy, pinch = false, pose }) {
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

  return lm;
}

/**
 * Build a HandLandmarkerResult-shaped object. Single hand (legacy,
 * byte-identical to the original): makeFrame({cx, cy, pinch, pose}).
 * Two hands (M3): makeFrame({hands: [{cx, cy, pose, pinch}, {...}]}) —
 * index 0 is labeled Right, index 1 Left.
 */
export function makeFrame(spec) {
  const handSpecs = spec.hands ?? [spec];
  const lms = handSpecs.map(buildHand);
  const labels = ["Right", "Left"];
  const handedness = handSpecs.map((_, i) => [
    { categoryName: labels[i] ?? "Unknown", displayName: labels[i] ?? "Unknown", score: 0.99 },
  ]);
  return { landmarks: lms, worldLandmarks: lms, handednesses: handedness, handedness };
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
