# `src/hand/` — Phase 2

This directory is intentionally empty in Phase 1.

Phase 2 will port the ASL Hand Coach pipeline into here:

- `useHandTracking.ts` — MediaPipe wrapper, requests camera, exposes frames.
- `features.ts` — landmark-derived features (angles, distances).
- `classify.ts` — gesture classifier (pinch, fist, swipe, two-hand spread, pull-apart, palm-up, flick).
- `stability.ts` — StabilityFilter for discrete states.
- `cursor.ts` — one-euro filter for the continuous cursor.
- `HandPipelineProvider.tsx` — wraps routes; provides current gesture + cursor; calls into the existing intent layer (`src/intents/actions.js`).

No code changes outside this folder + `App.jsx` (one more provider wrap) will be needed.
