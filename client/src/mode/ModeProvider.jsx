import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ModeContext = createContext(null);

export function ModeProvider({ children, defaultMode = "mouse" }) {
  const [mode, setMode] = useState(defaultMode);
  const [handState, setHandState] = useState("standby");
  const handTimer = useRef(null);

  const advanceHand = useCallback(() => {
    clearTimeout(handTimer.current);
    setHandState((s) => {
      if (s === "standby") {
        handTimer.current = setTimeout(() => setHandState("live"), 1600);
        return "calibrating";
      }
      if (s === "calibrating") return "live";
      return "standby";
    });
  }, []);

  const toggleHandMode = useCallback(() => {
    advanceHand();
  }, [advanceHand]);

  const value = useMemo(
    () => ({ mode, setMode, handState, advanceHand, toggleHandMode }),
    [mode, handState, advanceHand, toggleHandMode],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
