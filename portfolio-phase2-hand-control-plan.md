# Phase 2 — Hand Control Implementation Plan (for Claude Code)

**Goal:** Add the optional hand-tracking control layer to the shipped Phase 1 portfolio. Every gesture calls the **existing intents** — no rewiring of pages or overlays. Mouse/keyboard remains fully functional at all times; hand mode is an additive input source.

**What Phase 1 already provides (the contract):**
- `intents/` action layer: `goToPage / nextPage / prevPage / openProject / closeOverlay / setTheme / scrollBy / rotateModel / zoomModel / selectGalleryItem / toggleCheatSheet / copyField / openLink / toggleHandMode`
- Overlays as components: boot sequence, exploded view, theme wheel, cheat sheet, HUD reticle
- `ModeProvider` (mouse | hand) with the wrap-slot for the pipeline provider
- 9th palette = Blue/Black HUD theme; boot already switches to it
- Empty `src/hand/` directory; `e46.glb` in `public/models`
- HTTPS on Render (required for `getUserMedia`)

**What we port from ASL-Hand-Coach:** `useHandTracking` (camera + HandLandmarker loop), `features.js` (wrist-centered, palm-scaled, handedness-mirrored landmark normalization), `classify.js` (template cosine-similarity pose matching), `stability.js` (debounced discrete-state filter), the `HandPipelineProvider` pattern, and the camera/skeleton overlay component (restyle as the `SENSOR · LIVE` PIP).

---

## 0. Decisions to confirm at kickoff

