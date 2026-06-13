import { useEffect } from "react";
import { useActions, ROUTE_ORDER } from "./actions";
import { useOverlay } from "./OverlayContext";
import { useMode } from "../mode/ModeProvider";
import { useHandPipeline } from "../hand/HandPipelineProvider";

const NUMBER_KEY_MAP = ROUTE_ORDER.reduce((acc, id, i) => {
  acc[String(i + 1)] = id;
  return acc;
}, {});

export function KeyboardController() {
  const actions = useActions();
  const overlay = useOverlay();
  const { handState, toggleHandMode } = useMode();
  const { arbitrator } = useHandPipeline();

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
        // Theme dial first: cancel it frame-driven (HandGestures reverts the
        // preview + releases DIAL) rather than just flipping the React flag.
        if (overlay.themeWheelOpen) {
          e.preventDefault();
          arbitrator.context.requestDialClose = true;
          return;
        }
        // Overlay-first (Phase 1 behavior), then exit hand mode. Esc during
        // the boot sequence is handled by BootSequence's own skip listener.
        if (overlay.cheatSheetOpen || overlay.openProjectId) {
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
  }, [actions, overlay, handState, toggleHandMode, arbitrator]);

  return null;
}
