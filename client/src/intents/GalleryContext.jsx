import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const GalleryContext = createContext(null);

export function GalleryProvider({ children }) {
  const handlers = useRef({ rotate: null, zoom: null, select: null });
  const [activeItem, setActiveItem] = useState(0);

  const registerHandlers = useCallback((next) => {
    handlers.current = { ...handlers.current, ...next };
  }, []);

  const rotateModel = useCallback((dx, dy) => {
    handlers.current.rotate?.(dx, dy);
  }, []);

  const zoomModel = useCallback((factor) => {
    handlers.current.zoom?.(factor);
  }, []);

  const selectGalleryItem = useCallback((i) => {
    setActiveItem(i);
    handlers.current.select?.(i);
  }, []);

  const value = useMemo(
    () => ({ activeItem, registerHandlers, rotateModel, zoomModel, selectGalleryItem }),
    [activeItem, registerHandlers, rotateModel, zoomModel, selectGalleryItem],
  );
  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
}
