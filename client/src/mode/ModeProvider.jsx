import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { BLACK_MS, CLI_MS, HUD_MS } from "../overlays/bootTimeline";

const ModeContext = createContext(null);

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hand-mode lifecycle: standby → requesting (camera permission pending) →
// calibrating (boot sequence) → live → standby. ModeProvider owns the boot
// clock (durations imported from bootTimeline) so the in-component animations
// can't drift; HandPipelineProvider drives the transitions — it calls
// startBoot() once the camera is granted and abortHand() on any failure.

export function ModeProvider({ children, defaultMode = "mouse" }) {
  const [mode, setMode] = useState(defaultMode);
  const [handState, setHandState] = useState("standby");
  const [bootPhase, setBootPhase] = useState(null); // 'black' | 'cli' | 'hud' | null
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Jump straight to live (Esc / click-to-skip during boot).
  const skipToLive = useCallback(() => {
    clearTimers();
    setBootPhase(null);
    setHandState("live");
  }, [clearTimers]);

  // Full exit from any hand state back to mouse-only.
  const abortHand = useCallback(() => {
    clearTimers();
    setBootPhase(null);
    setHandState("standby");
  }, [clearTimers]);

  // Camera granted → play the boot sequence (black → cli → hud), then live.
  const startBoot = useCallback(() => {
    clearTimers();
    const black = prefersReduced() ? 0 : BLACK_MS;
    const cli = prefersReduced() ? 0 : CLI_MS;
    const hud = prefersReduced() ? 0 : HUD_MS;
    setBootPhase("black");
    setHandState("calibrating");
    timers.current.push(setTimeout(() => setBootPhase("cli"), black));
    timers.current.push(setTimeout(() => setBootPhase("hud"), black + cli));
    timers.current.push(setTimeout(() => { setBootPhase(null); setHandState("live"); }, black + cli + hud));
  }, [clearTimers]);

  // Single toggle: standby → requesting (HandPipelineProvider takes it from
  // there); any active state → full exit (camera released by the pipeline).
  const toggleHandMode = useCallback(() => {
    setHandState((s) => {
      if (s !== "standby") {
        clearTimers();
        setBootPhase(null);
        return "standby";
      }
      return "requesting";
    });
  }, [clearTimers]);

  const advanceHand = toggleHandMode;

  const value = useMemo(
    () => ({ mode, setMode, handState, bootPhase, advanceHand, toggleHandMode, startBoot, abortHand, skipToLive }),
    [mode, handState, bootPhase, advanceHand, toggleHandMode, startBoot, abortHand, skipToLive],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
