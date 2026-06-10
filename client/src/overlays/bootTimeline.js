// Single source of truth for the boot-sequence timeline. Phase durations are
// DERIVED from the animation schedules here (not guessed alongside them), so the
// ModeProvider clock and the in-component animations can never drift apart.
//
// Chain: standby → calibrating[black → cli → hud] → live.

// ── Phase 0 · black pre-roll ────────────────────────────────────────
export const BLACK_MS = 900;

// ── Phase 1 · CLI typewriter ────────────────────────────────────────
export const CLI_CHAR_MS = 9;    // ms per character
export const CLI_LINE_PAUSE = 70; // ms pause between lines
export const CLI_READ_PAUSE = 380; // tail pause once typed

// kind drives styling: cmd (accent), dim (muted), ok (teal stamp), wait (cyan), prompt (accent)
export const CLI_LINES = [
  { text: "> handctrl --engage", kind: "cmd" },
  { text: "booting HANDCTRL v3.0.0 · build a1z9f3c", kind: "dim" },
  { text: "[ ok ] optical tracking module ........ online", kind: "ok" },
  { text: "[ ok ] identity · Aziz Syed / Scarborough ON", kind: "ok" },
  { text: "[ ok ] modules · CV / 3D / Agents / Geospatial", kind: "ok" },
  { text: "[ .. ] calibrating optical array .............", kind: "wait" },
  { text: "[ ok ] gesture model · open palm loaded", kind: "ok" },
  { text: "> raise an open palm to engage", kind: "prompt" },
];

export const CLI_MS =
  CLI_LINES.reduce((sum, l) => sum + l.text.length * CLI_CHAR_MS + CLI_LINE_PAUSE, 0) +
  CLI_READ_PAUSE;

// ── Phase 2 · staged JARVIS HUD boot ────────────────────────────────
// The visor powers on in a wave, then locks on, then stamps ONLINE. HUD_MS is
// sized to contain that schedule with a short hold.
export const HUD_MOD_STEP = 110;  // stagger between module power-ons
export const HUD_MOD_DUR = 520;   // each module's power-on duration
export const HUD_LOCKON_MS = 2200; // reticle lock-on beat
export const HUD_STAMP_MS = 3400;  // "HAND CTRL ONLINE" stamp
export const HUD_MS = 4000;        // total (stamp + ~600ms hold → dissolve)
export const HUD_DISSOLVE_MS = 450; // tail fade-out before live
