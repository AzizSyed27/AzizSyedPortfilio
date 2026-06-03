// handctrl-frames.jsx — the three boot-sequence frames (Black / HUD Boot / Live)
// Blue/Black palette, thin-line HUD chrome, monospace boot log.

// ── FRAME 01 · CLI (Copilot-style terminal boot — original wordmark) ──
// Original pixel-hand mascot (open palm; on-theme for hand control).
const HAND_GRID = [
  ".#.#.#.#.",
  ".#.#.#.#.",
  ".#.#.#.#.",
  ".#.#.#.#.",
  "#########",
  "#########",
  ".###g###.",
  ".#######.",
  ".#######.",
  "..*****..",
  "..*****..",
];
function PixelHand() {
  const cell = 7;
  const cols = 9, rows = HAND_GRID.length;
  const rects = [];
  HAND_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const cls = ch === "*" ? "px-mag" : ch === "g" ? "px-grn" : "px-blue";
      rects.push(
        <rect key={`${x}-${y}`} x={x * cell} y={y * cell}
          width={cell - 0.8} height={cell - 0.8} rx="0.6" className={cls} />
      );
    });
  });
  return <svg className="pixel-hand" viewBox={`0 0 ${cols * cell} ${rows * cell}`}>{rects}</svg>;
}

function FrameCLI() {
  return (
    <div className="frame frame-cli">
      <div className="cli-corner tl" /><div className="cli-corner tr" />
      <div className="cli-corner bl" /><div className="cli-corner br" />

      <div className="cli-inner">
        <div className="cli-welcome">Welcome to Aziz's Portfolio</div>

        <div className="cli-wordmark-row">
          <div className="cli-wordmark">HANDCTRL</div>
          <PixelHand />
        </div>
        <div className="cli-version">CLI Version 3.0.0</div>

        <div className="cli-commit">Version 3.0.0 · Commit a1z9f3c</div>

        <p className="cli-desc">
          Hand Ctrl can drive this whole site from across the room — no mouse,
          no keyboard. It uses your camera, runs locally, and tracks an open
          palm. Raise a hand to get started or type / for commands.
        </p>

        <div className="cli-bullets">
          <div className="cli-bullet"><span className="b-dot" /> Connected to optical tracking module</div>
          <div className="cli-bullet"><span className="b-dot" /> Loaded identity: Aziz Syed · Scarborough, ON</div>
          <div className="cli-bullet"><span className="b-dot" /> Modules: CV / 3D / Agents / Geospatial</div>
          <div className="cli-bullet"><span className="b-dot grn" /> Status: builds things that ship</div>
        </div>

        <div className="cli-promptline">~/aziz-portfolio <span className="cli-branch">[⎇ hand-mode]</span></div>

        <div className="cli-input">
          <span className="cli-arrow">&gt;</span>
          <span className="cli-ph">Raise an open palm or type <b>/engage</b> to begin</span>
          <span className="cli-cursor" />
        </div>
      </div>

      <div className="frame-tag">01 · CLI</div>
    </div>
  );
}

// ── FRAME 02 · HUD BOOT ───────────────────────────────────────────
const BOOT_LINES = [
  { k: "BOOT", v: "HAND CONTROL INTERFACE", s: "··" },
  { k: "OPTICAL ARRAY", v: "ONLINE", s: "OK" },
  { k: "DEPTH PLANE", v: "LOCKED", s: "OK" },
  { k: "HAND MESH", v: "21 KEYPOINTS MAPPED", s: "OK" },
  { k: "GESTURE MODEL", v: "OPEN PALM LOADED", s: "READY" },
  { k: "TRACKING", v: "OPTICAL INPUT LINKED", s: "LIVE" },
];