1. **JS vs TS:** The repo is plain JS (per CLAUDE.md); the ASL files are TS. **Default: convert the ported files to plain JS** during the port (mechanical — strip types) for repo consistency. Alternative (Vite supports it with zero config): keep `hand/` as the one TS island. Pick one at audit; don't mix styles elsewhere.
2. **MediaPipe packaging:** use `@mediapipe/tasks-vision` HandLandmarker, `numHands: 2`, `runningMode: 'VIDEO'`, GPU delegate with CPU fallback. Bundle the `.task` model file locally in `public/models/` (don't hot-load from CDN at runtime).
3. **Desktop-only:** hand mode is hidden/disabled on touch/mobile devices (`pointer: coarse` + no `getUserMedia` video input check). Mobile gets the normal site.

## 1. Architecture

```
src/hand/
  HandPipelineProvider.jsx   camera + landmarker loop; publishes per-frame HandFrame(s)
  useHandTracking.js          ported ASL hook (camera lifecycle, detectForVideo loop)
  features.js                 ported normalization (wrist-centered, palm-scaled, mirrored)
  classify.js                 ported template pose matcher
  stability.js                ported discrete-state debouncer
  oneEuro.js                  NEW — continuous cursor smoothing
  cursor/
    CursorController.js       palm → screen mapping, smoothing, comfort box
    snapping.js               magnetic target registry + pull logic
    HandCursor.jsx             reticle rendering (uses Phase 1 HUD reticle)
  gestures/
    arbitrator.js             ONE global interaction-state machine (owns priority)
    pinch.js fist Scroll.js swipe.js flick.js
    twoHand.js                spread/zoom, rotate, pull-apart
    palmUp.js                 summon
    themeDial.js              modal dial controller (wrist-roll → angle → detents)
  config.js                   EVERY threshold/gain in one tunable file
  debug/DebugOverlay.jsx      ?debug=hand — raw vs filtered cursor, FSM states, fps
```

**Data flow:** camera frame → HandLandmarker → `HandFrame { landmarks[2], handedness, tMs }` → features → (a) continuous controllers (cursor, scroll delta, dial angle, two-hand metrics) and (b) discrete pose classification → stability filter → **arbitrator** → gesture FSMs → **intents**. Recognizers never touch the DOM or React state directly; they only call intents.

**Pose vocabulary (classify.js templates + geometric checks):** `OPEN_PALM`, `FIST`, `PINCH` (geometric: thumb-tip↔index-tip distance / knuckle-span, with hysteresis — not a template), `PALM_UP` (palm-normal orientation check), `POINT` (optional later). Record new templates with the ASL capture flow if needed.

## 2. The cursor (the make-or-break system)

- **Source point:** stable palm centroid (mean of wrist + MCP knuckles), not the fingertip — far less jitter.
- **Comfort box mapping:** map a small central region of camera space (~55% width, ~50% height, biased slightly low) to the full viewport, so small relaxed hand motions cover the whole screen. This is the #1 anti–gorilla-arm measure. Mirror X (webcam is mirrored).
- **Smoothing:** one-euro filter on x/y. Starting params: `freq=30, minCutoff=1.0, beta=0.007, dCutoff=1.0` — expose in `config.js` and tune live via the debug overlay.
- **Magnetic snapping:** interactive elements register as snap targets (a `data-hand-target` attribute + a registry that caches rects on layout change). When the cursor is within `snapRadius` (~60px) of a target's rect, pull the rendered reticle toward its center with spring easing and set the target's armed/hover state (Phase 1's armed style + bigger hand-mode hit padding). The *logical* cursor keeps moving; only the rendered + click position snaps. Reticle shows the target code (`→ P/02`).
- **Hover/click dispatch:** while snapped, fire the element's hover intent; on `PINCH` down, trigger its action via the intent layer (fall back to a synthetic `.click()` for plain links). Freeze click position at pinch-start so the click doesn't drag.

## 3. Gesture specs

All thresholds live in `config.js`. Every discrete gesture uses enter/exit **hysteresis** plus the ported stability filter, and a **cooldown** to prevent double-fires.

| Gesture | Signal | Enter / exit | Fires | Cooldown |
|---|---|---|---|---|
| Pinch (click) | thumb↔index dist ÷ knuckle span | < 0.40 / > 0.55 | snapped target's action; else `closeOverlay` no-op | 250ms |
| Pinch-hold | pinch sustained 600ms on copy/link target | — | `copyField` / `openLink` (+ ring-fill progress UI) | 500ms |
| Fist + move | `FIST` pose held; wrist Δy × gain | pose stable 120ms / pose lost | `scrollBy(dy)` continuous; momentum on release | — |
| Swipe | `OPEN_PALM` lateral wrist velocity > vₓ AND displacement > 25% frame width within 350ms | — | `nextPage` / `prevPage` | 900ms |
| Flick | short high-velocity burst (any dir) from open palm or after pinch | — | context: `closeOverlay`; in Contact send-zone: submit | 700ms |
| Palm-up | palm normal facing up, held 500ms | — | summon theme dial (arbitrator → `DIAL` state) | 800ms |
| Two-hand spread | both hands tracked; Δ(wrist-distance) ratio | both visible 200ms / one lost | `zoomModel(factor)` — only on zoomable surfaces (gallery, exploded view) | — |
| Two-hand rotate | angle of wrist→wrist line | same | `rotateModel(dθ)` — gallery only | — |
| Pull-apart | both hands `FIST`/`PINCH` while cursor snapped to a project card; wrist distance grows > 1.6× | — | `openProject(id)` (exploded view) | 1200ms |
| Theme dial (modal) | entered by pinching the theme pill OR via palm-up summon → arbitrator enters `DIAL` state. Wrist roll = angle of index-MCP→pinky-MCP vector; map ~150° comfortable roll to full wheel; **detents** snap to 8 slots with live theme preview (`setTheme` on each detent); pinch commits, flick cancels (reverts) | — | `setTheme` | — |

## 4. Arbitration (one owner at a time)

Global state machine in `arbitrator.js`: `IDLE → CURSOR → (SCROLL | SWIPE-window | TWO_HAND | DIAL | PINCH-active)`. Rules:
- Exactly one gesture family owns the frame; others are suppressed (e.g., no swipe while fist-scrolling; no cursor while two-hand active; in `DIAL`, only dial + commit/cancel gestures exist).
- Two-hand states require both hands stable for 200ms before engaging and exit gracefully when one hand drops (no snap-back).
- Modal overlays (exploded view, dial, cheat sheet) shrink the active gesture set to what's meaningful inside them.
- Every state transition is visible in the debug overlay.

## 5. Lifecycle, calibration & fallbacks

- **Pill → LIVE flow:** pill click → `getUserMedia` permission → on grant: boot sequence (exists) → **calibration step folded into boot**: "raise your hand" → first stable `OPEN_PALM` 1s completes boot and is the moment tracking goes LIVE (doubles as tutorial start; cheat sheet auto-shows once).
- **Fallbacks (no dead ends):** permission denied / no camera / mobile → small notice, stay in mouse mode, pill returns to STANDBY. Tab hidden → pause pipeline (stop the loop, keep stream). No hand 10s → idle `AWAITING INPUT · RAISE HAND` prompt (exists). No hand 60s → soft-pause inference to save GPU until motion resumes? (cheap: keep detecting at 5fps.)
- **Exit:** pill click or `Esc` ends hand mode, releases the camera fully (stream tracks stopped — the camera light must go off), theme stays wherever the user left it.

## 6. Contact page (hand mode)

- **Build the hand-mode UI variant first:** the hand-mode Contact UI exists only as a Claude Design mockup — it was never implemented in Phase 1 (mouse-only scope). When `mode === 'hand'`, the Contact page renders the variant per the design: `◉ LISTENING` field states, "pinch to copy / pinch to open" tags beside the contact details and links, and the flick-to-launch send styling. Mouse mode keeps the existing Phase 1 form untouched.

- **Speech-to-text:** Web Speech API (`SpeechRecognition`) per field — pinch a field to start, `◉ LISTENING` indicator (designed), live interim transcript, pinch again to stop. **Caveats to implement honestly:** Chrome/Edge only (feature-detect; hide the affordance otherwise — keyboard always works), and Chrome processes audio in the cloud — show a one-line disclosure on first use. Mic permission requested lazily, only when a field is pinched.
- **Flick-to-send:** with the form valid, flick up over the send zone → existing EmailJS submit intent + launch animation. Normal SEND button always present.
- **Pinch-hold copy/open:** email/phone → `copyField` with a copied-confirmation; github/linkedin → `openLink`.

## 7. Performance budget

- Landmarker on the rAF loop with `detectForVideo(video, performance.now())`; **cap inference at ~30fps** (skip frames) — cursor smoothing interpolates between detections so the reticle still renders at display fps.
- When hand mode goes LIVE: drop R3F `dpr`, pause gallery autorotation/idle animation, lower model LOD (the adaptive-LOD groundwork from Phase 1). This is also a talking point — the site visibly sheds GPU load for the tracker.
- Watch for main-thread jank: tasks-vision GPU delegate keeps inference off the CPU mostly; if profiling shows contention, frame-skip further before reaching for a worker.
- PIP shows real fps + landmark count (designed) — it doubles as your always-on perf monitor.
- **Privacy-first PIP:** the PIP renders ONLY the hand-landmark skeleton (+ connectors) drawn on a themed background canvas — it must NEVER display the raw camera video. The `<video>` element exists solely as hidden offscreen input to the landmarker. This is both a privacy statement and on-aesthetic: the HUD sees a wireframe hand, not your room.

## 8. Debug & tuning workflow

`?debug=hand` mounts the debug overlay: raw vs filtered cursor trails, current arbitrator state, live pose label + confidence, per-gesture threshold readouts, inference ms. All of `config.js` is hot-tweakable from this panel (sliders writing to the config object). Tuning thresholds is 50% of the feel — make it fast.

## 9. Build order (each milestone independently shippable)

- **M0 — Port & see:** port the 4 ASL modules (JS conversion), `HandPipelineProvider` wired into ModeProvider's slot, camera PIP live with the landmarks-only skeleton + fps (no raw video, ever). *Accept: toggle pill → boot → see your tracked hand as a wireframe in the PIP. No control yet.*
- **M1 — Cursor + click:** CursorController, one-euro, comfort box, snapping registry, armed states, pinch-click. *Accept: navigate the whole site — hover anything, click anything — by hand. This is 80% of the value; tune it until it feels good before moving on.*
- **M2 — Scroll, swipe, flick:** fist-scroll with momentum, page swipes, flick-dismiss on overlays, arbitrator preventing cross-talk. *Accept: full 6-page browse without touching the mouse.*
- **M3 — Two-hand spatial:** spread-zoom + rotate in the 3D gallery; pull-apart → exploded view; flick to collapse. *Accept: the demo-reel moment works.*
- **M4 — Theme dial:** modal dial with detents, live preview, pinch-commit, flick-cancel. *Accept: theme change start-to-finish by hand.*
- **M5 — Contact + hardening:** build the hand-mode Contact UI variant (per design — it doesn't exist in the Phase 1 build), then speech-to-text, flick-send, pinch-hold copy/open; all fallbacks (denied/no-cam/mobile/tab-hidden/exit-releases-camera); perf pass against the budget; cheat-sheet/idle polish. *Accept: a stranger on a random laptop can boot it, learn it from the boot tutorial, and never hit a dead end.*

## 10. Risks & mitigations

- **Fatigue (gorilla arm):** comfort-box mapping + low gains + snapping mean small lazy motions suffice. Test sitting back in a chair, elbow on desk.
- **False positives:** hysteresis + stability filter + arbitrator exclusivity + cooldowns. The swipe is the usual offender — require both velocity AND displacement.
- **GPU contention with R3F:** the LIVE-mode LOD drop; measure with the PIP fps readout.
- **Speech support/privacy:** feature-detect, disclose cloud processing, keyboard fallback.
- **Lighting/skin-tone/low-end cams:** confidence gating from the landmarker (drop low-confidence frames to idle rather than letting the cursor wander); test in bad lighting early, not last.
