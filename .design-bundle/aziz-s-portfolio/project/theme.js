// theme.js — palettes + font pairings + cursor modes

window.PORTFOLIO_THEMES = {
  amber: {
    label: "Amber Smoke",
    bg: "#F2E0D0",
    fg: "#1A1F2A",
    accent: "#6E88B0",
    surface: "#ECD6C2",
    line: "rgba(26, 31, 42, 0.14)",
    lineStrong: "rgba(26, 31, 42, 0.32)",
    muted: "rgba(26, 31, 42, 0.6)",
    muted2: "rgba(26, 31, 42, 0.4)",
    selectionFg: "#F2E0D0",
  },
  pistachio: {
    label: "Pistachio Frost",
    bg: "#200F07",
    fg: "#F0EBE0",
    accent: "#C5E384",
    surface: "#2E1A10",
    line: "rgba(240, 235, 224, 0.12)",
    lineStrong: "rgba(240, 235, 224, 0.3)",
    muted: "rgba(240, 235, 224, 0.55)",
    muted2: "rgba(240, 235, 224, 0.35)",
    selectionFg: "#200F07",
  },
  matcha: {
    label: "Matcha Mist",
    bg: "#F4F6F1",
    fg: "#1F1F1F",
    accent: "#7BAF85",
    surface: "#E8EFE4",
    line: "rgba(31, 31, 31, 0.12)",
    lineStrong: "rgba(31, 31, 31, 0.3)",
    muted: "rgba(31, 31, 31, 0.58)",
    muted2: "rgba(31, 31, 31, 0.4)",
    selectionFg: "#F4F6F1",
  },
  moss: {
    label: "Moss Velvet",
    bg: "#F8F5F2",
    fg: "#1F2A24",
    accent: "#385144",
    surface: "#EFEAE3",
    line: "rgba(31, 42, 36, 0.12)",
    lineStrong: "rgba(31, 42, 36, 0.32)",
    muted: "rgba(31, 42, 36, 0.6)",
    muted2: "rgba(31, 42, 36, 0.4)",
    selectionFg: "#F8F5F2",
  },
  dreamy: {
    label: "Dreamy Ocean",
    bg: "#EAEBED",
    fg: "#0A1A22",
    accent: "#006989",
    surface: "#DFE2E5",
    line: "rgba(10, 26, 34, 0.12)",
    lineStrong: "rgba(10, 26, 34, 0.3)",
    muted: "rgba(10, 26, 34, 0.6)",
    muted2: "rgba(10, 26, 34, 0.38)",
    selectionFg: "#EAEBED",
  },
  chartreuse: {
    label: "Chartreuse Lab",
    bg: "#00272B",
    fg: "#E8F4F5",
    accent: "#E0FF4F",
    surface: "#0A3439",
    line: "rgba(232, 244, 245, 0.1)",
    lineStrong: "rgba(232, 244, 245, 0.28)",
    muted: "rgba(232, 244, 245, 0.55)",
    muted2: "rgba(232, 244, 245, 0.35)",
    selectionFg: "#00272B",
  },
  robin: {
    label: "Robin Egg",
    bg: "#2E382E",
    fg: "#E8EEE8",
    accent: "#50C9CE",
    surface: "#384338",
    line: "rgba(232, 238, 232, 0.1)",
    lineStrong: "rgba(232, 238, 232, 0.28)",
    muted: "rgba(232, 238, 232, 0.55)",
    muted2: "rgba(232, 238, 232, 0.35)",
    selectionFg: "#2E382E",
  },
  strawberry: {
    label: "Strawberry / Obsidian",
    bg: "#3C1950",
    fg: "#F5E8EA",
    accent: "#F0CDD2",
    surface: "#4A2161",
    line: "rgba(245, 232, 234, 0.1)",
    lineStrong: "rgba(245, 232, 234, 0.28)",
    muted: "rgba(245, 232, 234, 0.55)",
    muted2: "rgba(245, 232, 234, 0.35)",
    selectionFg: "#3C1950",
  },
};

window.PORTFOLIO_FONTS = {
  editorial: {
    label: "Editorial",
    display: '"Instrument Serif", "Times New Roman", serif',
    body: '"Bricolage Grotesque", -apple-system, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  engineer: {
    label: "Engineer",
    display: '"Space Grotesk", -apple-system, sans-serif',
    body: '"Space Grotesk", -apple-system, sans-serif',
    mono: '"Space Mono", ui-monospace, monospace',
  },
  classic: {
    label: "Classic",
    display: '"Newsreader", "Times New Roman", serif',
    body: '"DM Sans", -apple-system, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
  brutalist: {
    label: "Brutalist",
    display: '"DM Mono", ui-monospace, monospace',
    body: '"DM Mono", ui-monospace, monospace',
    mono: '"DM Mono", ui-monospace, monospace',
  },
};

window.applyTheme = function (themeKey, fontKey) {
  const t = window.PORTFOLIO_THEMES[themeKey] || window.PORTFOLIO_THEMES.amber;
  const f = window.PORTFOLIO_FONTS[fontKey] || window.PORTFOLIO_FONTS.editorial;
  const r = document.documentElement;
  r.style.setProperty("--bg", t.bg);
  r.style.setProperty("--fg", t.fg);
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--surface", t.surface);
  r.style.setProperty("--line", t.line);
  r.style.setProperty("--line-strong", t.lineStrong);
  r.style.setProperty("--muted", t.muted);
  r.style.setProperty("--muted-2", t.muted2);
  r.style.setProperty("--f-display", f.display);
  r.style.setProperty("--f-body", f.body);
  r.style.setProperty("--f-mono", f.mono);
};