function Gauge({ cls, value, label, dash }) {
  // tick marks around the dial
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const long = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r1 = long ? 40 : 42.5;
    const r2 = 45;
    ticks.push(
      <line key={i}
        x1={48 + Math.cos(a) * r1} y1={48 + Math.sin(a) * r1}
        x2={48 + Math.cos(a) * r2} y2={48 + Math.sin(a) * r2}
        className={long ? "g-tick-l" : "g-tick"} />
    );
  }
  return (
    <div className="gauge">
      <svg viewBox="0 0 96 96">
        {/* outer tick scale */}
        <g className="g-ticks">{ticks}</g>
        {/* segmented outer ring — slow rotate */}
        <circle cx="48" cy="48" r="36" className="g-seg spin-cw" pathLength="1"
          style={{ strokeDasharray: "0.018 0.0153" }} />
        {/* two partial arcs at different radii — counter rotate */}
        <circle cx="48" cy="48" r="30" className="g-arc spin-ccw" pathLength="1"
          style={{ strokeDasharray: "0.6 1" }} />
        <circle cx="48" cy="48" r="24.5" className="g-arc-2 spin-cw-slow" pathLength="1"
          style={{ strokeDasharray: "0.3 1", transform: "rotate(140deg)", transformOrigin: "48px 48px" }} />
        {/* progress value ring */}
        <circle cx="48" cy="48" r="19" className={`g-prog ${cls}`} pathLength="1"
          transform="rotate(-90 48 48)" />
        <circle cx="48" cy="48" r="19" className="g-prog-track" />
        {/* dotted inner ring */}
        <circle cx="48" cy="48" r="13" className="g-dotted" pathLength="1"
          style={{ strokeDasharray: "0.006 0.018" }} />
      </svg>
      <div className="g-val">{value}</div>
      <div className="g-label">{label}</div>
    </div>
  );
}

// ── FRAME 02 · HUD BOOT — full JARVIS visor ───────────────────────
function TickBars({ n = 8 }) {
  const hs = [10, 15, 21, 27, 33, 27, 19, 13];
  return (
    <svg className="tickbars" viewBox="0 0 64 36">
      {Array.from({ length: n }).map((_, i) => {
        const h = hs[i % hs.length];
        return <rect key={i} x={i * 8} y={36 - h} width="4.5" height={h} className="tb" style={{ animationDelay: `${i * 0.08}s` }} />;
      })}
    </svg>
  );
}

function Honeycomb() {
  const size = 8.2, hexes = [];
  const w = Math.sqrt(3) * size, h = 2 * size;
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(-q - r) > 2) continue;
      hexes.push({ x: w * (q + r / 2), y: h * 0.75 * r });
    }
  }
  const pts = (cx, cy) => {
    const p = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i - 30); p.push(`${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`); }
    return p.join(" ");
  };
  return <g>{hexes.map((hx, i) => <polygon key={i} points={pts(hx.x, hx.y)} className="hex" style={{ animationDelay: `${(i % 6) * 0.18}s` }} />)}</g>;
}

function WorldMap() {
  const dots = [];
  // rough continent blobs as dot clusters (x,y in 0..200, 0..110)
  const blobs = [
    [[28,30],[34,26],[40,32],[30,42],[24,52],[30,60],[26,70],[36,50],[42,44]],            // americas
    [[92,30],[100,26],[108,32],[96,40],[104,48],[98,58],[106,66],[100,74],[112,40]],       // eur/africa
    [[130,24],[140,28],[150,24],[158,32],[148,40],[138,36],[164,40],[156,48]],             // asia
    [[160,78],[168,82],[174,78]],                                                          // australia
  ];
  blobs.forEach((b, bi) => b.forEach((p, i) => dots.push(<circle key={`${bi}-${i}`} cx={p[0]} cy={p[1]} r="1.6" className="wm-dot" />)));
  return (
    <svg className="worldmap" viewBox="0 0 200 110">
      {[20, 40, 60, 80].map((y) => <line key={y} x1="6" y1={y} x2="194" y2={y} className="wm-grid" />)}
      {[30, 70, 110, 150, 190].map((x) => <line key={x} x1={x} y1="8" x2={x} y2="100" className="wm-grid" />)}
      {dots}
    </svg>
  );
}

