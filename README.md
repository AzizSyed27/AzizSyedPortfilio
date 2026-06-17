# Aziz Syed — Portfolio

Live: [azizsyed-porfolio.onrender.com](https://azizsyed-porfolio.onrender.com)

A redesign of my personal portfolio. The original was a 5-page Vite + React build for COMP229 Assignment 1; this version is a redesigned spatial portfolio with a working build log, 8 swappable color themes + an HUD theme, in-place project "exploded view" overlays, a 3D gallery, and an interactive tech-stack constellation.

It's also the substrate for an experiment that's now shipped: optional **hand-tracking control**, where you steer the page with gestures via your webcam. Phase 1 is the redesigned site on mouse + keyboard; Phase 2 adds an optional MediaPipe pipeline that drives every interaction through the same action layer — an open-palm cursor with pinch-to-click, fist-scroll, swipe-to-navigate, two-hand zoom/rotate of the 3D model, a gesture theme dial, a voice-fill Contact form, and pinch-grab-throw physics in the tech-stack constellation and exploded project views. The site stays fully usable with no camera.

## Stack

- React 19 + React Router 7
- Vite 5 (SWC fast refresh)
- `three` + `@react-three/fiber` + `@react-three/drei` — 3D gallery
- `@mediapipe/tasks-vision` — in-browser hand tracking (Phase 2); WASM served locally via `vite-plugin-static-copy`
- `framer-motion` — transitions
- `@emailjs/browser` — contact form
- Plain JS, no TypeScript
- Deployed on Render

## Pages

```
01 Index     02 About     03 Services
04 Work      05 Contact   06 Log
```

Keys `1`–`6` navigate. `H` toggles the gesture cheat sheet. `[` and `]` cycle through the 9 color palettes. `Esc` closes any open overlay.

## Run it locally

```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

Contact form needs three EmailJS env vars in `client/.env.local` — see `client/.env.example`. The rest of the site works without them.

## Project structure

```
client/
  src/
    pages/         the 6 routes
    components/    header, shell primitives, hero band, capability radar, …
    overlays/      cheat sheet, exploded view, boot sequence, HUD reticle, sensor PIP, theme dial, hand-mode Contact
    intents/       the action layer + context providers
    theme/         9 palette token sets, ThemeProvider, design.css
    three/         R3F scene for the 3D gallery
    content/       projects, capabilities, log entries, bio (editable as data)
    hand/          the Phase 2 MediaPipe hand-control pipeline (cursor, gestures, arbitrator, config)
  public/
    models/        e46.glb and friends + hand_landmarker.task
    mediapipe/     MediaPipe WASM (copied in at build time)
.design-bundle/    Claude Design handoff this build is matching
```

The phase briefs live in `portfolio-phase1-implementation-plan.md` and `portfolio-phase2-hand-control-plan.md`. Architectural ground rules — for the action layer, the overlay-vs-route boundary, the theme system specificity gotcha — are in `CLAUDE.md`.

## Status

- Phase 1 — feature-complete on mouse + keyboard. Theme switching, overlays, 3D scene, contact form, the constellation, and all project/About content are wired.
- Phase 2 — shipped. Optional webcam hand control behind the action layer: camera + skeleton PIP, hand cursor with pinch-to-click, fist-scroll, swipe navigation, two-hand zoom/rotate, a gesture theme dial, voice-fill Contact, and pinch-grab-throw physics. Desktop + webcam only; the site degrades cleanly to mouse/keyboard with no camera.
