# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Aziz Syed's portfolio site — a single React 19 + Vite + React Router 7 SPA that ships from `client/`. Deployed to Render at `azizsyed-porfolio.onrender.com` (deploy config is in Render's dashboard, **not** in this repo).

The current state is a port of a Claude Design handoff (extracted to `.design-bundle/aziz-s-portfolio/`). The brief that governs scope is `portfolio-phase1-implementation-plan.md` at the repo root — read it before making non-trivial changes. It defines two phases:

- **Phase 1 (current):** the redesign, mouse + keyboard only.
- **Phase 2 (future):** hand-tracking control via MediaPipe.

**Do not introduce camera code, `getUserMedia`, MediaPipe, or anything in `src/hand/` during Phase 1.** That folder is a deliberate placeholder.

## Common commands

All commands run from `client/`. On Windows, `vite` isn't on PATH — use `npx vite` or the `npm run` scripts.

```bash
cd client
npm install
npm run dev          # vite dev server (default http://localhost:5173)
npm run build        # vite build → client/dist (Render's publish dir)
npm run preview      # serve the production build locally
npm run lint         # eslint . --ext js,jsx --max-warnings 0
```

There are **no tests** in this repo. Verification is manual + Playwright MCP.

`client/.env.local` (gitignored) supplies `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`. Without them the contact form errors at submit time but the rest of the site works. See `client/.env.example`.

## Architecture — the parts that need cross-file context

### The provider stack (`client/src/App.jsx`)

The app is wrapped in five providers in this order:

```
ThemeProvider → ModeProvider → GalleryProvider → OverlayProvider → BrowserRouter
```

All five expose hooks consumed via `useActions()`. Don't reorder them — `useActions` reads from all of them in a single composed hook, and the navigation seam needs Router inside.

### The intent / action layer (`client/src/intents/actions.js`)

This is the **central architectural principle**, also explained in `portfolio-phase1-implementation-plan.md`. Every interaction in the app — navigation, opening overlays, switching themes, rotating the 3D model, copying email to clipboard — flows through `useActions()`:

```js
const actions = useActions();
actions.goToPage('about');
actions.openProject('mye46');
actions.setTheme('chartreuse');
actions.copyField(email);
```

**Components must not bind click handlers directly to `navigate()`, `setTheme`, or overlay state.** Phase 2 will swap mouse/keyboard input for gesture recognizers at the same call sites — that only works if every interaction is an action call. Touching this is fine; bypassing it for "one quick thing" is a Phase-2 regression.

`KeyboardController.jsx` (mounted globally) implements the keyboard side: `1`–`6` → `goToPage`, `H` → `toggleCheatSheet`, `Esc` → `closeOverlay`, `[` / `]` → `cycleTheme(-1/1)`.

### Routes — exactly 6, no more

```
/  /about  /services  /projects  /contact  /log
```

Defined in `ROUTE_BY_ID` in `actions.js` and wired up in `App.jsx`. The design has several HUD-state HTML files (boot sequence, theme dial, sensor PIP, gesture cheat sheet, exploded views) — **those are overlays, not routes**. Adding a 7th `<Route>` breaks the brief.

### Overlays (`client/src/overlays/`)

`OverlayHost.jsx` is mounted once at App level. It reads `OverlayContext` and conditionally renders `CheatSheet`, `ExplodedView`, `BootSequence`, `HudReticle`. New overlays go through the same pattern — never as routes.

`ExplodedView` reads `OverlayContext.openProjectId` and looks up the project via `PROJECTS_BY_ID` from `src/content/projects.js`. Each featured project carries its own `layers` array describing the exploded layout.

### Theme system (`client/src/theme/`)

Nine palettes (8 user + 1 HUD) live as CSS-variable token sets in `tokens.css`. Each is selected by `:root[data-theme="X"]` — the leading `:root` is intentional: it bumps specificity from `(0,1,0)` to `(0,2,0)` so per-theme rules win against any plain `:root { --bg: ... }` block. **Don't reintroduce a `:root` color-token block in `design.css`** — that bug shipped once, see commit `2f476e8`.

Theme switching is `actions.setTheme(id)` → `ThemeProvider` writes `document.documentElement.dataset.theme` → CSS variables cascade → page recolors. Persisted in `localStorage` under `portfolio.theme`.

`design.css` (~2161 lines, copied verbatim from `.design-bundle/aziz-s-portfolio/project/styles.css`) is the visual layer the components match. Treat it as upstream — when porting new design elements, copy from the bundle's `styles.css` and use the existing class names.

### Content as data (`client/src/content/`)

Project descriptions, capabilities, log entries, the tech stack, bio, and experience all live as JS modules in `src/content/`. Editing copy or adding a project is a data-only change. Avoid putting strings into components.

### 3D gallery — two implementations

- `client/src/components/Gallery3D.jsx` — the SVG/CSS version from the design (always renders, no WebGL). This is what the Home page currently mounts.
- `client/src/three/GalleryScene.jsx` — a real R3F + drei scene that loads `/models/e46.glb`. Built but not wired into Home yet. When integrating, the intended path is to **keep `Gallery3D`'s framing chrome** (corner brackets, OBJ readout, thumbnails, memory-core caption) and swap only the `.g3d-stage` inner for the R3F canvas when the active object is the E46.

### StackConstellation (`client/src/components/StackConstellation.jsx`)

The Services page's tech-stack visualization. The most complex single component in the repo (~290 lines):
- Per-word organic drift via layered sines (rAF tick).
- Hover lights up the top-16 co-occurrence edges via raw SVG `<line>` updates.
- Mousedown + drag + fast release throws the word; springy wall bounces; auto-settle home.
- ⟲ scatter button assigns random velocities to all words.
- Falls back to a grid view on `prefers-reduced-motion` or `≤760px`.

The component's `S.current.pointer` / `S.current.grabbed` shape is the **Phase 2 input seam** — a future `useHandPointer()` hook will set those fields from gesture data without changing the rAF loop. Don't refactor that shape away.

### Design bundle (`.design-bundle/aziz-s-portfolio/`)

The Claude Design handoff bundle is committed at the repo root. Its `project/` folder holds the HTML/JSX/CSS prototypes the React port is matching. When in doubt about visual intent, the bundle is authoritative — read `project/styles.css`, the page mockups, and the original `app.jsx`/`pages.jsx`/`shell.jsx` source.

## Project-specific rules (from the brief)

- **Six routes, period.**
- **Action layer is mandatory** for every interaction.
- **Overlays are components, not URLs.**
- **CSS-variable themes only** — no inline color hex codes outside `tokens.css` and the design layer.
- **`src/hand/` stays empty in Phase 1.** It exists as a marker for the Phase 2 MediaPipe port.
- **No tests, no TypeScript** (the user's brief was explicit: React 19 + JS + Vite + React Router).

## Deploy

Render auto-deploys on push to `main`. Build is `cd client && npm install && npm run build`; publish dir is `client/dist`. EmailJS env vars must also be set in Render's dashboard for the contact form to send in production.
