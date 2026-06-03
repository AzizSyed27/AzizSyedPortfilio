# Portfolio Rework — Phase 1 Implementation Plan (for Claude Code)

**Goal of Phase 1:** Replace the old portfolio's front-end with the new Claude Design redesign, as a properly structured **React 19 + JavaScript + Vite + React Router** app — fully usable with mouse/keyboard, all 6 pages and all overlays working, deployed and performant. **No hand tracking in Phase 1.** It is architected so Phase 2 (hand control) drops in without a refactor.

**Two-phase shape:**
- **Phase 1 (this doc):** the redesign, mouse/keyboard only.
- **Phase 2 (outlined at the end, detailed later):** the hand-control system, ported from the ASL project.

---

## The governing principle (read first)

Everything interactive goes behind an **intent/action layer**, driven by mouse/keyboard in Phase 1 and by gestures in Phase 2 — the same functions, different callers.

Define these as plain functions/context actions, NOT inline handlers:

| Intent | Phase 1 caller | Phase 2 caller |
|---|---|---|
| `goToPage(id)` / `nextPage()` / `prevPage()` | nav click, keys 1–6 | swipe |
| `openProject(id)` / `closeOverlay()` | card click / Esc | pinch / flick |
| `setTheme(id)` / `cycleTheme(dir)` | theme menu click | pinch-wheel |
| `scrollBy(dy)` / `scrollToTop()` | wheel/keys | fist-drag |
| `selectGalleryItem(i)` / `rotateModel(dx,dy)` / `zoomModel(f)` | drag / scroll | two-hand rotate / spread |
| `toggleCheatSheet()` | press `H` | palm-up / gesture |
| `toggleHandMode()` | pill click | (toggle only) |
| `copyField(x)` / `openLink(url)` | click | pinch |

If a component calls one of these instead of doing the work itself, Phase 2 is a drop-in. This also keeps the site 100% functional with no camera.

---

## Step 0 — Pre-flight audit (do before writing code)

1. **Inspect the old repo:** framework/build, **deployment config (render.com)**, custom domain, any **contact-form backend or serverless function**, reusable assets (résumé PDF, images, favicons), env vars. Preserve git history and deploy config — we keep this repo, we replace its front-end.
2. **Inspect the Claude Design export:** is it one file or componentized? Tailwind or plain CSS? This determines how much restructuring the port needs — report findings before bulk changes.
3. **Confirm the dependencies list at the bottom of this doc** (3D model, contact backend, real content) so we know what's a placeholder vs. real.

---

## Step 1 — Scaffold the target architecture

Mirror the ASL project's stack. Suggested structure:

```
src/
  pages/         Home, About, Services, Work, Contact, Log
  components/     Header, Footer, HandCtrlPill, SectionHeader, ProjectCard, Timeline, ...
  overlays/       ExplodedView, ThemeWheel, CheatSheet, BootSequence
  theme/          tokens for 8 palettes + blue/black HUD theme; ThemeProvider
  intents/        the action layer above (navigation, overlays, theme, scroll, gallery)
  mode/           ModeProvider (mouse | hand) — Phase 1 only ever "mouse"
  three/          R3F gallery scene, model loaders, mouse controls
  content/        bio, projects, experience, log entries, capabilities (data, not markup)
  hand/           EMPTY placeholder dir for Phase 2 (port ASL pipeline here later)
```

- **Routing:** React Router, 6 routes. Code-split each page route.
- **ModeProvider:** holds `mode` + `toggleHandMode()`. In Phase 1 hand mode is a no-op (or shows the boot preview); the provider and the slot where `HandPipelineProvider` will wrap routes exist now.
- **Content as data:** put copy/projects/log entries in `content/` so they're editable without touching markup (and so Phase 2 / future edits are easy).

## Step 2 — Theme system

- Express each of the 8 palettes + the blue/black HUD theme as **CSS-variable token sets**.
- `ThemeProvider` swaps the active token set. Drive it via `setTheme()` (mouse menu in Phase 1).
- Build the **theme wheel overlay UI** now, but in Phase 1 it's opened/operated by click; it just calls `setTheme()`. The pinch-to-rotate wiring is Phase 2.
- `toggleHandMode()` should set the active theme to blue/black (matching the boot), while leaving the user free to switch afterward.

## Step 3 — Build the pages (port each Design screen)