function Helix() {
  const a = [], b = [], rungs = [];
  for (let i = 0; i <= 36; i++) {
    const y = i * 3.2, x1 = 14 + 11 * Math.sin(i * 0.46), x2 = 14 + 11 * Math.sin(i * 0.46 + Math.PI);
    a.push(`${x1.toFixed(1)},${y}`); b.push(`${x2.toFixed(1)},${y}`);
    if (i % 3 === 0) rungs.push({ x1, x2, y });
  }
  return (
    <svg className="helix" viewBox="0 0 28 118">
      <polyline points={a.join(" ")} className="hx" />
      <polyline points={b.join(" ")} className="hx" />
      {rungs.map((r, i) => <line key={i} x1={r.x1} y1={r.y} x2={r.x2} y2={r.y} className="hx-rung" />)}
    </svg>
  );
}

function Launcher({ label }) {
  return (
    <div className="launch-item">
      <svg className="li-icon" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r="14" className="li-ring spin-cw" pathLength="1" style={{ strokeDasharray: "0.7 1" }} />
        <circle cx="19" cy="19" r="9" className="li-ring2" />
        <circle cx="19" cy="19" r="3" className="li-dot" />
      </svg>
      <div className="li-flag"><span>{label}</span></div>
    </div>
  );
}

function FrameBoot() {
  return (
    <div className="frame frame-boot">
      <div className="vignette" />

      {/* curved visor edges */}
      <svg className="visor" viewBox="0 0 1180 720" preserveAspectRatio="none">
        <path d="M44,70 Q590,30 1136,70" className="vz" />
        <path d="M52,86 Q590,48 1128,86" className="vz dim" />
        <path d="M44,650 Q590,690 1136,650" className="vz" />
        <path d="M52,634 Q590,672 1128,634" className="vz dim" />
        <path d="M44,70 Q14,360 44,650" className="vz" />
        <path d="M1136,70 Q1166,360 1136,650" className="vz" />
      </svg>

      {/* top edge ticks */}
      <div className="edge-ticks top">{Array.from({ length: 60 }).map((_, i) => <i key={i} style={{ height: i % 5 === 0 ? 9 : 5 }} />)}</div>
      <div className="edge-ticks bottom">{Array.from({ length: 60 }).map((_, i) => <i key={i} style={{ height: i % 5 === 0 ? 9 : 5 }} />)}</div>

      {/* ░░ TOP-LEFT cluster ░░ */}
      <div className="mod tl-cluster">
        <div className="tlc-row">
          <svg className="ico-mol" viewBox="0 0 30 30">
            <circle cx="6" cy="22" r="3" /><circle cx="15" cy="7" r="3" /><circle cx="24" cy="20" r="3" /><circle cx="15" cy="22" r="2" />
            <line x1="6" y1="22" x2="15" y2="7" /><line x1="15" y1="7" x2="24" y2="20" /><line x1="6" y1="22" x2="24" y2="20" />
          </svg>
          <span className="m-cap">MESH</span>
        </div>
        <div className="tlc-main">
          <svg className="tlc-arc" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" pathLength="1" style={{ strokeDasharray: "0.6 1" }} className="spin-ccw" /></svg>
          <div className="tlc-big">30<span>FPS</span></div>
        </div>
        <div className="tlc-sub">CAM 01 · 0xA1Z9F3C</div>
        <div className="tlc-batt"><span className="m-lab">FEED 100%</span><span className="batt"><i style={{ width: "100%" }} /></span></div>
        <div className="tlc-glyphs">⌁ ⌑ ⊞ ⊟ ◿ ▰▰▱</div>
      </div>

      {/* ░░ TOP-CENTER ░░ */}
      <div className="mod tc-cluster">
        <div className="tc-clock"><Clock /></div>
        <div className="tc-search"><svg viewBox="0 0 16 16" className="ico-search"><circle cx="6.5" cy="6.5" r="4.5" /><line x1="10" y1="10" x2="14" y2="14" /></svg> ENGAGE</div>
        <div className="tc-power">POWER <span className="chev">»</span></div>
        <div className="tc-bars">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ height: 4 + ((i * 7) % 14) }} />)}</div>
      </div>

      {/* ░░ TOP-RIGHT ░░ */}
      <div className="mod tr-cluster">
        <div className="trc-lab">DEPTH<br /><b>Z-PLANE</b></div>
        <div className="trc-big">28<span>MS</span> <em>LATENCY</em></div>
        <div className="trc-sub">0.64 CONF</div>
        <svg className="ico-fan spin-cw" viewBox="0 0 26 26"><path d="M13 13 L13 2 Q19 4 18 11 Z" /><path d="M13 13 L24 15 Q22 21 15 18 Z" /><path d="M13 13 L7 23 Q2 19 6 13 Z" /><circle cx="13" cy="13" r="2.2" /></svg>
        <TickBars n={8} />
      </div>

      {/* ░░ CENTER RETICLE ░░ */}
      <div className="reticle-mod">
        <svg className="ret" viewBox="0 0 380 380">
          {/* dashed outer ring */}
          <circle cx="190" cy="190" r="168" className="ret-dash spin-cw" pathLength="120" />
          {/* segmented tick ring */}
          <g className="spin-ccw-mid">
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i / 72) * Math.PI * 2;
              const r1 = i % 3 === 0 ? 150 : 156, r2 = 162;
              return <line key={i} x1={190 + Math.cos(a) * r1} y1={190 + Math.sin(a) * r1} x2={190 + Math.cos(a) * r2} y2={190 + Math.sin(a) * r2} className="ret-tk" />;
            })}
          </g>
          {/* solid arcs */}
          <circle cx="190" cy="190" r="134" className="ret-arc spin-cw-slow" pathLength="1" style={{ strokeDasharray: "0.93 1" }} />
          <circle cx="190" cy="190" r="116" className="ret-arc2 spin-ccw" pathLength="1" style={{ strokeDasharray: "0.16 1", transform: "rotate(20deg)", transformOrigin: "190px 190px" }} />
          <circle cx="190" cy="190" r="116" className="ret-arc3 spin-cw" pathLength="1" style={{ strokeDasharray: "0.08 1", transform: "rotate(190deg)", transformOrigin: "190px 190px" }} />
          {/* inner dashed */}
          <circle cx="190" cy="190" r="92" className="ret-inner spin-cw" pathLength="60" />
          {/* honeycomb core */}
          <g transform="translate(190 190)"><Honeycomb /></g>
          {/* crosshair ticks */}
          <line x1="190" y1="18" x2="190" y2="40" className="ret-cx" />
          <line x1="190" y1="340" x2="190" y2="362" className="ret-cx" />
          <line x1="18" y1="190" x2="40" y2="190" className="ret-cx" />
          <line x1="340" y1="190" x2="362" y2="190" className="ret-cx" />
        </svg>
        {/* angled tick bars upper-left of reticle */}
        <svg className="ret-bars" viewBox="0 0 60 60">{[36, 30, 24, 18, 12].map((h, i) => <rect key={i} x={i * 11} y={48 - h} width="6" height={h} className="rb" style={{ animationDelay: `${i * 0.1}s` }} />)}</svg>
        <div className="ret-num">21</div>
        <div className="ret-tag-l">TRACK</div>
        <div className="ret-tag-r">x:0.512</div>
      </div>

      {/* ░░ LEFT LAUNCHER ░░ */}
      <div className="mod launcher-col">
        {["VISION", "FULL-STACK", "3D ENGINE", "AI AGENTS", "GEOSPATIAL"].map((l) => <Launcher key={l} label={l} />)}
      </div>

      {/* ░░ HELIX + BIO ░░ */}
      <div className="mod bio-mod">
        <div className="bio-helix"><Helix /></div>
        <div className="bio-read">
          <div className="bio-line"><span>NAME</span> Aziz Syed</div>
          <div className="bio-line"><span>ROLE</span> Software Engineer</div>
          <div className="bio-line"><span>LOC</span> Scarborough, ON</div>
          <div className="bio-line"><span>FOCUS</span> CV · 3D · Agents</div>
          <div className="bio-line"><span>STATUS</span> Ships</div>
        </div>
      </div>

      {/* ░░ WORLD MAP ░░ */}
      <div className="mod map-mod"><WorldMap /></div>

      {/* ░░ RIGHT CPU GAUGE ░░ */}
      <div className="mod cpu-mod">
        <Gauge cls="g87" value="87" label="SYS" />
        <svg className="cpu-dial spin-cw-slow" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" pathLength="40" className="cd-ring" /><circle cx="24" cy="24" r="11" className="cd-in" /><circle cx="20" cy="24" r="1.6" /><circle cx="28" cy="24" r="1.6" /></svg>
      </div>

      {/* ░░ BOTTOM-RIGHT NETWORK ░░ */}
      <div className="mod net-mod">
        <div className="net-row"><span className="net-ar">▲</span> 707.0 KB <i className="net-bar"><b style={{ width: "67%" }} /></i></div>
        <div className="net-row"><span className="net-ar dn">▼</span> 614.0 KB <i className="net-bar"><b style={{ width: "54%" }} /></i></div>
        <div className="net-addr">
          <div><span>NODE</span> 113.22.43.111</div>
          <div><span>LINK</span> 192.168.1.100</div>
          <div><span>SYNC</span> 192.168.1.1</div>
        </div>
      </div>

      {/* ░░ BOTTOM-LEFT ░░ */}
      <div className="mod bl-mod">
        <div className="bl-prog">CALIBRATION <b>11 / 55</b></div>
        <div className="bl-icons">{Array.from({ length: 4 }).map((_, i) => <svg key={i} viewBox="0 0 24 24" className="bl-ic spin-cw" style={{ animationDuration: `${10 + i * 4}s` }}><circle cx="12" cy="12" r="8" pathLength="16" /><circle cx="12" cy="12" r="3" /></svg>)}</div>
      </div>

      {/* ░░ BOTTOM-CENTER ░░ */}
      <div className="mod bc-mod">
        <div className="bc-row">TRACKING ACTIVE · FRAME 00428 · DEPTH LOCKED</div>
        <div className="bc-sub">system · optical input linked · 21 keypoints / frame</div>
      </div>

      <div className="hud-corner-x tl on" /><div className="hud-corner-x tr on" />
      <div className="hud-corner-x bl on" /><div className="hud-corner-x br on" />
      <div className="frame-tag">02 · HUD BOOT</div>
    </div>
  );
}

