import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const THEME_ORDER = [
  "amber",
  "pistachio",
  "matcha",
  "moss",
  "dreamy",
  "chartreuse",
  "robin",
  "strawberry",
];

export const THEME_META = {
  amber:      { label: "Amber Smoke",          bg: "#F2E0D0", accent: "#6E88B0" },
  pistachio:  { label: "Pistachio Frost",      bg: "#200F07", accent: "#C5E384" },
  matcha:     { label: "Matcha Mist",          bg: "#F4F6F1", accent: "#7BAF85" },
  moss:       { label: "Moss Velvet",          bg: "#F8F5F2", accent: "#385144" },
  dreamy:     { label: "Dreamy Ocean",         bg: "#EAEBED", accent: "#006989" },
  chartreuse: { label: "Chartreuse Lab",       bg: "#00272B", accent: "#E0FF4F" },
  robin:      { label: "Robin Egg",            bg: "#2E382E", accent: "#50C9CE" },
  strawberry: { label: "Strawberry / Obsidian",bg: "#3C1950", accent: "#F0CDD2" },
  hud:        { label: "HUD · Arc Blue",       bg: "#0A0F14", accent: "#4FDFFF" },
};

const STORAGE_KEY = "portfolio.theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children, defaultTheme = "amber" }) {
  const [themeId, setThemeIdState] = useState(() => {
    if (typeof window === "undefined") return defaultTheme;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && THEME_META[saved] ? saved : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    window.localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId]);

  const setTheme = useCallback((id) => {
    if (THEME_META[id]) setThemeIdState(id);
  }, []);

  const cycleTheme = useCallback((dir = 1) => {
    setThemeIdState((current) => {
      const i = THEME_ORDER.indexOf(current);
      if (i < 0) return THEME_ORDER[0];
      const next = (i + dir + THEME_ORDER.length) % THEME_ORDER.length;
      return THEME_ORDER[next];
    });
  }, []);

  const value = useMemo(() => ({ themeId, setTheme, cycleTheme }), [themeId, setTheme, cycleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
