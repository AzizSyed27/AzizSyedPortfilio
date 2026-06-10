import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { BLACK_MS, CLI_MS, HUD_MS } from "../overlays/bootTimeline";

const ModeContext = createContext(null);

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Boot-sequence timeline (toggle-on). Three phases play during `calibrating`
// before the site goes `live`: black pre-roll → CLI → HUD visor. ModeProvider is
// the single owner of the clock (durations imported from bootTimeline) so the
// in-component animations can't drift. Phase 2 will replace these timers with
// real calibration-progress callbacks.

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

  // Single toggle: standby → boot (black → cli → hud) → live → standby.
  const toggleHandMode = useCallback(() => {
    clearTimers();
    setHandState((s) => {
      if (s !== "standby") { setBootPhase(null); return "standby"; }
      const black = prefersReduced() ? 0 : BLACK_MS;
      const cli = prefersReduced() ? 0 : CLI_MS;
      const hud = prefersReduced() ? 0 : HUD_MS;
      setBootPhase("black");
      timers.current.push(setTimeout(() => setBootPhase("cli"), black));
      timers.current.push(setTimeout(() => setBootPhase("hud"), black + cli));
      timers.current.push(setTimeout(() => { setBootPhase(null); setHandState("live"); }, black + cli + hud));
      return "calibrating";
    });
  }, [clearTimers]);

  const advanceHand = toggleHandMode;

  const value = useMemo(
    () => ({ mode, setMode, handState, bootPhase, advanceHand, toggleHandMode, skipToLive }),
    [mode, handState, bootPhase, advanceHand, toggleHandMode, skipToLive],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
