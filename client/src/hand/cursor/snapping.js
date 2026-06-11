// Magnetic snap-target registry. Discovers interactive elements with the same
// selector SpatialCursor uses (every clickable in the app already matches —
// no per-component attributes needed), caches their rects, and resolves the
// nearest target with enter/exit/switch hysteresis so the snap never strobes
// between adjacent elements. Plain JS; HandCursor owns invalidation wiring.

import { TUNE } from "../config";

export const TARGET_SELECTOR = "a, button, input, textarea, [data-cursor='hover']";

function targetCode(el) {
  const explicit = el.dataset?.handCode;
  if (explicit) return explicit;
  const label = el.getAttribute?.("aria-label") || el.textContent || el.tagName;
  return label.trim().replace(/\s+/g, " ").slice(0, 12).toUpperCase() || el.tagName;
}

// Distance from a point to a rect's edge (0 inside) — the whole rect is
// magnetic, which matters for wide nav buttons.
function rectDistance(rect, x, y) {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

// While a modal overlay is up, only its own controls are valid snap targets —
// arming (and clicking) page elements behind the backdrop is spec §4's
// "modal overlays shrink the active gesture set". The M2 arbitrator will
// formalize this; for M1 the two modal roots are known by class.
function scopeRoot() {
  return (
    document.querySelector(".exploded-view") ??
    document.querySelector(".cheat-sheet") ??
    document
  );
}

export function createTargetRegistry() {
  let targets = [];
  let dirty = true;

  function refresh() {
    const els = scopeRoot().querySelectorAll(TARGET_SELECTOR);
    const next = [];
    for (const el of els) {
      if (el.disabled) continue;
      if (el.closest("[aria-hidden='true']")) continue;
      if (el.closest(".hand-cursor, .hand-debug, .hud-overlay")) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      next.push({ el, rect, code: targetCode(el) });
    }
    targets = next;
    dirty = false;
  }

  return {
    markDirty() {
      dirty = true;
    },

    refresh,

    /**
     * Resolve the snapped target for the logical cursor position.
     * `current` is the previously snapped entry (or null) — hysteresis:
     * enter at snap.radius, hold until radius + exitPad, and a competitor
     * only steals the snap when it's switchMargin px decisively closer.
     */
    findTarget(x, y, current) {
      if (dirty) refresh();

      let best = null;
      let bestD = Infinity;
      let currentEntry = null;
      let currentD = Infinity;

      for (const t of targets) {
        const d = rectDistance(t.rect, x, y);
        if (current && t.el === current.el) {
          currentEntry = t;
          currentD = d;
        }
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }

      if (currentEntry && currentEntry.el.isConnected) {
        const holds = currentD <= TUNE.snap.radius + TUNE.snap.exitPad;
        const stolen = best !== currentEntry && bestD <= TUNE.snap.radius && bestD < currentD - TUNE.snap.switchMargin;
        if (holds && !stolen) return currentEntry;
        if (stolen) return best;
        return null;
      }

      return best && bestD <= TUNE.snap.radius ? best : null;
    },

    list: () => targets,

    destroy() {
      targets = [];
    },
  };
}
