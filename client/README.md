# Portfolio — client app

The React SPA for **Aziz Syed's portfolio**. Single-page app built with React 19 + Vite; this `client/` folder is the entire deployable.

Live: [azizsyed-porfolio.onrender.com](https://azizsyed-porfolio.onrender.com)

For the product overview see [`../README.md`](../README.md); for architecture ground rules (the action layer, overlays-vs-routes, the theme specificity gotcha) see [`../CLAUDE.md`](../CLAUDE.md).

## Stack

- **React 19** + **React Router 7**
- **Vite 5** (SWC fast refresh) — plain JS, no TypeScript
- **three** + **@react-three/fiber** + **@react-three/drei** — the 3D gallery
- **framer-motion** — transitions
- **@emailjs/browser** — contact form
- **@mediapipe/tasks-vision@0.10.32** — Phase 2 hand tracking
- **vite-plugin-static-copy@^2** — serves the MediaPipe WASM locally (never from a CDN)

## Commands

`vite` isn't on PATH on Windows — use the `npm run` scripts (or `npx vite`).

```bash
npm install
npm run dev       # Vite dev server — http://localhost:5173 (falls back to 5174/5175 if taken)
npm run build     # production build → client/dist
npm run preview   # serve the production build locally
npm run lint      # eslint . --max-warnings 0
```

There are no tests; verification is manual + Playwright.

## Environment

The contact form uses EmailJS. Copy `.env.example` → `.env.local` (gitignored) and fill in:

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

Without them only the contact form's submit errors — the rest of the site works. (In production these must also be set in Render's dashboard.)

## Project structure

```
src/
  pages/        the 6 routes (/  /about  /services  /projects  /contact  /log)
  components/   Gallery3D, StackConstellation, header / shell primitives, …
  overlays/     cheat sheet, exploded view, boot sequence, HUD reticle, sensor PIP, hand Contact
  intents/      the action layer (useActions) + context providers — every interaction flows through here
  theme/        9 palette token sets, ThemeProvider, design.css
  three/        R3F gallery scene + scenePresets.js
  content/      projects, capabilities, log, stack, bio — copy as editable data
  hand/         Phase 2 MediaPipe hand-control pipeline (implemented)
public/
  models/       GLB assets + hand_landmarker.task
  mediapipe/    WASM copied in at build time
```

## Hand mode (Phase 2)

Optional webcam hand control. Toggle it from the on-screen hand pill — gesture recognizers drive the **same `useActions()` intent layer** as mouse/keyboard, so the site stays fully usable with no camera (hand mode is desktop-only, gated by `isHandModeSupported`). Gestures: open-palm cursor, pinch to click, fist-scroll, swipe to change page, two-hand zoom/rotate the 3D model, turn-to-pick theme dial, and in Contact a pinch-grab-and-lift "envelope" send.

Append `?debug=hand` to any URL for the live tuning overlay and the `window.__handDebug` synthetic-frame surface used for testing.

## Keyboard

`1`–`6` navigate · `H` toggles the gesture cheat sheet · `[` / `]` cycle the 9 palettes · `Esc` closes any overlay.

## Deploy

Render auto-deploys on push to `main`: build `cd client && npm install && npm run build`, publish dir `client/dist`. EmailJS env vars must be set in the Render dashboard for the form to send in production.
