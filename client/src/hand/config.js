// Phase 2 hand-control tuning — every threshold/gain/path lives here, nothing
// magic inline. The ?debug=hand overlay will expose these live from M1 on.

// ── Camera / landmarker ──────────────────────────────────────────────────────
export const CAMERA_CONSTRAINTS = {
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};
export const NUM_HANDS = 2;
export const DELEGATE = "AUTO"; // try GPU, fall back to CPU
export const MODEL_ASSET_PATH = "/models/hand_landmarker.task";
export const WASM_BASE_PATH = "/mediapipe/wasm"; // local copy, never CDN

// ── Discrete-pose pipeline (ported from ASL Hand Coach; consumed from M1) ───
export const STABILITY_REQUIRED_MS = 250;
export const STABILITY_CLEAR_MS = 200;
export const CLASSIFY_THRESHOLD = 1.35; // L2 nearest-neighbor acceptance

// ── PIP / readouts ───────────────────────────────────────────────────────────
export const PIP_THROTTLE_HZ = 5; // React readout update rate
export const FPS_WINDOW = 30; // sliding-window size for the fps meter
export const NOTICE_AUTO_DISMISS_MS = 6000; // failure-notice auto-hide

// ── Debug overlay ────────────────────────────────────────────────────────────
export const DEBUG_PARAM = "debug";
export const DEBUG_VALUE = "hand";

// MediaPipe's 21-landmark hand topology (kept local so the PIP renderer never
// has to import the heavy tasks-vision bundle).
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // index
  [5, 9], [9, 10], [10, 11], [11, 12],   // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20],// pinky
  [0, 17],                               // palm base
];

// ── M1 live-tunable params ───────────────────────────────────────────────────
// DebugOverlay sliders mutate these in place; controllers read them per-frame.
// Never destructure-and-cache — the single shared object identity is the point.
export const TUNE = {
  // One-euro filter on the cursor (Casiez): minCutoff fights jitter at rest,
  // beta fights lag on fast moves.
  oneEuro: { freq: 30, minCutoff: 1.0, beta: 0.007, dCutoff: 1.0 },
  // Central region of camera space mapped to the full viewport (anti
  // gorilla-arm). centerY > 0.5 biases the box low: a relaxed chest-height
  // hand sits at viewport center.
  comfortBox: { width: 0.55, height: 0.5, centerX: 0.5, centerY: 0.55 },
  // followRate (1/s): display-loop exponential approach toward the filtered
  // position; graceMs: hand-lost tolerance before the reticle fades.
  cursor: { followRate: 14, graceMs: 300, fadeMs: 250, readoutHz: 8 },
  // Magnetic snapping: enter at radius, hold until radius+exitPad, competitor
  // must be switchMargin px closer to steal. pullRate eases the rendered
  // reticle into the target.
  snap: { radius: 60, exitPad: 18, switchMargin: 12, pullRate: 22, rectRefreshHz: 4 },
  // Geometric pinch: thumb-tip↔index-tip / knuckle-span, with hysteresis.
  pinch: { enter: 0.4, exit: 0.55, cooldownMs: 250, confirmFrames: 2 },
};

// Slider metadata for the ?debug=hand panel: [dotted path, label, min, max, step]
export const TUNE_SPEC = [
  ["oneEuro.minCutoff", "1€ minCutoff", 0.1, 5, 0.05],
  ["oneEuro.beta", "1€ beta", 0, 0.05, 0.001],
  ["comfortBox.width", "box width", 0.3, 0.9, 0.01],
  ["comfortBox.height", "box height", 0.3, 0.9, 0.01],
  ["comfortBox.centerY", "box centerY", 0.35, 0.7, 0.01],
  ["cursor.followRate", "follow rate", 4, 40, 1],
  ["snap.radius", "snap radius", 20, 140, 2],
  ["snap.exitPad", "snap exitPad", 0, 60, 2],
  ["snap.pullRate", "snap pull", 6, 40, 1],
  ["pinch.enter", "pinch enter", 0.2, 0.6, 0.01],
  ["pinch.exit", "pinch exit", 0.3, 0.8, 0.01],
];

// Hand mode is desktop-only: needs camera access and a fine pointer device.
export function isHandModeSupported() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !(typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches)
  );
}
