import { useEffect } from "react";
import { useActions, ROUTE_ORDER } from "./actions";
import { useOverlay } from "./OverlayContext";
import { useMode } from "../mode/ModeProvider";

const NUMBER_KEY_MAP = ROUTE_ORDER.reduce((acc, id, i) => {
  acc[String(i + 1)] = id;
  return acc;
}, {});

export function KeyboardController() {
  const actions = useActions();
  const overlay = useOverlay();
  const { handState, toggleHandMode } = useMode();

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.matches("input, textarea, [contenteditable]")) return;

      const routeId = NUMBER_KEY_MAP[e.key];
      if (routeId) {
        e.preventDefault();
        actions.goToPage(routeId);
        return;
      }

      const lower = e.key.toLowerCase();
      if (lower === "h") {
        e.preventDefault();
        actions.toggleCheatSheet();
        return;
      }
      if (e.key === "Escape") {
        // Overlay-first (Phase 1 behavior), then exit hand mode. Esc during
        // the boot sequence is handled by BootSequence's own skip listener.
        if (overlay.cheatSheetOpen || overlay.openProjectId || overlay.themeWheelOpen) {
          actions.closeOverlay();
        } else if (handState === "live") {
          toggleHandMode();
        } else {
          actions.closeOverlay();
        }
        return;
      }
      if (e.key === "[") {
        actions.cycleTheme(-1);
        return;
      }
      if (e.key === "]") {
        actions.cycleTheme(1);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, overlay, handState, toggleHandMode]);

  return null;
}
