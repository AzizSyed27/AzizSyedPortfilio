import { useEffect, useRef, useState } from "react";
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
import { ThemeWheel } from "./ThemeWheel";
import { HandCursor } from "../hand/cursor/HandCursor";
import { HandGestures } from "../hand/gestures/HandGestures";
import { useHandPipeline } from "../hand/HandPipelineProvider";
import { DebugOverlay } from "../hand/debug/DebugOverlay";
import { DEBUG_PARAM, DEBUG_VALUE } from "../hand/config";

const IDLE_PROMPT_MS = 10000;

export function OverlayHost() {
  const overlay = useOverlay();
  const actions = useActions();
  const { handState, bootPhase } = useMode();
  const { notice, dismissNotice, debug } = useHandPipeline();
  const { search } = useLocation();
  const debugHand = new URLSearchParams(search).get(DEBUG_PARAM) === DEBUG_VALUE;

  // Cheat-sheet auto-show once per session, the first time hand mode goes live.
  const taughtRef = useRef(false);
  useEffect(() => {
    if (handState === "live" && !taughtRef.current) {
      taughtRef.current = true;
      actions.toggleCheatSheet();
    }
  }, [handState, actions]);

  // Idle prompt: live but no hand seen for IDLE_PROMPT_MS.
  const [idle, setIdle] = useState(false);
  const noHandSinceRef = useRef(null);
  useEffect(() => {
    if (handState !== "live") { setIdle(false); noHandSinceRef.current = null; return undefined; }
    const id = setInterval(() => {
      if (debug.handsCount > 0) { noHandSinceRef.current = null; setIdle(false); return; }
      noHandSinceRef.current ??= Date.now();
      setIdle(Date.now() - noHandSinceRef.current > IDLE_PROMPT_MS);
    }, 500);
    return () => clearInterval(id);
  }, [handState, debug.handsCount]);

  return (
    <>
      {overlay.cheatSheetOpen && <CheatSheet onClose={actions.closeOverlay} />}
      {overlay.openProjectId && <ExplodedView id={overlay.openProjectId} origin={overlay.openProjectOrigin} onClose={actions.closeOverlay} />}
      {handState === "calibrating" && <BootSequence phase={bootPhase} />}
      {handState === "live" && <HudReticle />}
      {handState === "live" && <SensorPip />}
      {handState === "live" && <HandCursor />}
      {handState === "live" && <HandGestures />}
      {overlay.themeWheelOpen && <ThemeWheel />}
      {handState === "live" && idle && !overlay.cheatSheetOpen && (
        <div className="hand-idle-prompt" aria-hidden="true">Awaiting input · raise hand</div>
      )}
      {notice && <HandNotice message={notice} onDismiss={dismissNotice} />}
      {debugHand && <DebugOverlay />}
    </>
  );
}
