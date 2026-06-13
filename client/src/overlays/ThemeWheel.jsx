// Theme dial (M4) — pure-presentational modal radial picker. It renders the
// wheel and reads arb.context.dialIndex each frame to spin the rotor + grow
// the active swatch + update the readout. It has NO theme side effects:
// preview/commit/cancel are intent calls made by the gesture handler
// (HandGestures). Ported from the "Hand Mode Theme Dial" design mockup.

import { useEffect, useRef } from "react";
import { useHandPipeline } from "../hand/HandPipelineProvider";
import { useActions } from "../intents/actions";
import { useMode } from "../mode/ModeProvider";
import { THEME_ORDER, THEME_META } from "../theme/ThemeProvider";

const R = 168; // swatch orbit radius (matches the mockup)
const N = THEME_ORDER.length;
const STEP = 360 / N;
const SLOTS = THEME_ORDER.map((id, i) => {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2; // slot 0 at 12 o'clock
  return { id, meta: THEME_META[id], x: Math.cos(a) * R, y: Math.sin(a) * R };
});

export function ThemeWheel() {
  const { arbitrator } = useHandPipeline();
  const actions = useActions();
  const { handState } = useMode();

  const rotorRef = useRef(null);
  const swatchRefs = useRef([]);
  const nameRef = useRef(null);
  const hexRef = useRef(null);
  const idxRef = useRef(null);

  // If hand mode exits while the dial is open, close it. ThemeModeSync has
  // already restored the base theme visually on the handState change, and the
  // provider resets the arbitrator — so this just clears the React render
  // flag. (External Esc-cancel is handled frame-driven in HandGestures via
  // arb.context.requestDialClose, not here — an unmount cleanup would fire on
  // StrictMode's mount→unmount→remount and cancel the dial as it opens.)
  useEffect(() => {
    if (handState !== "live") actions.closeThemeDial();
  }, [handState, actions]);

  // Spin the rotor / grow the active swatch / update readout from dialIndex.
  // Refs + transforms only — no React re-render on the hot path.
  useEffect(() => {
    let raf;
    let last = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const idx = arbitrator.context.dialIndex ?? 0;
      if (idx === last) return;
      last = idx;
      if (rotorRef.current) rotorRef.current.style.transform = `rotate(${-idx * STEP}deg)`;
      swatchRefs.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle("active", i === idx);
        // Counter-rotate so the swatch stays upright as the rotor spins.
        el.style.transform = `translate(${SLOTS[i].x}px, ${SLOTS[i].y}px) rotate(${idx * STEP}deg)`;
      });
      const meta = SLOTS[idx].meta;
      if (nameRef.current) nameRef.current.textContent = meta.label;
      if (hexRef.current) hexRef.current.textContent = `${meta.bg} · ${meta.accent}`;
      if (idxRef.current) {
        idxRef.current.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [arbitrator]);

  return (
    <div className="theme-dial-overlay" aria-hidden="true">
      <div className="td-scrim" />
      <div className="td-modal">
        <div className="td-title">SELECT · <b>THEME</b></div>
        <div className="dial-wrap">
          <div className="notch"><div className="tri" /><div className="lab">active</div></div>
          <div className="dial-rings">
            <svg viewBox="0 0 420 420">
              <circle cx="210" cy="210" r="168" className="ring-dash" />
              <circle cx="210" cy="210" r="196" className="ring" />
              <circle cx="210" cy="210" r="120" className="ring" />
              {SLOTS.map((s, i) => {
                const a = (i / N) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line
                    key={s.id}
                    x1={210 + Math.cos(a) * 188}
                    y1={210 + Math.sin(a) * 188}
                    x2={210 + Math.cos(a) * 200}
                    y2={210 + Math.sin(a) * 200}
                    className="tick"
                  />
                );
              })}
            </svg>
          </div>
          <div className="dial-rotor" ref={rotorRef}>
            {SLOTS.map((s, i) => (
              <div
                key={s.id}
                ref={(el) => { swatchRefs.current[i] = el; }}
                className="swatch"
                style={{
                  transform: `translate(${s.x}px, ${s.y}px)`,
                  background: `linear-gradient(135deg, ${s.meta.bg} 0 50%, ${s.meta.accent} 50% 100%)`,
                }}
              />
            ))}
          </div>
          <div className="hub">
            <div className="ring2" />
            <div className="htxt">Theme</div>
            <div className="hsub">{N} palettes</div>
          </div>
        </div>
        <div className="active-name" ref={nameRef}>—</div>
        <div className="active-hex" ref={hexRef}>—</div>
        <div className="active-idx" ref={idxRef}>—</div>
        <div className="td-hint">
          <b>turn hand like a wheel</b> · <b>pinch</b> apply · <b>flick</b> cancel
        </div>
      </div>
    </div>
  );
}
