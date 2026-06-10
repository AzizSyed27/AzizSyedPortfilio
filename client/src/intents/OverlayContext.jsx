import { createContext, useCallback, useContext, useMemo, useState } from "react";

const OverlayContext = createContext(null);

export function OverlayProvider({ children }) {
  const [openProjectId, setOpenProjectId] = useState(null);
  // Source rect of the element that opened the project (for the grow-from-card
  // FLIP). Optional — null means grow from the viewport center (e.g. a future
  // gesture-triggered open with no DOM origin).
  const [openProjectOrigin, setOpenProjectOrigin] = useState(null);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [themeWheelOpen, setThemeWheelOpen] = useState(false);
  const [bootPlaying, setBootPlaying] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(() => new Set());
  const [expandedRows, setExpandedRows] = useState(() => new Set());

  const openProject = useCallback((id, origin = null) => {
    setOpenProjectId(id);
    setOpenProjectOrigin(origin);
  }, []);

  const closeAll = useCallback(() => {
    setOpenProjectId(null);
    setOpenProjectOrigin(null);
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
      openProjectId, openProjectOrigin, openProject, setOpenProjectId,
      cheatSheetOpen, setCheatSheetOpen, toggleCheatSheet,
      themeWheelOpen, setThemeWheelOpen, toggleThemeWheel,
      bootPlaying, setBootPlaying,
      expandedNodes, expandNode,
      expandedRows, expandRow,
      closeAll,
    }),
    [openProjectId, openProjectOrigin, openProject, cheatSheetOpen, themeWheelOpen, bootPlaying,
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
