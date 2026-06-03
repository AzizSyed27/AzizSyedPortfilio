import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOverlay } from "./OverlayContext";
import { useGallery } from "./GalleryContext";
import { useTheme } from "../theme/ThemeProvider";
import { useMode } from "../mode/ModeProvider";

export const ROUTE_BY_ID = {
  home: "/",
  about: "/about",
  services: "/services",
  projects: "/projects",
  contact: "/contact",
  log: "/log",
};

export const ROUTE_ORDER = ["home", "about", "services", "projects", "contact", "log"];

export const ID_BY_PATH = Object.fromEntries(
  Object.entries(ROUTE_BY_ID).map(([id, path]) => [path, id]),
);

export function useActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const overlay = useOverlay();
  const gallery = useGallery();
  const theme = useTheme();
  const mode = useMode();

  const currentRouteId = ID_BY_PATH[location.pathname] ?? "home";

  const goToPage = useCallback(
    (id) => {
      const path = ROUTE_BY_ID[id];
      if (path && path !== location.pathname) navigate(path);
    },
    [navigate, location.pathname],
  );

  const nextPage = useCallback(() => {
    const i = ROUTE_ORDER.indexOf(currentRouteId);
    const next = ROUTE_ORDER[(i + 1) % ROUTE_ORDER.length];
    goToPage(next);
  }, [currentRouteId, goToPage]);

  const prevPage = useCallback(() => {
    const i = ROUTE_ORDER.indexOf(currentRouteId);
    const prev = ROUTE_ORDER[(i - 1 + ROUTE_ORDER.length) % ROUTE_ORDER.length];
    goToPage(prev);
  }, [currentRouteId, goToPage]);

  const copyField = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  const openLink = useCallback((url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const scrollByPx = useCallback((dy) => {
    window.scrollBy({ top: dy, behavior: "smooth" });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return useMemo(
    () => ({
      // navigation
      goToPage, nextPage, prevPage, currentRouteId,
      // overlays
      openProject: overlay.setOpenProjectId,
      closeOverlay: overlay.closeAll,
      toggleCheatSheet: overlay.toggleCheatSheet,
      toggleThemeWheel: overlay.toggleThemeWheel,
      expandNode: overlay.expandNode,
      expandRow: overlay.expandRow,
      // theme
      setTheme: theme.setTheme,
      cycleTheme: theme.cycleTheme,
      // mode / hand
      toggleHandMode: mode.toggleHandMode,
      // gallery
      rotateModel: gallery.rotateModel,
      zoomModel: gallery.zoomModel,
      selectGalleryItem: gallery.selectGalleryItem,
      // misc
      scrollBy: scrollByPx,
      scrollToTop,
      copyField,
      openLink,
    }),
    [goToPage, nextPage, prevPage, currentRouteId, overlay, theme, mode, gallery,
     scrollByPx, scrollToTop, copyField, openLink],
  );
}
