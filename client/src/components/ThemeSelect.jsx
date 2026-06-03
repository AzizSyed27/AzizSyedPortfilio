import { useEffect, useRef, useState } from "react";
import { useTheme, THEME_ORDER, THEME_META } from "../theme/ThemeProvider";

export function ThemeSelect() {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = THEME_META[themeId] ?? THEME_META.amber;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="theme-select" ref={ref}>
      <button
        className="theme-pill"
        data-open={open ? "1" : "0"}
        onClick={() => setOpen((v) => !v)}
        data-cursor="hover"
        title="Select a color theme"
      >
        <span
          className="theme-swatch"
          style={{ background: current.accent, borderColor: current.bg }}
        />
        <span>Theme Select</span>
        <span className="theme-caret">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="theme-menu">
          <div className="theme-menu-head">Select theme · {String(THEME_ORDER.length).padStart(2, "0")}</div>
          {THEME_ORDER.map((key) => {
            const meta = THEME_META[key];
            return (
              <button
                key={key}
                className={`theme-option ${themeId === key ? "active" : ""}`}
                onClick={() => { setTheme(key); setOpen(false); }}
                data-cursor="hover"
              >
                <span className="theme-duo">
                  <span style={{ background: meta.bg }} />
                  <span style={{ background: meta.accent }} />
                </span>
                <span className="theme-name">{meta.label}</span>
                {themeId === key && <span className="theme-check">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