- **Home:** static sections + the **3D gallery** via React Three Fiber. Phase 1 controls = mouse drag-to-rotate (OrbitControls) + scroll-to-zoom, calling `rotateModel`/`zoomModel`/`selectGalleryItem`. Use placeholder GLTF/primitives if real models aren't ready. Stat count-up on scroll-into-view.
- **About:** photo cluster (real images), timeline with click-to-expand nodes via `expandNode()`.
- **Services:** capability blocks hover/expand; client-work rows hover/expand (same component pattern).
- **Work:** project cards with hover lift/tilt; **exploded view as an in-place overlay** (`openProject(id)`) that animates out of the clicked card with Framer Motion — page dims behind, no route change. Archive rows expand in place.
- **Contact:** normal keyboard form wired to a real backend (see deps). Speech-to-text and flick-to-send are **Phase 2** — Phase 1 ships the ordinary form + working send. Email/phone copy buttons and links call `copyField`/`openLink`.
- **Log:** the new 6th route, content from `content/`, long-scroll.

## Step 4 — Global chrome & overlays (mouse-first)

- **Header** (6 nav items, keys 1–6 call `goToPage`), **Footer** (`KEYS 1-6`), **HandCtrlPill** (states wired; Phase 1 toggle can run the boot preview), **live clock**.
- **Overlays** (`ExplodedView`, `ThemeWheel`, `CheatSheet`, `BootSequence`) built as components opened via the intent layer. `H` toggles the cheat sheet now.
- **Page transitions:** Framer Motion on route change (the spatial slide), triggered by `goToPage`.

## Step 5 — Backend & assets

- **Contact form:** if no existing backend, wire a simple one (Formspree / EmailJS / a small serverless function). Confirm before choosing.
- Résumé PDF, OG/social meta, favicons, real images.

## Step 6 — Performance & deploy

- Lazy-load Three.js and route-split so the 3D weight isn't on first paint.
- Lay groundwork for **adaptive LOD** on the gallery (you'll want GPU headroom for MediaPipe in Phase 2 — design for it now).
- Deploy on render.com over **HTTPS** (already the case — and required for Phase 2 camera access, so verify it holds).

**Phase 1 acceptance criteria:** all 6 pages render and navigate; every overlay (exploded view, theme wheel, cheat sheet, boot preview) opens via mouse/keyboard; all 8 themes switch cleanly; contact form sends; site is smooth on a mid-range laptop; deployed and live. No camera anywhere.

---

## Architecture choices that pre-pay for Phase 2

These cost little now and save a refactor later:
1. The **intent layer** — gestures will just call the same actions.
2. The **ModeProvider** + the wrap-slot for `HandPipelineProvider`.
3. **Overlays decoupled from triggers** (mouse opens them now; gestures later).
4. **Theme switching decoupled from the wheel gesture.**
5. **3D camera controls behind `rotateModel`/`zoomModel`** so gestures map onto them.
6. **GPU/perf headroom** for MediaPipe.
7. An **empty `hand/` dir** earmarked for the ported ASL pipeline.

---

## Phase 2 — outline only (to be specced thoroughly after Phase 1 ships)

Not for this build. Captured so the shape is visible:
- Port the ASL pipeline (`useHandTracking`, `features.ts`, `classify.ts`, `stability.ts`) into `hand/`; wrap routes in `HandPipelineProvider`.
- Add a **one-euro filter** for the continuous cursor (the StabilityFilter is for discrete states; the cursor needs different smoothing).
- Build gesture recognizers (pinch, fist, swipe, two-hand spread/rotate, pull-apart, palm-up, flick) → map each to an existing **intent**.
- Magnetic snapping + oversized hit areas in hand mode.
- Wire the boot/calibration sequence, the live camera PIP, and the cheat sheet to real tracking.
- Fallbacks: no camera / denied permission / mobile → stays in mouse mode, no dead ends.

---

## Dependencies to confirm before/early in Phase 1

- Does the old repo already have a **contact-form backend**, or do we add one?
- Is the **E46 (or any) 3D model** available as GLTF, or do we ship placeholders in Phase 1?
- How is the **Claude Design export structured** (one file vs components, Tailwind vs CSS)?
- Is **real content** ready (bio, project copy, experience, photos for the About cluster, résumé PDF, Log entries), or placeholders for now?
