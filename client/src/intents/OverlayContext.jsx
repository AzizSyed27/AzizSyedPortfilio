import { createContext, useCallback, useContext, useMemo, useState } from "react";

const OverlayContext = createContext(null);

export function OverlayProvider({ children }) {
  const [openProjectId, setOpenProjectId] = useState(null);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [themeWheelOpen, setThemeWheelOpen] = useState(false);
  const [bootPlaying, setBootPlaying] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(() => new Set());
  const [expandedRows, setExpandedRows] = useState(() => new Set());

  const closeAll = useCallback(() => {
    setOpenProjectId(null);
    setCheatSheetOpen(false);
    setThemeWheelOpen(false);
  }, []);

  const toggleCheatSheet = useCallback(() => setCheatSheetOpen((v) => !v), []);
  const toggleThemeWheel = useCallback(() => setThemeWheelOpen((v) => !v), []);

  const expandNode = useCallback((id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandRow = useCallback((id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      openProjectId, setOpenProjectId,
      cheatSheetOpen, setCheatSheetOpen, toggleCheatSheet,
      themeWheelOpen, setThemeWheelOpen, toggleThemeWheel,
      bootPlaying, setBootPlaying,
      expandedNodes, expandNode,
      expandedRows, expandRow,
      closeAll,
    }),
    [openProjectId, cheatSheetOpen, themeWheelOpen, bootPlaying,
     expandedNodes, expandedRows, closeAll, toggleCheatSheet, toggleThemeWheel,
     expandNode, expandRow],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within OverlayProvider");
  return ctx;
}
