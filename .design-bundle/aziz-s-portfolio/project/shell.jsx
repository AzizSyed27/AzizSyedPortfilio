// shell.jsx — Custom cursor, HUD, Nav, layout primitives

// ───────────────────────────────────────────────────────────────
// CURSOR — three variants: dot, trail, crosshair, off
// ───────────────────────────────────────────────────────────────
function SpatialCursor({ mode }) {
  const dotRef = React.useRef(null);
  const crossRef = React.useRef(null);
  const boxRef = React.useRef(null);
  const trailRefs = React.useRef([]);
  const [hover, setHover] = React.useState(false);
  const posRef = React.useRef({ x: -100, y: -100 });
  const trailPosRef = React.useRef([]);
  const TRAIL_COUNT = 12;

  React.useEffect(() => {
    // init trail positions
    trailPosRef.current = Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }));

    let raf;
    const tick = () => {
      const { x, y } = posRef.current;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (crossRef.current) {
        crossRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (boxRef.current) {
        boxRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      // trail follow chain
      const tp = trailPosRef.current;
      for (let i = 0; i < tp.length; i++) {
        const target = i === 0 ? { x, y } : tp[i - 1];
        tp[i].x += (target.x - tp[i].x) * 0.35;
        tp[i].y += (target.y - tp[i].y) * 0.35;
        const el = trailRefs.current[i];
        if (el) {
          const s = 1 - i / tp.length;
          el.style.transform = `translate(${tp[i].x}px, ${tp[i].y}px) translate(-50%, -50%) scale(${s})`;
          el.style.opacity = (s * 0.7).toFixed(2);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      const target = e.target;
      const isInteractive = target && (
        target.closest("a, button, input, textarea, [data-cursor='hover']")
      );
      setHover(!!isInteractive);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (mode === "off") return null;

  return (
    <>
      {mode === "dot" && (
        <div ref={dotRef} className="spatial-cursor" data-hover={hover ? "1" : "0"} />
      )}
      {mode === "trail" && (
        <>
          <div ref={dotRef} className="spatial-cursor" data-hover={hover ? "1" : "0"} />
          {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (trailRefs.current[i] = el)}
              className="cursor-trail"
            />
          ))}
        </>
      )}
      {mode === "crosshair" && (
        <>
          <div ref={crossRef} className="spatial-crosshair" />
          <div ref={boxRef} className="spatial-crosshair-box"><span /></div>
        </>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// NAV + TOP BAR
// ───────────────────────────────────────────────────────────────
const ROUTES = [
  { id: "home", num: "01", label: "Index" },
  { id: "about", num: "02", label: "About" },
  { id: "services", num: "03", label: "Services" },
  { id: "projects", num: "04", label: "Work" },
  { id: "contact", num: "05", label: "Contact" },
  { id: "log", num: "06", label: "Log" },
];

function TopBar({ route, setRoute, handState, onAdvanceHand, theme, setTheme }) {
  const [now, setNow] = React.useState(() => fmtClock());
  React.useEffect(() => {
    const id = setInterval(() => setNow(fmtClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const handLabel = { standby: "Standby", calibrating: "Calibrating", live: "Live" }[handState] || "Standby";

  return (
    <header className="top-bar">
      <div className="brand" onClick={() => setRoute("home")} data-cursor="hover">
        <div className="brand-mark">AZ</div>
        <div className="brand-meta">
          <b>Aziz Syed</b>
          Software Engineer<br />Scarborough, ON
        </div>
      </div>

      <nav className="nav">
        {ROUTES.map((r) => (
          <button
            key={r.id}
            className={`nav-link ${route === r.id ? "active" : ""}`}
            onClick={() => setRoute(r.id)}
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
          <ThemeSelect theme={theme} setTheme={setTheme} />
          <button
            className="hand-pill"
            data-state={handState}
            onClick={onAdvanceHand}
            data-cursor="hover"
            title="Cycle spatial hand control (preview)"
          >
            <span className="dot" />
            <span>Hand Ctrl · {handLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ───────────────────────────────────────────────────────────────
// THEME SELECT pill + dropdown
// ───────────────────────────────────────────────────────────────
const THEME_ORDER = ["amber", "pistachio", "matcha", "moss", "dreamy", "chartreuse", "robin", "strawberry"];

function ThemeSelect({ theme, setTheme }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const themes = window.PORTFOLIO_THEMES || {};
  const current = themes[theme] || themes.amber || {};

  React.useEffect(() => {
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
          <div className="theme-menu-head">Select theme · 08</div>
          {THEME_ORDER.map((key) => {
            const t = themes[key];
            if (!t) return null;
            return (
              <button
                key={key}
                className={`theme-option ${theme === key ? "active" : ""}`}
                onClick={() => { setTheme(key); setOpen(false); }}
                data-cursor="hover"
              >
                <span className="theme-duo">
                  <span style={{ background: t.bg }} />
                  <span style={{ background: t.accent }} />
                </span>
                <span className="theme-name">{t.label}</span>
                {theme === key && <span className="theme-check">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ───────────────────────────────────────────────────────────────
// HUD OVERLAY (when hand control "active")
// ───────────────────────────────────────────────────────────────
function HudOverlay({ on }) {
  const [pos, setPos] = React.useState({ x: 0.5, y: 0.5 });
  const [conf, setConf] = React.useState(94);

  React.useEffect(() => {
    if (!on) return;
    const onMove = (e) => {
      setPos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMove);
    const id = setInterval(() => setConf(88 + Math.round(Math.random() * 10)), 800);
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearInterval(id);
    };
  }, [on]);

  return (
    <div className={`hud-overlay ${on ? "on" : ""}`}>
      <div className="hud-corner hud-tl" />
      <div className="hud-corner hud-tr" />
      <div className="hud-corner hud-bl" />
      <div className="hud-corner hud-br" />

      <div className="hud-feed">
        <div className="feed-box">
          <div
            className="palm"
            style={{
              left: `${30 + pos.x * 20}%`,
              top: `${20 + pos.y * 30}%`,
            }}
          />
        </div>
        <div className="meta">
          <span>CAM 01 · 30fps</span>
          <span>● REC</span>
        </div>
      </div>

      <div className="hud-readout">
        <b>HAND CTRL · ACTIVE</b><br />
        gesture: open palm<br />
        confidence: {conf}%<br />
        x:{pos.x.toFixed(3)} y:{pos.y.toFixed(3)}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// MARQUEE
// ───────────────────────────────────────────────────────────────
function Marquee({ items }) {
  // duplicate so the loop is seamless
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-inner">
        {doubled.map((it, i) => (
          <span key={i}>
            <b>·</b> {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// SECTION
// ───────────────────────────────────────────────────────────────
function Section({ num, label, children, style }) {
  return (
    <section className="section" style={style}>
      <div className="section-label" data-num={num}>{label}</div>
      {children}
    </section>
  );
}

// ───────────────────────────────────────────────────────────────
// PARALLAX TILE (for spatial hero)
// ───────────────────────────────────────────────────────────────
function SpatialTile({ style, depth = 0, num, title, tag }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = document.documentElement.getBoundingClientRect();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      const tx = dx * depth * 18;
      const ty = dy * depth * 12;
      const rx = -dy * 4;
      const ry = dx * 6;
      el.style.transform = `translateZ(${depth * 80}px) translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [depth]);
  return (
    <div ref={ref} className="spatial-tile" style={style} data-cursor="hover">
      <div className="tile-num">{num}</div>
      <div className="tile-title">{title}</div>
      <div className="tile-tag">{tag}</div>
    </div>
  );
}

Object.assign(window, {
  SpatialCursor, TopBar, ThemeSelect, HudOverlay, Marquee, Section, SpatialTile, ROUTES,
});
