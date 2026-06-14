// Phase-2 input seam: components that run their own physics off the cursor
// (e.g. StackConstellation's grab-drag-throw) read the live hand pointer here
// instead of binding to the camera pipeline directly. No DOM access — it just
// surfaces the pointer HandCursor publishes plus whether hand mode is live.
//
// Usage:
//   const { active, getPointer } = useHandPointer();
//   // in a rAF loop, only when `active`:
//   const { x, y, pinched, present } = getPointer();

import { useCallback } from "react";
import { useHandPipeline } from "./HandPipelineProvider";
import { useMode } from "../mode/ModeProvider";

export function useHandPointer() {
  const { handPointerRef } = useHandPipeline();
  const { handState } = useMode();
  // getPointer is stable (handPointerRef never changes identity) so a consumer's
  // rAF effect doesn't restart — and lose its drag state — on every re-render.
  const getPointer = useCallback(() => handPointerRef.current, [handPointerRef]);
  return { active: handState === "live", getPointer };
}
