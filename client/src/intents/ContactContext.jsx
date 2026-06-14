import { createContext, useCallback, useContext, useMemo, useRef } from "react";

// Register-a-handler seam (mirrors GalleryContext) so the gesture layer can
// reach the Contact page's submit + per-field speech without touching the DOM.
// ContactHand registers handlers on mount; flick-send / pinch-on-field call the
// invokers through the intent layer.
const ContactContext = createContext(null);

export function ContactProvider({ children }) {
  const handlers = useRef({ submit: null, toggleField: null });

  const registerHandlers = useCallback((next) => {
    handlers.current = { ...handlers.current, ...next };
  }, []);

  const submitContact = useCallback(() => {
    handlers.current.submit?.();
  }, []);

  const toggleContactField = useCallback((field) => {
    handlers.current.toggleField?.(field);
  }, []);

  const value = useMemo(
    () => ({ registerHandlers, submitContact, toggleContactField }),
    [registerHandlers, submitContact, toggleContactField],
  );
  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>;
}

export function useContact() {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used within ContactProvider");
  return ctx;
}
