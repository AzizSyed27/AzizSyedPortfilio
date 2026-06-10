import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ModeContext = createContext(null);

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Boot-sequence timeline (toggle-on). Two phases play during `calibrating`
// before the site goes `live`. ModeProvider is the single owner of the clock so
// there's no drift; BootSequence reads `bootPhase` and is purely presentational.
// (Phase 2 will replace these timers with real calibration-progress callbacks.)
export const CLI_MS = 1600;
export const HUD_MS = 2400;

export function ModeProvider({ children, defaultMode = "mouse" }) {
  const [mode, setMode] = useState(defaultMode);
  const [handState, setHandState] = useState("standby");
  const [bootPhase, setBootPhase] = useState(null); // 'cli' | 'hud' | null
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Single toggle: standby → boot (cli → hud) → live → standby.
  const toggleHandMode = useCallback(() => {
    clearTimers();
    setHandState((s) => {
      if (s !== "standby") { setBootPhase(null); return "standby"; }
      // engage
      const cli = prefersReduced() ? 0 : CLI_MS;
      const hud = prefersReduced() ? 0 : HUD_MS;
      setBootPhase("cli");
      timers.current.push(setTimeout(() => setBootPhase("hud"), cli));
      timers.current.push(setTimeout(() => { setBootPhase(null); setHandState("live"); }, cli + hud));
      return "calibrating";
    });
  }, [clearTimers]);

  // Back-compat alias (some callers used advanceHand).
  const advanceHand = toggleHandMode;

  const value = useMemo(
    () => ({ mode, setMode, handState, bootPhase, advanceHand, toggleHandMode }),
    [mode, handState, bootPhase, advanceHand, toggleHandMode],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
