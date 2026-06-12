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
// Landmarker confidence thresholds (set at creation, not hot-tunable).
// minTrackingConfidence is lowered from the 0.5 default so tracking survives
// moderate motion blur — fast lateral hand moves otherwise drop all landmarks.
export const MIN_HAND_DETECTION_CONFIDENCE = 0.5;
export const MIN_HAND_PRESENCE_CONFIDENCE = 0.5;
export const MIN_TRACKING_CONFIDENCE = 0.3;

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

// A frame-to-frame palm jump larger than this (camera fraction) is not hand
// motion — it's a detection glitch or a sub-grace reacquire across the frame.
// Motion buffers (swipe/flick) reset rather than reading it as a gesture.
export const GESTURE_TELEPORT_RESET = 0.25;

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
  // Geometric poses (M2): finger extension ratio = dist2D(tip,wrist)/dist2D(mcp,wrist).
  // Between curlRatio and extendRatio is a deliberate null band the
  // StabilityFilter absorbs. stableMs/clearMs feed the filter live (getters).
  poses: { extendRatio: 1.55, curlRatio: 1.25, stableMs: 120, clearMs: 100 },
  // Fist-scroll: dy = -(Δ palm centroid y) · gain · viewport height, with
  // exponential momentum after release.
  scroll: { gain: 2.2, invert: false, momentumDecay: 3.0, minMomentumPx: 40, maxStepPx: 80 },
  // Swipe (page nav): requires BOTH velocity AND displacement — the usual
  // false-positive offender. Units are pre-mirrored screen fractions.
  // The gap* params drive the second detection path: a FAST swipe motion-blurs
  // the hand and the landmarker drops it mid-motion, so the signature is
  // "open palm exiting fast laterally → brief tracking gap → re-acquired far
  // to the side in the same direction".
  swipe: {
    minVelocity: 0.8,
    minDisplacement: 0.3,     // user-tuned (was 0.25)
    windowMs: 350,
    cooldownMs: 900,
    flipDirection: false,
    gapMinMs: 60,             // shorter gaps are ordinary tracking jitter
    gapMaxMs: 600,            // longer = the hand genuinely left the frame
    gapMinDisplacement: 0.22, // |dx| across the gap, camera fraction
    gapLateralRatio: 1.5,     // |dx| must dominate |dy|
    gapExitVelocity: 0,       // OFF — superseded by arming below. An armed
                              // fling starts from stillness and blurs out
                              // instantly, so tracked exit velocity is ~0 by
                              // design; any nonzero gate here blocks it.
    // ── Arming (pause-to-arm, then fling) ──
    // The dropout-jump alone can't carry intent: an exploring hand that drops
    // tracking would page accidentally. So intent is signaled BEFORE the
    // swipe, where tracking is reliable: hold a still open palm primeDwellMs
    // → armed (PIP shows it) → fling within primeGraceMs fires, tracked or
    // blurred-out. Applies to BOTH swipe paths. Never armed = never fires.
    primeDwellMs: 250,        // still + open palm this long → armed
    primeMaxSpeed: 0.15,      // u/s, EMA-smoothed; near-still only — slow
                              // cursor wandering must NOT arm
    primeGraceMs: 500,        // armed validity after stillness ends
    // Bringing the hand back to rest after a swipe moves opposite to the
    // swipe that fired. Suppress OPPOSITE-direction swipes for this window —
    // same-direction keeps the normal cooldownMs, so repeated paging in one
    // direction (swipe, return, swipe…) stays fast.
    returnSuppressMs: 1600,
  },
  // Flick (overlay dismiss): burst FSM — origin captured when speed exceeds
  // minVelocity; verdict at the deceleration edge by distance back to that
  // origin (< maxDisplacement). A fast move lasting longer than
  // maxDurationMs is swipe-like and cancels the burst.
  flick: { minVelocity: 2.5, maxDisplacement: 0.12, maxDurationMs: 250, cooldownMs: 700 },
  // Two-hand spatial (M3): spread-zoom + rotate over the 3D gallery, and
  // pull-apart over an armed project card. Suppressed emits do NOT advance
  // the prev baselines — slow deliberate motion accumulates past the dead
  // zone; zero-mean jitter never does.
  twoHand: {
    engageMs: 200,           // both hands stable this long before engaging (spec §4)
    releaseGraceMs: 150,     // one hand briefly lost ≠ exit; < cursor.graceMs
    zoomGain: 1.0,           // exponent on the span ratio (1.0 = physical)
    rotateGainPx: 1000,       // px per radian of hand-line twist (×0.01 = model rad; 1.4:1)
    spanDeadZone: 0.015,     // |ratio−1| below this = landmark jitter, no emit
    rotateDeadZoneRad: 0.01,
    minSpan: 0.08,           // hands nearly overlapping → geometry unstable, freeze
    maxStepRad: 0.35,        // per-frame angle jump = pairing flip → skip + rebaseline
    pullRatio: 1.6,          // span growth over baseline that fires pull-apart (spec)
    pullCooldownMs: 1200,    // spec
  },
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
  ["poses.extendRatio", "pose extend", 1.2, 2.2, 0.01],
  ["poses.curlRatio", "pose curl", 0.6, 1.5, 0.01],
  ["scroll.gain", "scroll gain", 0.5, 6, 0.1],
  ["scroll.momentumDecay", "scroll decay", 0.5, 8, 0.1],
  ["swipe.minVelocity", "swipe vel", 0.4, 3, 0.05],
  ["swipe.minDisplacement", "swipe disp", 0.1, 0.5, 0.01],
  ["swipe.gapMinDisplacement", "gap disp", 0.1, 0.5, 0.01],
  ["swipe.gapExitVelocity", "gap exitV", 0, 2, 0.05],
  ["swipe.primeDwellMs", "arm dwell", 100, 800, 25],
  ["swipe.primeMaxSpeed", "arm stillV", 0.05, 0.6, 0.01],
  ["swipe.primeGraceMs", "arm grace", 200, 1200, 50],
  ["swipe.returnSuppressMs", "return supp", 0, 3000, 100],
  ["flick.minVelocity", "flick vel", 1, 6, 0.1],
  ["flick.maxDisplacement", "flick disp", 0.04, 0.3, 0.01],
  ["twoHand.zoomGain", "2h zoom", 0.4, 3, 0.1],
  ["twoHand.rotateGainPx", "2h rotate", 20, 200, 5],
  ["twoHand.spanDeadZone", "2h dead", 0.005, 0.05, 0.005],
  ["twoHand.pullRatio", "pull ratio", 1.2, 2.5, 0.05],
  ["twoHand.engageMs", "2h engage", 100, 600, 25],
  ["twoHand.releaseGraceMs", "2h grace", 60, 400, 10],
];

// Hand mode is desktop-only: needs camera access and a fine pointer device.
export function isHandModeSupported() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !(typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches)
  );
}
