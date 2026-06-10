import { useOverlay } from "../intents/OverlayContext";
import { useActions } from "../intents/actions";
import { CheatSheet } from "./CheatSheet";
import { ExplodedView } from "./ExplodedView";
import { BootSequence } from "./BootSequence";
import { useMode } from "../mode/ModeProvider";
import { HudReticle } from "./HudReticle";

export function OverlayHost() {
  const overlay = useOverlay();
  const actions = useActions();
  const { handState, bootPhase } = useMode();

  return (
    <>
      {overlay.cheatSheetOpen && <CheatSheet onClose={actions.closeOverlay} />}
      {overlay.openProjectId && <ExplodedView id={overlay.openProjectId} origin={overlay.openProjectOrigin} onClose={actions.closeOverlay} />}
      {handState === "calibrating" && <BootSequence phase={bootPhase} />}
      {handState === "live" && <HudReticle />}
    </>
  );
}
