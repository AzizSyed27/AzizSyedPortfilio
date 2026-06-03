# Aziz Syed — Portfolio

The source for [azizsyed-porfolio.onrender.com](https://azizsyed-porfolio.onrender.com).

Originally built for COMP229 (May 2024). Currently mid-rebuild into a new design
with two distinct goals:

1. **A proper visual redesign** — editorial typography, 9 switchable color
   palettes, a 3D model gallery on the home page, an interactive tech-stack
   constellation, exploded-view overlays per project, and a build log.
2. **Optional hand-tracking control** — a forthcoming mode where you can
   navigate the whole site with hand gestures via your webcam (MediaPipe).
   Tony Stark, on a student budget.

The redesign was mocked up in [Claude Design](https://claude.ai/design) and is
being ported into React. The handoff bundle lives at `.design-bundle/` for
reference.

## Status

**Phase 1 — mouse + keyboard (in progress, mostly shipped)**

- React 19 + Vite + React Router 7, plain JavaScript.
- 6 routes (Home, About, Services, Work, Contact, Log).
- 9 themes with live switching via a dropdown or `[` / `]` keys.
- Keyboard navigation: `1`–`6` jumps routes, `H` toggles the gesture cheat
  sheet, `Esc` closes overlays.
- React Three Fiber gallery (E46 GLTF), capability radar, project flip-board,
  contact beacon with live local clock, interactive tech-stack constellation.
- EmailJS-backed contact form.

**Phase 2 — hand tracking (not started)**

A MediaPipe pipeline will dispatch the same in-app actions that mouse and
keyboard do today. The architecture is already shaped for it (every
interaction routes through a single action layer); `src/hand/` is an empty
placeholder for the gesture recognizers.

## Run locally

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

EmailJS credentials go in `client/.env.local` (see `client/.env.example`).
Without them the rest of the site works; only the contact form's send button
shows an error.

```bash
npm run build      # production build → client/dist
npm run lint
```

## Stack

React 19 · React Router 7 · Vite 5 · Framer Motion · React Three Fiber + drei ·
EmailJS · plain CSS with CSS-variable themes

## Notes

- `portfolio-phase1-implementation-plan.md` — the brief that governs scope.
- `CLAUDE.md` — architecture notes for working in the codebase.
- `.design-bundle/` — the Claude Design handoff (HTML/CSS/JS prototypes the
  React port is matching).
- Deploy is via Render (auto-deploy on push to `main`). Build config lives in
  Render's dashboard.
