import { useEffect, useRef, useState } from "react";
import { HUD_MS } from "../mode/ModeProvider";
import { BootVisor } from "./BootVisor";

// Hand Ctrl boot sequence (toggle-on). Ported from the design handoff
// (.design-bundle/.../Hand Ctrl Boot Sequence.html + handctrl-frames.jsx).
// `phase` ('cli' | 'hud') is driven by ModeProvider's single clock; this
// component is presentational. The frames are fixed 1180×720 layouts rendered
// on a centered stage scaled to fit any viewport. The visor fades out in the
// tail of the hud phase so the dissolve into the live site (HudReticle) is clean.

const DISSOLVE_MS = 450;

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Frame 01 · CLI ──────────────────────────────────────────────────
const HAND_GRID = [
  ".#.#.#.#.", ".#.#.#.#.", ".#.#.#.#.", ".#.#.#.#.",
  "#########", "#########", ".###g###.", ".#######.",
  ".#######.", "..*****..", "..*****..",
];
function PixelHand() {
  const cell = 7, cols = 9, rows = HAND_GRID.length, rects = [];
  HAND_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const cls = ch === "*" ? "px-mag" : ch === "g" ? "px-grn" : "px-blue";
      rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell - 0.8} height={cell - 0.8} rx="0.6" className={cls} />);
    });
  });
  return <svg className="pixel-hand" viewBox={`0 0 ${cols * cell} ${rows * cell}`}>{rects}</svg>;
}

function BootCli() {
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
    </div>
  );
}

