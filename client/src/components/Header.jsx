import { useEffect, useRef, useState } from "react";
import { useActions } from "../intents/actions";
import { useMode } from "../mode/ModeProvider";
import { ThemeSelect } from "./ThemeSelect";
import { HandCtrlPill } from "./HandCtrlPill";

const NAV = [
  { id: "home",     num: "01", label: "Index" },
  { id: "about",    num: "02", label: "About" },
  { id: "services", num: "03", label: "Services" },
  { id: "projects", num: "04", label: "Work" },
  { id: "contact",  num: "05", label: "Contact" },
  { id: "log",      num: "06", label: "Log" },
];

function fmtClock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function Header() {
  const actions = useActions();
  const { handState, toggleHandMode } = useMode();
  const [now, setNow] = useState(fmtClock);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(fmtClock()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close the mobile menu whenever the route changes — a backstop for keyboard
  // 1–6 navigation (KeyboardController) and the brand click, which bypass the
  // per-link onClick close.
  useEffect(() => { setMenuOpen(false); }, [actions.currentRouteId]);

  // Esc / click-outside close — mirrors the pattern in ThemeSelect.jsx.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDoc = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="top-bar" ref={headerRef}>
      <div className="brand" onClick={() => actions.goToPage("home")} data-cursor="hover">
        <div className="brand-mark">AZ</div>
        <div className="brand-meta">
          <b>Aziz Syed</b>
          Software Engineer<br />Scarborough, ON
        </div>
      </div>

      <button
        className="nav-toggle"
        data-open={menuOpen ? "true" : "false"}
        aria-expanded={menuOpen}
        aria-controls="nav-collapse"
        aria-label="Menu"
        data-cursor="hover"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="nav-toggle-bars" aria-hidden="true"><i /><i /><i /></span>
      </button>

      <div className="nav-collapse" id="nav-collapse" data-open={menuOpen ? "true" : "false"}>
        <nav className="nav">
          {NAV.map((r) => (
            <button
              key={r.id}
              className={`nav-link ${actions.currentRouteId === r.id ? "active" : ""}`}
              onClick={() => { actions.goToPage(r.id); setMenuOpen(false); }}
              data-cursor="hover"
            >
              <span className="nav-num">{r.num}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </nav>

        <div className="hud-wrap">
          <div className="hud-clock">{now} EST · v3.0</div>
          <div className="hud-pill-row">
            <ThemeSelect />
            <HandCtrlPill state={handState} onClick={toggleHandMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
