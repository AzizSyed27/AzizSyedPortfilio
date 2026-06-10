import { useEffect } from "react";
import { useMode } from "../mode/ModeProvider";
import { useTheme } from "./ThemeProvider";

// Bridges hand mode to the theme: turning the hand-control pill on (handState
// leaves "standby") overrides the site to the HUD "Tony Stark" palette; turning
// it off restores the user's chosen theme. The override is non-persisted, so a
// reload keeps the user's real theme. Renders nothing — mounted once in App,
// inside both ThemeProvider and ModeProvider.
export function ThemeModeSync() {
  const { handState } = useMode();
  const { setThemeOverride } = useTheme();

  useEffect(() => {
    setThemeOverride(handState !== "standby" ? "hud" : null);
  }, [handState, setThemeOverride]);

  return null;
}
