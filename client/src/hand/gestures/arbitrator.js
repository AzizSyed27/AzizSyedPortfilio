// The one-owner-per-frame interaction state machine (spec §4). Exactly one
// gesture family owns any frame; everything else is suppressed. Two writers
// share it — HandCursor (CURSOR↔PINCH_ACTIVE only) and HandGestures
// (everything else) — and to() validates every transition against the
// allowed map, so an out-of-order write is rejected and logged rather than
// corrupting state. The mutable object identity is shared via the pipeline
// context (same pattern as TUNE).

export const ARB_STATES = [
  "IDLE",          // no hand
  "CURSOR",        // hand present, cursor active (M1 default)
  "PINCH_ACTIVE",  // pinch held (click fired on entry)
  "SCROLL",        // fist-scroll owns the frame; cursor suppressed
  "SWIPE_COOLDOWN",// swipe fired; suppress everything until cooldown ends
  "TWO_HAND",      // M3: both hands engaged — spread-zoom / rotate / pull-apart
  "DIAL",          // M4: modal theme dial; only turn + pinch-commit + flick-cancel
];

const ALLOWED = {
  IDLE: ["CURSOR"],
  CURSOR: ["IDLE", "PINCH_ACTIVE", "SCROLL", "SWIPE_COOLDOWN", "TWO_HAND", "DIAL"],
  // PULL grips are pinches/fists: the primary hand legitimately transits
  // PINCH_ACTIVE or SCROLL in the ~engageMs before TWO_HAND wins the frame.
  // PINCH_ACTIVE → DIAL: pinching the theme pill passes through PINCH_ACTIVE.
  PINCH_ACTIVE: ["CURSOR", "IDLE", "TWO_HAND", "DIAL"],
  SCROLL: ["CURSOR", "IDLE", "TWO_HAND"],
  SWIPE_COOLDOWN: ["CURSOR", "IDLE"],
  TWO_HAND: ["CURSOR", "IDLE"],
  DIAL: ["CURSOR", "IDLE"],
};

const LOG_LEN = 10;

export function createArbitrator() {
  const arb = {
    state: "IDLE",
    enteredAtMs: 0,
    // Per-frame context written by the controllers, read by PIP/debug/gates.
    context: {
      overlayOpen: false,
      pose: null,
      candidatePose: null,
      swipeArmed: false,
      lastPinchReleaseMs: -Infinity,
      armedProject: null, // data-hand-project of the snapped card (HandCursor writes)
      twoHandMode: null,  // 'SPATIAL' | 'PULL' while TWO_HAND owns the frame
      dialIndex: 0,        // selected theme detent while DIAL owns the frame
      requestDial: false,  // HandCursor sets this on a pinch over the theme pill
      requestDialClose: false, // KeyboardController sets this on Esc during the dial
    },
    cooldowns: { swipe: -Infinity, flick: -Infinity, pull: -Infinity, dial: -Infinity },
    // Direction + timestamp of the last fired swipe — the return-motion
    // suppression reads this (a hand returning to rest after a swipe moves
    // in the opposite direction and must not navigate back).
    lastSwipe: { dir: null, tMs: -Infinity },
    transitions: [],

    to(next, reason, nowMs) {
      if (next === arb.state) return false;
      if (!ALLOWED[arb.state]?.includes(next)) {
        arb.transitions.push({ from: arb.state, to: next, reason: `REJECTED: ${reason}`, tMs: nowMs });
        if (arb.transitions.length > LOG_LEN) arb.transitions.shift();
        return false;
      }
      arb.transitions.push({ from: arb.state, to: next, reason, tMs: nowMs });
      if (arb.transitions.length > LOG_LEN) arb.transitions.shift();
      arb.state = next;
      arb.enteredAtMs = nowMs;
      return true;
    },

    // Log an instantaneous event (e.g. "FLICK fired") without a state change.
    note(event, nowMs) {
      arb.transitions.push({ from: arb.state, to: arb.state, reason: event, tMs: nowMs });
      if (arb.transitions.length > LOG_LEN) arb.transitions.shift();
    },

    canFire(gesture, nowMs, cooldownMs) {
      return nowMs - arb.cooldowns[gesture] > cooldownMs;
    },

    reset() {
      arb.state = "IDLE";
      arb.enteredAtMs = 0;
      arb.context.overlayOpen = false;
      arb.context.pose = null;
      arb.context.candidatePose = null;
      arb.context.swipeArmed = false;
      arb.context.lastPinchReleaseMs = -Infinity;
      arb.context.armedProject = null;
      arb.context.twoHandMode = null;
      arb.context.dialIndex = 0;
      arb.context.requestDial = false;
      arb.context.requestDialClose = false;
      arb.cooldowns.swipe = -Infinity;
      arb.cooldowns.flick = -Infinity;
      arb.cooldowns.pull = -Infinity;
      arb.cooldowns.dial = -Infinity;
      arb.lastSwipe.dir = null;
      arb.lastSwipe.tMs = -Infinity;
      arb.transitions.length = 0;
    },
  };

  return arb;
}
