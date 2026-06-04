# Aziz Syed — Portfolio

Live: [azizsyed-porfolio.onrender.com](https://azizsyed-porfolio.onrender.com)

A redesign of my personal portfolio. The original was a 5-page Vite + React build for COMP229 Assignment 1; this version is a redesigned spatial portfolio with a working build log, 8 swappable color themes + an HUD theme, in-place project "exploded view" overlays, a 3D gallery, and an interactive tech-stack constellation.

It's also the substrate for an ongoing experiment: optional **hand-tracking control**, where you steer the page with gestures via your webcam. Phase 1 (shipped) is the redesigned site driven by mouse and keyboard. Phase 2 (next) drops in the MediaPipe pipeline behind the same action layer.

## Stack

- React 19 + React Router 7
- Vite 5 (SWC fast refresh)
- `three` + `@react-three/fiber` + `@react-three/drei` — 3D gallery
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
    overlays/      cheat sheet, exploded view, boot sequence, HUD reticle
    intents/       the action layer + context providers
    theme/         9 palette token sets, ThemeProvider, design.css
    three/         R3F scene for the 3D gallery
    content/       projects, capabilities, log entries, bio (editable as data)
    hand/          empty placeholder for the Phase 2 MediaPipe port
  public/
    models/        e46.glb and friends
.design-bundle/    Claude Design handoff this build is matching
```

The Phase 1 brief lives in `portfolio-phase1-implementation-plan.md`. Architectural ground rules — for the action layer, the overlay-vs-route boundary, the theme system specificity gotcha — are in `CLAUDE.md`.

## Status

- Phase 1 — site is feature-complete on mouse + keyboard. Theme switching, overlays, 3D scene, contact form, and the constellation are all wired. A few content slots (3 featured-project write-ups, 4 About photos) await final assets.
- Phase 2 — outlined; not started.
