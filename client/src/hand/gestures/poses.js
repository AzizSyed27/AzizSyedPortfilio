// Geometric pose detection (no templates): OPEN_PALM / FIST from finger
// extension ratios. 2D distances only — MediaPipe z is the noisiest channel
// and a camera-facing fist shrinks 2D tip distance anyway (switch to 3D only
// if real-hand testing shows edge cases). Ambiguous hands return null; the
// StabilityFilter downstream absorbs the flicker.

import { TUNE } from "../config";

const FINGERS = [
  ["index", 5, 8],
  ["middle", 9, 12],
  ["ring", 13, 16],
  ["pinky", 17, 20],
];

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function fingerRatios(lm) {
  const wrist = lm[0];
  const out = {};
  for (const [name, mcp, tip] of FINGERS) {
    const base = dist2(lm[mcp], wrist);
    out[name] = base > 1e-6 ? dist2(lm[tip], wrist) / base : 0;
  }
  return out;
}

export function detectPose(lm) {
  const span = dist2(lm[5], lm[17]);
  if (span < 1e-6) return null; // edge-on hand — geometry meaningless

  // All-fingers-curled while the thumb touches the index tip is a pinch in
  // progress, not a fist — never let FIST steal an active/incoming pinch.
  const thumbIndexRatio = dist2(lm[4], lm[8]) / span;

  const r = fingerRatios(lm);
  const ratios = [r.index, r.middle, r.ring, r.pinky];

  if (ratios.every((v) => v > TUNE.poses.extendRatio)) return "OPEN_PALM";
  if (ratios.every((v) => v < TUNE.poses.curlRatio)) {
    return thumbIndexRatio < TUNE.pinch.exit ? null : "FIST";
  }
  return null;
}

// Palm-up detection (M4 theme-dial summon) — the depth-based, flaky one.
// Palm normal = (lm5−lm0) × (lm17−lm0). Image y is down, so a palm facing the
// ceiling has a normal pointing up → negative normalized y. Returns that
// "up amount" in [0..1]; pinch-pill is the reliable entry, this is additive.
export function palmUpAmount(lm) {
  const w = lm[0];
  const a = { x: lm[5].x - w.x, y: lm[5].y - w.y, z: (lm[5].z ?? 0) - (w.z ?? 0) };
  const b = { x: lm[17].x - w.x, y: lm[17].y - w.y, z: (lm[17].z ?? 0) - (w.z ?? 0) };
  // cross product a × b
  const n = {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
  const len = Math.hypot(n.x, n.y, n.z);
  if (len < 1e-6) return 0;
  return -n.y / len; // up (image −y) → positive
}

export function isPalmUp(lm) {
  return detectPose(lm) === "OPEN_PALM" && palmUpAmount(lm) > TUNE.dial.palmUpThreshold;
}
