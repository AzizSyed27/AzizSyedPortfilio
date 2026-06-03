import { useOverlay } from "../intents/OverlayContext";
import { CheatSheet } from "./CheatSheet";
import { ExplodedView } from "./ExplodedView";
import { BootSequence } from "./BootSequence";
import { useMode } from "../mode/ModeProvider";
import { HudReticle } from "./HudReticle";

export function OverlayHost() {
  const overlay = useOverlay();
  const { handState } = useMode();

  return (
    <>
      {overlay.cheatSheetOpen && <CheatSheet onClose={() => overlay.setCheatSheetOpen(false)} />}
      {overlay.openProjectId && <ExplodedView id={overlay.openProjectId} onClose={overlay.closeAll} />}
      {handState !== "standby" && <BootSequence state={handState} />}
      {handState === "live" && <HudReticle />}
    </>
  );
}
