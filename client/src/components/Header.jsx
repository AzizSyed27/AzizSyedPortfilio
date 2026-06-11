import { useEffect, useState } from "react";
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

  useEffect(() => {
    const id = setInterval(() => setNow(fmtClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="top-bar">
      <div className="brand" onClick={() => actions.goToPage("home")} data-cursor="hover">
        <div className="brand-mark">AZ</div>
        <div className="brand-meta">
          <b>Aziz Syed</b>
          Software Engineer<br />Scarborough, ON
        </div>
      </div>

      <nav className="nav">
        {NAV.map((r) => (
          <button
            key={r.id}
            className={`nav-link ${actions.currentRouteId === r.id ? "active" : ""}`}
            onClick={() => actions.goToPage(r.id)}
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
    </header>
  );
}
