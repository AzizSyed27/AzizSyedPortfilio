import { useEffect, useRef, useState } from "react";
import { HUD_MS, HUD_DISSOLVE_MS } from "./bootTimeline";
import { useMode } from "../mode/ModeProvider";
import { BootCli } from "./BootCli";
import { BootVisor } from "./BootVisor";

// Hand Ctrl boot sequence (toggle-on): black pre-roll → typed CLI → staged
// JARVIS HUD → dissolve to live. `phase` ('black'|'cli'|'hud') comes from
// ModeProvider's single clock; this component is presentational + owns the
// scaled 1180×720 stage and the skip handlers. Click anywhere / Esc → skip to
// live; the HandCtrl pill (above this overlay) still cancels to standby.

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function BootSequence({ phase }) {
  const stageRef = useRef(null);
  const [leaving, setLeaving] = useState(false);
  const { skipToLive, toggleHandMode } = useMode();

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

  // Esc skips to live — listener only while the boot overlay is mounted.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") skipToLive(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skipToLive]);

  // Fade the overlay out in the tail of the hud phase, so it's transparent when
  // handState flips to live and HudReticle takes over.
  useEffect(() => {
    if (phase !== "hud" || prefersReduced()) { setLeaving(false); return undefined; }
    const t = setTimeout(() => setLeaving(true), Math.max(0, HUD_MS - HUD_DISSOLVE_MS));
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="boot" data-leaving={leaving ? "1" : "0"} onClick={skipToLive} aria-hidden="true">
      <div className="boot-stage" ref={stageRef}>
        {phase === "black" && <div className="boot-poweron" />}
        {phase === "cli" && <div className="boot-fade" key="cli"><BootCli /></div>}
        {phase === "hud" && <div className="boot-fade" key="hud"><BootVisor /></div>}
      </div>

      <button
        className="boot-abort"
        onClick={(e) => { e.stopPropagation(); toggleHandMode(); }}
        aria-label="Cancel hand control"
        type="button"
      >✕ abort</button>
      <div className="boot-hint" aria-hidden="true">click / esc to skip</div>

      <style>{`
        .boot {
          --bnb: #05080B;
          --accent-dim: color-mix(in srgb, var(--accent) 55%, transparent);
          --live: #2FE6C0;
          --mag: #E06CD8;
          position: fixed; inset: 0; z-index: 240; overflow: hidden;
          background: var(--bnb); color: var(--fg); font-family: var(--f-mono);
          animation: boot-in 0.18s ease-out both; cursor: pointer;
        }
        .boot[data-leaving="1"] { animation: boot-out ${HUD_DISSOLVE_MS}ms ease-in forwards; }
        @keyframes boot-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes boot-out { from { opacity: 1; } to { opacity: 0; } }

        .boot-stage { position: absolute; left: 50%; top: 50%; width: 1180px; height: 720px;
          transform: translate(-50%, -50%) scale(var(--boot-scale, 1)); transform-origin: center; }
        .boot-fade { position: absolute; inset: 0; animation: boot-cross 0.28s ease-out both; }
        @keyframes boot-cross { from { opacity: 0; } to { opacity: 1; } }

        /* skip / abort affordances */
        .boot-abort { position: absolute; top: 22px; right: 22px; z-index: 50; cursor: pointer;
          font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--muted); background: transparent; border: 0.5px solid var(--line-strong);
          border-radius: 999px; padding: 6px 12px; transition: color .2s, border-color .2s, background .2s; }
        .boot-abort:hover { color: var(--mag); border-color: var(--mag); }
        .boot-hint { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); z-index: 50;
          font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--muted-2); pointer-events: none; animation: boot-hintpulse 2s ease-in-out infinite; }
        @keyframes boot-hintpulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.75; } }

        /* ── Black pre-roll · CRT power-on ── */
        .boot-poweron { position: absolute; inset: 0; background: #000; }
        .boot-poweron::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 2px;
          background: var(--accent-bright); box-shadow: 0 0 22px var(--accent);
          transform: translateY(-50%) scaleX(0); transform-origin: center;
          animation: boot-power 900ms cubic-bezier(.5,0,.2,1) both; }
        @keyframes boot-power {
          0% { transform: translateY(-50%) scaleX(0) scaleY(1); opacity: 0; }
          16% { opacity: 1; }
          42% { transform: translateY(-50%) scaleX(1) scaleY(1); opacity: 1; }
          62% { transform: translateY(-50%) scaleX(1) scaleY(3); opacity: 0.95; }
          100% { transform: translateY(-50%) scaleX(1) scaleY(420); opacity: 0; }
        }

        /* ── Frame shell ── */
        .boot .frame { position: relative; width: 100%; height: 100%; overflow: hidden;
          color: var(--fg); font-family: var(--f-mono); }
        .boot .vignette { position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(120% 100% at 50% 42%, transparent 40%, rgba(0,0,0,0.55) 100%); }

        .boot .hud-corner-x { position: absolute; width: 26px; height: 26px; z-index: 5; }
        .boot .hud-corner-x::before, .boot .hud-corner-x::after { content: ""; position: absolute; background: var(--accent); opacity: 0.4; }
        .boot .hud-corner-x::before { width: 12px; height: 1px; }
        .boot .hud-corner-x::after { width: 1px; height: 12px; }
        .boot .hud-corner-x.on::before, .boot .hud-corner-x.on::after { opacity: 0.8; }
        .boot .tl { top: 20px; left: 20px; } .boot .tl::before, .boot .tl::after { top: 0; left: 0; }
        .boot .tr { top: 20px; right: 20px; } .boot .tr::before { top: 0; right: 0; } .boot .tr::after { top: 0; right: 0; }
        .boot .bl { bottom: 20px; left: 20px; } .boot .bl::before { bottom: 0; left: 0; } .boot .bl::after { bottom: 0; left: 0; }
        .boot .br { bottom: 20px; right: 20px; } .boot .br::before { bottom: 0; right: 0; } .boot .br::after { bottom: 0; right: 0; }

        /* ── FRAME 01 · CLI terminal card (smaller, centered, typed) ── */
        .boot .frame-cli { display: grid; place-items: center; background: transparent; }
        .boot .cli-card { position: relative; width: 660px; max-width: 86%; height: 430px; overflow: hidden;
          background: #070B10; border: 0.5px solid var(--line-strong); border-radius: 10px;
          box-shadow: 0 40px 90px -40px #000, inset 0 0 0 1px var(--line); }
        .boot .cli-card::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
          background-image: linear-gradient(color-mix(in srgb, var(--accent) 5%, transparent) 50%, transparent 50%); background-size: 100% 4px; }
        .boot .cli-titlebar { display: flex; align-items: center; gap: 10px; padding: 9px 14px;
          border-bottom: 0.5px solid var(--line); font-size: 11px; letter-spacing: 0.1em; color: var(--muted); }
        .boot .cli-dots { display: flex; gap: 5px; } .boot .cli-dots i { width: 8px; height: 8px; border-radius: 50%; background: var(--line-strong); }
        .boot .cli-title { color: var(--muted); }
        .boot .cli-titlebar .pixel-hand { width: 28px; height: auto; margin-left: auto; display: block; }
        .boot .pixel-hand .px-blue { fill: var(--accent); } .boot .pixel-hand .px-mag { fill: var(--mag); } .boot .pixel-hand .px-grn { fill: var(--live); }
        .boot .cli-body { position: relative; z-index: 1; padding: 18px 22px; font-family: var(--f-mono); font-size: 13px; line-height: 1.75; }
        .boot .cli-line { white-space: pre-wrap; color: var(--fg); }
        .boot .cli-cmd { color: var(--accent); } .boot .cli-dim { color: var(--muted); } .boot .cli-prompt { color: var(--accent); }
        .boot .cli-stamp.s-ok { color: var(--live); } .boot .cli-stamp.s-wait { color: var(--accent); }
        .boot .cli-cur { display: inline-block; width: 8px; height: 14px; background: var(--accent); margin-left: 2px; vertical-align: -2px; animation: boot-cblink 1s steps(1) infinite; }
        @keyframes boot-cblink { 50% { opacity: 0; } }

        /* ── FRAME 02 · JARVIS VISOR ── */
        .boot .frame-boot { background: radial-gradient(ellipse 58% 52% at 50% 46%, #0a1a28 0%, #05080c 72%); }
        .boot .frame-boot .mod { position: absolute; font-family: var(--f-mono); color: var(--accent); z-index: 4; }

        /* staged power-on wave */
        .boot .bmod { animation: boot-modon 520ms ease-out both; }
        @keyframes boot-modon {
          0% { opacity: 0; filter: brightness(2.4) drop-shadow(0 0 6px var(--accent)); }
          55% { opacity: 1; }
          100% { opacity: 1; filter: none; }
        }
        /* CRT scan sweep */
        .boot .boot-scan { position: absolute; left: 0; right: 0; top: 0; height: 140px; z-index: 3; pointer-events: none;
          background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 9%, transparent), transparent);
          animation: boot-scan 3.4s linear infinite; }
        @keyframes boot-scan { from { transform: translateY(-140px); } to { transform: translateY(740px); } }
        /* glitch bursts */
        .boot .boot-glitch { position: absolute; inset: 0; z-index: 30; pointer-events: none; opacity: 0; mix-blend-mode: screen;
          animation: boot-glitchburst 380ms linear both; }
        @keyframes boot-glitchburst {
          0%, 100% { opacity: 0; transform: none; background: transparent; }
          8% { opacity: 0.9; clip-path: inset(38% 0 40% 0); transform: translateX(-7px); background: color-mix(in srgb, var(--mag) 35%, transparent); }
          18% { clip-path: inset(70% 0 8% 0); transform: translateX(7px); background: color-mix(in srgb, var(--accent) 30%, transparent); }
          30% { clip-path: inset(8% 0 78% 0); transform: translateX(-4px); opacity: 0.7; background: color-mix(in srgb, var(--accent-bright) 28%, transparent); }
          46% { opacity: 0; transform: none; }
        }
        /* reticle lock-on */
        .boot .ret-lock { position: absolute; inset: 92px; opacity: 0; animation: boot-lock 520ms cubic-bezier(.2,1.2,.3,1) both; }
        .boot .ret-lock .lk { position: absolute; width: 24px; height: 24px; border: 2px solid var(--live); filter: drop-shadow(0 0 5px var(--live)); }
        .boot .ret-lock .lk.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
        .boot .ret-lock .lk.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
        .boot .ret-lock .lk.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
        .boot .ret-lock .lk.br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
        @keyframes boot-lock { 0% { opacity: 0; transform: scale(1.5); } 60% { opacity: 1; } 100% { opacity: 1; transform: scale(1); } }
        .boot .ret-locklabel { position: absolute; left: 0; right: 0; bottom: 30px; text-align: center;
          font-size: 10px; letter-spacing: 0.28em; color: var(--live); text-shadow: 0 0 8px var(--live);
          opacity: 0; animation: boot-lockflash 1.2s ease-out both; }
        @keyframes boot-lockflash { 0% { opacity: 0; } 12% { opacity: 1; } 70% { opacity: 1; } 85% { opacity: 0.35; } 100% { opacity: 1; } }
        /* magenta alert that resolves */
        .boot .trc-alert { animation: boot-alert 1s ease-out both; animation-delay: 1300ms; }
        @keyframes boot-alert { 0%, 100% { color: var(--fg); text-shadow: none; } 22% { color: var(--mag); text-shadow: 0 0 9px var(--mag); } 55% { color: var(--mag); } 75% { color: var(--live); } }
        /* ONLINE stamp */
        .boot .boot-online { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 31;
          font-size: 22px; letter-spacing: 0.34em; color: var(--accent-bright); text-shadow: 0 0 22px var(--accent);
          opacity: 0; animation: boot-online 1100ms ease-out both; }
        @keyframes boot-online { 0% { opacity: 0; transform: translate(-50%,-50%) scale(1.35); filter: blur(5px); } 18% { opacity: 1; filter: blur(0); } 30% { transform: translate(-50%,-50%) scale(1); } 100% { opacity: 1; } }

        .boot .visor { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .boot .vz { fill: none; stroke: var(--accent); stroke-width: 1.2; opacity: 0.5; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .vz.dim { opacity: 0.2; filter: none; }
        .boot .edge-ticks { position: absolute; left: 70px; right: 70px; display: flex; justify-content: space-between; z-index: 3; pointer-events: none; }
        .boot .edge-ticks.top { top: 30px; align-items: flex-end; }
        .boot .edge-ticks.bottom { bottom: 30px; align-items: flex-start; }
        .boot .edge-ticks i { width: 1px; background: var(--accent); opacity: 0.4; display: block; }

        .boot .spin-cw { transform-box: fill-box; transform-origin: center; animation: boot-spin 14s linear infinite; }
        .boot .spin-cw-slow { transform-box: fill-box; transform-origin: center; animation: boot-spin 26s linear infinite; }
        .boot .spin-ccw { transform-box: fill-box; transform-origin: center; animation: boot-spinrev 20s linear infinite; }
        .boot .spin-ccw-mid { transform-box: fill-box; transform-origin: center; animation: boot-spinrev 32s linear infinite; }
        @keyframes boot-spin { to { transform: rotate(360deg); } }
        @keyframes boot-spinrev { to { transform: rotate(-360deg); } }

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

        .boot .tl-cluster { left: 54px; top: 92px; width: 240px; }
        .boot .tlc-row { display: flex; align-items: center; gap: 9px; }
        .boot .ico-mol { width: 26px; height: 26px; } .boot .ico-mol circle { fill: var(--accent); } .boot .ico-mol line { stroke: var(--accent); stroke-width: 1; }
        .boot .m-cap { font-size: 10px; letter-spacing: 0.2em; color: var(--muted); }
        .boot .tlc-main { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .boot .tlc-arc { width: 52px; height: 52px; } .boot .tlc-arc circle { fill: none; stroke: var(--accent); stroke-width: 2.5; stroke-linecap: round; }
        .boot .tlc-big { font-size: 40px; color: var(--fg); line-height: 1; display: flex; align-items: baseline; gap: 5px; } .boot .tlc-big span { font-size: 13px; color: var(--muted); }
        .boot .tlc-sub { font-size: 9px; letter-spacing: 0.16em; color: var(--muted-2); margin-top: 4px; }
        .boot .tlc-batt { display: flex; align-items: center; gap: 9px; margin-top: 12px; }
        .boot .m-lab { font-size: 10px; letter-spacing: 0.12em; color: var(--muted); }
        .boot .batt { width: 46px; height: 13px; border: 1px solid var(--line-strong); border-radius: 2px; padding: 1.5px; position: relative; }
        .boot .batt::after { content: ""; position: absolute; right: -3px; top: 3.5px; width: 2px; height: 5px; background: var(--line-strong); }
        .boot .batt i { display: block; height: 100%; background: var(--accent); border-radius: 1px; }
        .boot .tlc-glyphs { font-size: 11px; color: var(--line-strong); letter-spacing: 0.22em; margin-top: 14px; }

        .boot .tc-cluster { left: 50%; transform: translateX(-50%); top: 24px; display: flex; flex-direction: column; align-items: center; gap: 9px; }
        .boot .tc-clock { font-size: 26px; color: var(--fg); letter-spacing: 0.08em; }
        .boot .tc-search { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; letter-spacing: 0.14em; color: var(--accent); border: 0.5px solid var(--line-strong); border-radius: 999px; padding: 4px 13px; }
        .boot .ico-search { width: 13px; height: 13px; } .boot .ico-search circle, .boot .ico-search line { fill: none; stroke: var(--accent); stroke-width: 1.4; }
        .boot .tc-power { font-size: 9px; letter-spacing: 0.2em; color: var(--muted); } .boot .chev { color: var(--accent); }
        .boot .tc-bars { display: flex; align-items: flex-end; gap: 3px; height: 18px; } .boot .tc-bars i { width: 3px; background: var(--accent); opacity: 0.7; }

        .boot .tr-cluster { right: 60px; top: 92px; width: 220px; display: flex; flex-direction: column; align-items: flex-end; gap: 7px; text-align: right; }
        .boot .trc-lab { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); line-height: 1.4; } .boot .trc-lab b { color: var(--fg); }
        .boot .trc-big { font-size: 30px; color: var(--fg); display: flex; align-items: baseline; gap: 6px; } .boot .trc-big span { font-size: 13px; color: var(--muted); } .boot .trc-big em { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); font-style: normal; }
        .boot .trc-sub { font-size: 11px; color: var(--accent); }
        .boot .ico-fan { width: 24px; height: 24px; } .boot .ico-fan path { fill: var(--accent); opacity: 0.5; } .boot .ico-fan circle { fill: var(--accent); }
        .boot .tickbars { width: 64px; height: 36px; } .boot .tb { fill: var(--accent); opacity: 0.7; animation: boot-barpulse 1.8s ease-in-out infinite; }

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

        .boot .launcher-col { left: 46px; top: 296px; display: flex; flex-direction: column; gap: 13px; }
        .boot .launch-item { display: flex; align-items: center; }
        .boot .li-icon { width: 36px; height: 36px; flex: none; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .li-ring { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; }
        .boot .li-ring2 { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.5; } .boot .li-dot { fill: var(--accent); }
        .boot .li-flag { margin-left: -3px; height: 20px; display: flex; align-items: center; padding: 0 16px 0 10px; border: 0.5px solid var(--line-strong); border-left: none; background: color-mix(in srgb, var(--accent) 5%, transparent); clip-path: polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%); }
        .boot .li-flag span { font-size: 9.5px; letter-spacing: 0.14em; color: var(--muted); white-space: nowrap; }

        .boot .bio-mod { left: 232px; bottom: 86px; display: flex; gap: 14px; align-items: flex-start; }
        .boot .helix { width: 28px; height: 118px; filter: drop-shadow(0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)); }
        .boot .hx { fill: none; stroke: var(--accent); stroke-width: 1.4; opacity: 0.85; } .boot .hx-rung { stroke: var(--accent); stroke-width: 1; opacity: 0.4; }
        .boot .bio-read { display: flex; flex-direction: column; gap: 5px; padding-top: 6px; }
        .boot .bio-line { font-size: 11px; color: var(--fg); display: flex; gap: 8px; }
        .boot .bio-line span { display: inline-block; width: 52px; font-size: 9px; letter-spacing: 0.12em; color: var(--muted); }

        .boot .map-mod { right: 218px; top: 138px; width: 200px; opacity: 0.85; }
        .boot .worldmap { width: 200px; height: 110px; } .boot .wm-grid { stroke: var(--accent); stroke-width: 0.5; opacity: 0.16; } .boot .wm-dot { fill: var(--accent); opacity: 0.7; }

        .boot .cpu-mod { right: 64px; top: 322px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .boot .cpu-dial { width: 48px; height: 48px; } .boot .cd-ring { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 1 1.5; } .boot .cd-in { fill: none; stroke: var(--accent); stroke-width: 1; opacity: 0.5; }
        .boot .cpu-dial circle:not([class]) { fill: var(--accent); }

        .boot .net-mod { right: 60px; bottom: 104px; width: 230px; }
        .boot .net-row { font-size: 11px; color: var(--fg); display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 6px; }
        .boot .net-ar { color: var(--accent); font-size: 9px; } .boot .net-ar.dn { color: var(--mag); }
        .boot .net-bar { width: 60px; height: 4px; border: 0.5px solid var(--line); border-radius: 2px; overflow: hidden; } .boot .net-bar b { display: block; height: 100%; background: var(--accent); }
        .boot .net-addr { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
        .boot .net-addr div { font-size: 9.5px; color: var(--muted); display: flex; justify-content: flex-end; gap: 8px; } .boot .net-addr span { color: var(--muted-2); letter-spacing: 0.12em; }

        .boot .bl-mod { left: 54px; bottom: 84px; }
        .boot .bl-prog { font-size: 10px; letter-spacing: 0.14em; color: var(--muted); } .boot .bl-prog b { color: var(--accent); }
        .boot .bl-icons { display: flex; gap: 10px; margin-top: 10px; }
        .boot .bl-ic { width: 24px; height: 24px; } .boot .bl-ic circle { fill: none; stroke: var(--accent); stroke-width: 1.2; } .boot .bl-ic circle:last-child { fill: var(--accent); }

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
