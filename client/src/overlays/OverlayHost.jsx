import { useLocation } from "react-router-dom";
import { useOverlay } from "../intents/OverlayContext";
import { useActions } from "../intents/actions";
import { CheatSheet } from "./CheatSheet";
import { ExplodedView } from "./ExplodedView";
import { BootSequence } from "./BootSequence";
import { useMode } from "../mode/ModeProvider";
import { HudReticle } from "./HudReticle";
import { SensorPip } from "./SensorPip";
import { HandNotice } from "./HandNotice";
import { HandCursor } from "../hand/cursor/HandCursor";
import { useHandPipeline } from "../hand/HandPipelineProvider";
import { DebugOverlay } from "../hand/debug/DebugOverlay";
import { DEBUG_PARAM, DEBUG_VALUE } from "../hand/config";

export function OverlayHost() {
  const overlay = useOverlay();
  const actions = useActions();
  const { handState, bootPhase } = useMode();
  const { notice, dismissNotice } = useHandPipeline();
  const { search } = useLocation();
  const debugHand = new URLSearchParams(search).get(DEBUG_PARAM) === DEBUG_VALUE;

  return (
    <>
      {overlay.cheatSheetOpen && <CheatSheet onClose={actions.closeOverlay} />}
      {overlay.openProjectId && <ExplodedView id={overlay.openProjectId} origin={overlay.openProjectOrigin} onClose={actions.closeOverlay} />}
      {handState === "calibrating" && <BootSequence phase={bootPhase} />}
      {handState === "live" && <HudReticle />}
      {handState === "live" && <SensorPip />}
      {handState === "live" && <HandCursor />}
      {notice && <HandNotice message={notice} onDismiss={dismissNotice} />}
      {debugHand && <DebugOverlay />}
    </>
  );
}