export function BootSequence({ phase }) {
  const stageRef = useRef(null);
  const [leaving, setLeaving] = useState(false);

  // Scale the fixed 1180×720 stage to fit the viewport.
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1180, window.innerHeight / 720);
      if (stageRef.current) stageRef.current.style.setProperty("--boot-scale", String(s));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Fade the whole overlay out in the tail of the hud phase, so it's transparent
  // when handState flips to live and HudReticle takes over.
  useEffect(() => {
    if (phase !== "hud" || prefersReduced()) { setLeaving(false); return undefined; }
    const t = setTimeout(() => setLeaving(true), Math.max(0, HUD_MS - DISSOLVE_MS));
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="boot" data-leaving={leaving ? "1" : "0"} aria-hidden="true">
      <div className="boot-stage" ref={stageRef}>
        {phase === "cli" && <div className="boot-fade" key="cli"><BootCli /></div>}
        {phase === "hud" && <div className="boot-fade" key="hud"><BootVisor /></div>}
      </div>

      <style>{`
        .boot {
          --bnb: #05080B;
          --accent-dim: color-mix(in srgb, var(--accent) 55%, transparent);
          --live: #2FE6C0;
          --mag: #E06CD8;
          position: fixed; inset: 0; z-index: 240; overflow: hidden;
          background: var(--bnb); color: var(--fg); font-family: var(--f-mono);
          animation: boot-in 0.2s ease-out both;
        }
        .boot[data-leaving="1"] { animation: boot-out ${DISSOLVE_MS}ms ease-in forwards; }
        @keyframes boot-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes boot-out { from { opacity: 1; } to { opacity: 0; } }

        .boot-stage { position: absolute; left: 50%; top: 50%; width: 1180px; height: 720px;
          transform: translate(-50%, -50%) scale(var(--boot-scale, 1)); transform-origin: center; }
        .boot-fade { position: absolute; inset: 0; animation: boot-cross 0.28s ease-out both; }
        @keyframes boot-cross { from { opacity: 0; } to { opacity: 1; } }

        /* ── Frame shell ── */
        .boot .frame { position: relative; width: 100%; height: 100%; overflow: hidden;
          background: var(--bnb); color: var(--fg); font-family: var(--f-mono); }
        .boot .vignette { position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(120% 100% at 50% 42%, transparent 40%, rgba(0,0,0,0.55) 100%); }

        /* corner ticks */
        .boot .hud-corner-x { position: absolute; width: 26px; height: 26px; z-index: 5; }
        .boot .hud-corner-x::before, .boot .hud-corner-x::after { content: ""; position: absolute; background: var(--accent); opacity: 0.4; }
        .boot .hud-corner-x::before { width: 12px; height: 1px; }
        .boot .hud-corner-x::after { width: 1px; height: 12px; }
        .boot .hud-corner-x.on::before, .boot .hud-corner-x.on::after { opacity: 0.8; }
        .boot .tl { top: 20px; left: 20px; } .boot .tl::before, .boot .tl::after { top: 0; left: 0; }
        .boot .tr { top: 20px; right: 20px; } .boot .tr::before { top: 0; right: 0; } .boot .tr::after { top: 0; right: 0; }
        .boot .bl { bottom: 20px; left: 20px; } .boot .bl::before { bottom: 0; left: 0; } .boot .bl::after { bottom: 0; left: 0; }
        .boot .br { bottom: 20px; right: 20px; } .boot .br::before { bottom: 0; right: 0; } .boot .br::after { bottom: 0; right: 0; }

        /* ── FRAME 01 · CLI ── */
        .boot .frame-cli { background: #070B10; color: var(--fg); }
        .boot .frame-cli::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
          background-image: linear-gradient(color-mix(in srgb, var(--accent) 5%, transparent) 50%, transparent 50%); background-size: 100% 4px; }
        .boot .cli-corner { position: absolute; width: 26px; height: 26px; z-index: 5; }
        .boot .cli-corner::before, .boot .cli-corner::after { content: ""; position: absolute; background: var(--muted); opacity: 0.6; }
        .boot .cli-corner::before { width: 18px; height: 1.5px; }
        .boot .cli-corner::after { width: 1.5px; height: 18px; }
        .boot .cli-corner.tl { top: 26px; left: 30px; } .boot .cli-corner.tl::before, .boot .cli-corner.tl::after { top: 0; left: 0; }
        .boot .cli-corner.tr { top: 26px; right: 30px; } .boot .cli-corner.tr::before { top: 0; right: 0; } .boot .cli-corner.tr::after { top: 0; right: 0; }
        .boot .cli-corner.bl { bottom: 26px; left: 30px; } .boot .cli-corner.bl::before { bottom: 0; left: 0; } .boot .cli-corner.bl::after { bottom: 0; left: 0; }
        .boot .cli-corner.br { bottom: 26px; right: 30px; } .boot .cli-corner.br::before { bottom: 0; right: 0; } .boot .cli-corner.br::after { bottom: 0; right: 0; }
        .boot .cli-inner { position: absolute; inset: 0; padding: 52px 64px; display: flex; flex-direction: column; font-family: var(--f-mono); z-index: 4; }
        .boot .cli-welcome { font-size: 13px; color: var(--muted); letter-spacing: 0.02em; margin-bottom: 14px; }
        .boot .cli-wordmark-row { display: flex; align-items: center; gap: 26px; }
        .boot .cli-wordmark { font-family: "Press Start 2P", "JetBrains Mono", monospace; font-size: 46px; line-height: 1;
          color: var(--accent); letter-spacing: 2px; -webkit-text-stroke: 1.5px #1C5C78;
          text-shadow: 0 5px 0 rgba(10,40,58,0.85), 0 0 18px color-mix(in srgb, var(--accent) 25%, transparent); }
        .boot .pixel-hand { width: 70px; height: auto; display: block; }
        .boot .pixel-hand .px-blue { fill: var(--accent); }
        .boot .pixel-hand .px-mag { fill: var(--mag); }
        .boot .pixel-hand .px-grn { fill: var(--live); }
        .boot .cli-version { font-size: 12px; color: var(--muted); margin-top: 10px; align-self: flex-start; }
        .boot .cli-commit { font-size: 12px; color: var(--muted-2); margin-top: 20px; padding-bottom: 16px; border-bottom: 0.5px solid var(--line); }
        .boot .cli-desc { font-size: 13.5px; line-height: 1.6; color: var(--fg); max-width: 64ch; margin: 18px 0 22px; }
        .boot .cli-bullets { display: flex; flex-direction: column; gap: 9px; }
        .boot .cli-bullet { display: flex; align-items: center; gap: 11px; font-size: 13px; color: var(--fg); }
        .boot .b-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 7px 0 var(--accent-dim); flex: none; }
        .boot .b-dot.grn { background: var(--live); box-shadow: 0 0 7px 0 color-mix(in srgb, var(--live) 50%, transparent); }
        .boot .cli-promptline { margin-top: auto; font-size: 13px; color: var(--accent); font-weight: 500; padding-top: 22px; }
        .boot .cli-branch { color: var(--mag); }
        .boot .cli-input { margin-top: 12px; display: flex; align-items: center; gap: 12px; border: 0.5px solid var(--line-strong);
          border-radius: 8px; padding: 13px 16px; background: color-mix(in srgb, var(--accent) 4%, transparent); }
        .boot .cli-arrow { color: var(--accent); font-size: 14px; font-weight: 500; }
        .boot .cli-ph { font-size: 13px; color: var(--muted); }
        .boot .cli-ph b { color: var(--accent); font-weight: 500; }
        .boot .cli-cursor { width: 8px; height: 15px; background: var(--accent); margin-left: -6px; animation: boot-cblink 1s steps(1) infinite; }
        @keyframes boot-cblink { 50% { opacity: 0; } }

        /* ── FRAME 02 · JARVIS VISOR ── */
        .boot .frame-boot { background: radial-gradient(ellipse 58% 52% at 50% 46%, #0a1a28 0%, #05080c 72%); }
        .boot .frame-boot .mod { position: absolute; font-family: var(--f-mono); color: var(--accent); z-index: 4; }

        .boot .visor { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .boot .vz { fill: none; stroke: var(--accent); stroke-width: 1.2; opacity: 0.5; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .vz.dim { opacity: 0.2; filter: none; }
        .boot .edge-ticks { position: absolute; left: 70px; right: 70px; display: flex; justify-content: space-between; z-index: 3; pointer-events: none; }
        .boot .edge-ticks.top { top: 30px; align-items: flex-end; }
        .boot .edge-ticks.bottom { bottom: 30px; align-items: flex-start; }
        .boot .edge-ticks i { width: 1px; background: var(--accent); opacity: 0.4; display: block; }

        /* rotation drivers */
        .boot .spin-cw { transform-box: fill-box; transform-origin: center; animation: boot-spin 14s linear infinite; }
        .boot .spin-cw-slow { transform-box: fill-box; transform-origin: center; animation: boot-spin 26s linear infinite; }
        .boot .spin-ccw { transform-box: fill-box; transform-origin: center; animation: boot-spinrev 20s linear infinite; }
        .boot .spin-ccw-mid { transform-box: fill-box; transform-origin: center; animation: boot-spinrev 32s linear infinite; }
        @keyframes boot-spin { to { transform: rotate(360deg); } }
        @keyframes boot-spinrev { to { transform: rotate(-360deg); } }

        /* gauge */
        .boot .gauge { position: relative; width: 96px; text-align: center; }
        .boot .gauge svg { width: 96px; height: 96px; display: block; overflow: visible; }
        .boot .g-tick { stroke: var(--accent); stroke-width: 0.75; opacity: 0.35; }
        .boot .g-tick-l { stroke: var(--accent); stroke-width: 1; opacity: 0.65; }
        .boot .g-seg { fill: none; stroke: var(--accent); stroke-width: 2.5; opacity: 0.55; }
        .boot .g-arc { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.7; stroke-linecap: round; }
        .boot .g-arc-2 { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.45; stroke-linecap: round; }
        .boot .g-dotted { fill: none; stroke: var(--accent); stroke-width: 2; opacity: 0.5; stroke-linecap: round; }
        .boot .g-prog-track { fill: none; stroke: var(--line); stroke-width: 2; }
        .boot .g-prog { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 0 1; filter: drop-shadow(0 0 2px var(--accent-dim)); }
        .boot .g87 { animation: boot-g87 1.2s ease forwards 0.5s; }
        @keyframes boot-g87 { from { stroke-dasharray: 0 1; } to { stroke-dasharray: 0.87 1; } }
        .boot .g-val { position: absolute; top: 40px; left: 0; right: 0; font-size: 13px; color: var(--fg); letter-spacing: 0.02em; }
        .boot .g-label { position: absolute; top: 56px; left: 0; right: 0; font-size: 8px; letter-spacing: 0.18em; color: var(--muted); }

        /* top-left cluster */
        .boot .tl-cluster { left: 54px; top: 92px; width: 240px; }
        .boot .tlc-row { display: flex; align-items: center; gap: 9px; }
        .boot .ico-mol { width: 26px; height: 26px; }
        .boot .ico-mol circle { fill: var(--accent); } .boot .ico-mol line { stroke: var(--accent); stroke-width: 1; }
        .boot .m-cap { font-size: 10px; letter-spacing: 0.2em; color: var(--muted); }
        .boot .tlc-main { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .boot .tlc-arc { width: 52px; height: 52px; } .boot .tlc-arc circle { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linecap: round; }
        .boot .tlc-big { font-size: 40px; color: var(--fg); line-height: 1; display: flex; align-items: baseline; gap: 5px; }
        .boot .tlc-big span { font-size: 13px; color: var(--muted); }
        .boot .tlc-sub { font-size: 9px; letter-spacing: 0.16em; color: var(--muted-2); margin-top: 4px; }
        .boot .tlc-batt { display: flex; align-items: center; gap: 9px; margin-top: 12px; }
        .boot .m-lab { font-size: 10px; letter-spacing: 0.12em; color: var(--muted); }
        .boot .batt { width: 46px; height: 13px; border: 1px solid var(--line-strong); border-radius: 2px; padding: 1.5px; position: relative; }
        .boot .batt::after { content: ""; position: absolute; right: -3px; top: 3.5px; width: 2px; height: 5px; background: var(--line-strong); }
        .boot .batt i { display: block; height: 100%; background: var(--accent); border-radius: 1px; }
        .boot .tlc-glyphs { font-size: 11px; color: var(--line-strong); letter-spacing: 0.22em; margin-top: 14px; }

        /* top-center */
        .boot .tc-cluster { left: 50%; transform: translateX(-50%); top: 24px; display: flex; flex-direction: column; align-items: center; gap: 9px; }
        .boot .tc-clock { font-size: 26px; color: var(--fg); letter-spacing: 0.08em; }
        .boot .tc-search { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 0.14em; color: var(--accent); border: 0.5px solid var(--line-strong); border-radius: 999px; padding: 4px 13px; }
        .boot .ico-search { width: 13px; height: 13px; } .boot .ico-search circle, .boot .ico-search line { fill: none; stroke: var(--accent); stroke-width: 1.4; }
        .boot .tc-power { font-size: 9px; letter-spacing: 0.2em; color: var(--muted); } .boot .chev { color: var(--accent); }
        .boot .tc-bars { display: flex; align-items: flex-end; gap: 3px; height: 18px; }
        .boot .tc-bars i { width: 3px; background: var(--accent); opacity: 0.7; }

        /* top-right */
        .boot .tr-cluster { right: 60px; top: 92px; width: 220px; display: flex; flex-direction: column; align-items: flex-end; gap: 7px; text-align: right; }
        .boot .trc-lab { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); line-height: 1.4; } .boot .trc-lab b { color: var(--fg); }
        .boot .trc-big { font-size: 30px; color: var(--fg); display: flex; align-items: baseline; gap: 6px; }
        .boot .trc-big span { font-size: 13px; color: var(--muted); } .boot .trc-big em { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); font-style: normal; }
        .boot .trc-sub { font-size: 11px; color: var(--accent); }
        .boot .ico-fan { width: 24px; height: 24px; } .boot .ico-fan path { fill: var(--accent); opacity: 0.5; } .boot .ico-fan circle { fill: var(--accent); }
        .boot .tickbars { width: 64px; height: 36px; } .boot .tb { fill: var(--accent); opacity: 0.7; animation: boot-barpulse 1.8s ease-in-out infinite; }

        /* center reticle */
        .boot .reticle-mod { position: absolute; left: 50%; top: 50%; transform: translate(-52%, -46%); width: 380px; height: 380px; z-index: 4; }
        .boot .ret { width: 380px; height: 380px; display: block; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 45%, transparent)); }
        .boot .ret-dash { fill: none; stroke: var(--accent); stroke-width: 3; stroke-dasharray: 1.6 1.4; opacity: 0.9; }
        .boot .ret-tk { stroke: var(--accent); stroke-width: 1.3; opacity: 0.7; }
        .boot .ret-arc { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; opacity: 0.85; }
        .boot .ret-arc2 { fill: none; stroke: var(--accent-bright); stroke-width: 4; stroke-linecap: round; opacity: 0.95; }
        .boot .ret-arc3 { fill: none; stroke: var(--accent-bright); stroke-width: 4; stroke-linecap: round; opacity: 0.8; }
        .boot .ret-inner { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 1 1.4; opacity: 0.7; }
        .boot .hex { fill: color-mix(in srgb, var(--accent) 10%, transparent); stroke: var(--accent); stroke-width: 0.8; animation: boot-hexpulse 3s ease-in-out infinite; }
        @keyframes boot-hexpulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .boot .ret-cx { stroke: var(--accent); stroke-width: 1.5; opacity: 0.8; }
        .boot .ret-bars { position: absolute; left: 30px; top: 64px; width: 64px; height: 56px; transform: rotate(-12deg); }
        .boot .rb { fill: var(--accent); animation: boot-barpulse 1.6s ease-in-out infinite; }
        @keyframes boot-barpulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        .boot .ret-num { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(6px); text-align: center; font-size: 11px; color: var(--accent); letter-spacing: 0.1em; }
        .boot .ret-tag-l { position: absolute; left: 16px; top: 176px; font-size: 9px; letter-spacing: 0.12em; color: var(--accent); }
        .boot .ret-tag-r { position: absolute; right: 8px; top: 176px; font-size: 9px; letter-spacing: 0.12em; color: var(--accent); }

        /* left launcher column */
        .boot .launcher-col { left: 46px; top: 296px; display: flex; flex-direction: column; gap: 13px; }
        .boot .launch-item { display: flex; align-items: center; }
        .boot .li-icon { width: 36px; height: 36px; flex: none; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .li-ring { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; }
        .boot .li-ring2 { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.5; } .boot .li-dot { fill: var(--accent); }
        .boot .li-flag { margin-left: -3px; height: 20px; display: flex; align-items: center; padding: 0 16px 0 10px; border: 0.5px solid var(--line-strong); border-left: none; background: color-mix(in srgb, var(--accent) 5%, transparent); clip-path: polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%); }
        .boot .li-flag span { font-size: 9.5px; letter-spacing: 0.14em; color: var(--muted); white-space: nowrap; }

        /* helix + bio */
        .boot .bio-mod { left: 232px; bottom: 86px; display: flex; gap: 14px; align-items: flex-start; }
        .boot .helix { width: 28px; height: 118px; filter: drop-shadow(0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .hx { fill: none; stroke: var(--accent); stroke-width: 1.4; opacity: 0.85; } .boot .hx-rung { stroke: var(--accent); stroke-width: 1; opacity: 0.4; }
        .boot .bio-read { display: flex; flex-direction: column; gap: 5px; padding-top: 6px; }
        .boot .bio-line { font-size: 11px; color: var(--fg); display: flex; gap: 8px; }
        .boot .bio-line span { display: inline-block; width: 52px; font-size: 9px; letter-spacing: 0.12em; color: var(--muted); }

        /* world map */
        .boot .map-mod { right: 218px; top: 138px; width: 200px; opacity: 0.85; }
        .boot .worldmap { width: 200px; height: 110px; } .boot .wm-grid { stroke: var(--accent); stroke-width: 0.5; opacity: 0.16; } .boot .wm-dot { fill: var(--accent); opacity: 0.7; }

        /* right CPU gauge */
        .boot .cpu-mod { right: 64px; top: 322px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .boot .cpu-dial { width: 48px; height: 48px; } .boot .cd-ring { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 1 1.5; } .boot .cd-in { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.5; }
        .boot .cpu-dial circle:not([class]) { fill: var(--accent); }

        /* bottom-right network */
        .boot .net-mod { right: 60px; bottom: 104px; width: 230px; }
        .boot .net-row { font-size: 11px; color: var(--fg); display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 6px; }
        .boot .net-ar { color: var(--accent); font-size: 9px; } .boot .net-ar.dn { color: var(--mag); }
        .boot .net-bar { width: 60px; height: 4px; border: 0.5px solid var(--line); border-radius: 2px; overflow: hidden; } .boot .net-bar b { display: block; height: 100%; background: var(--accent); }
        .boot .net-addr { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
        .boot .net-addr div { font-size: 9.5px; color: var(--muted); display: flex; justify-content: flex-end; gap: 8px; } .boot .net-addr span { color: var(--muted-2); letter-spacing: 0.12em; }

        /* bottom-left */
        .boot .bl-mod { left: 54px; bottom: 84px; }
        .boot .bl-prog { font-size: 10px; letter-spacing: 0.14em; color: var(--muted); } .boot .bl-prog b { color: var(--accent); }
        .boot .bl-icons { display: flex; gap: 10px; margin-top: 10px; }
        .boot .bl-ic { width: 24px; height: 24px; } .boot .bl-ic circle { fill: none; stroke: var(--accent); stroke-width: 1.2; } .boot .bl-ic circle:last-child { fill: var(--accent); }

        /* bottom-center */
        .boot .bc-mod { left: 50%; transform: translateX(-50%); bottom: 52px; text-align: center; }
        .boot .bc-row { font-size: 10px; letter-spacing: 0.14em; color: var(--accent); }
        .boot .bc-sub { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); margin-top: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .boot, .boot * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