function Clock() {
  const [t, setT] = React.useState("00:00:28");
  React.useEffect(() => {
    let s = 28;
    const id = setInterval(() => {
      s++;
      const mm = String(Math.floor(s / 60) % 60).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setT(`00:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}</span>;
}

// ── FRAME 03 · LIVE ───────────────────────────────────────────────
const NAV = ["Index", "About", "Services", "Work", "Contact", "Log"];

function FrameLive() {
  return (
    <div className="frame frame-live">
      <div className="vignette" />
      {/* settled faint reticle behind */}
      <svg className="live-reticle" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r="130" className="lr" pathLength="1" />
        <circle cx="150" cy="150" r="92" className="lr" pathLength="1" />
        <line x1="150" y1="8" x2="150" y2="44" className="lr" />
        <line x1="150" y1="256" x2="150" y2="292" className="lr" />
      </svg>

      {/* reskinned header */}
      <header className="live-top">
        <div className="live-brand">
          <span className="lb-mark">AZ</span>
          <span className="lb-meta"><b>Aziz Syed</b>Software Engineer</span>
        </div>
        <nav className="live-nav">
          {NAV.map((n, i) => (
            <span key={n} className={`ln ${i === 0 ? "on" : ""}`}>
              <i>{String(i + 1).padStart(2, "0")}</i>{n}
            </span>
          ))}
        </nav>
        <div className="live-pill">
          <span className="lp-dot" />
          Hand Ctrl · Live
        </div>
      </header>

      {/* hero hint */}
      <div className="live-hero">
        <div className="live-eyebrow">SPATIAL CONTROL · ENGAGED</div>
        <h1 className="live-display">
          I build software that <em>thinks</em>,<br />
          sees, and <em>responds</em>.
        </h1>
      </div>
      <div className="live-readout">
        <span><i className="lr-dot" /> TRACKING · OPEN PALM</span>
        <span>x:0.512 · y:0.488</span>
        <span>LATENCY · 28ms</span>
      </div>

      <div className="hud-corner-x tl on" /><div className="hud-corner-x tr on" />
      <div className="hud-corner-x bl on" /><div className="hud-corner-x br on" />
      <div className="frame-tag">03 · LIVE</div>
    </div>
  );
}

Object.assign(window, { FrameCLI, FrameBoot, FrameLive });
