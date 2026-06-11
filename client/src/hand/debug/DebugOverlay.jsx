import { useEffect, useRef, useState } from "react";
import { useHandPipeline } from "../HandPipelineProvider";
import { TUNE, TUNE_SPEC } from "../config";

// ?debug=hand panel. M1: raw-vs-filtered cursor trails, live pinch ratio +
// FSM phase, and sliders that mutate TUNE in place (controllers read TUNE
// per-frame, so changes apply instantly). "log TUNE" dumps the current
// values so a good tuning session can be baked back into config.js.

const TRAIL_W = 220;
const TRAIL_H = 130;

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => o?.[k], obj);
  if (target) target[last] = value;
}

export function DebugOverlay() {
  const { debug } = useHandPipeline();
  const canvasRef = useRef(null);
  const ratioRef = useRef(null);
  const [, bump] = useState(0); // refresh slider value labels only

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;
    let last = 0;

    const polyline = (trail, kx, ky, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const x = (trail[i][kx] / window.innerWidth) * TRAIL_W;
        const y = (trail[i][ky] / window.innerHeight) * TRAIL_H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 66) return; // ~15Hz
      last = t;

      ctx.clearRect(0, 0, TRAIL_W, TRAIL_H);
      const cursor = window.__handDebug?.cursor;
      if (!cursor) return;

      const styles = getComputedStyle(document.documentElement);
      const trail = cursor.getTrail();
      if (trail.length >= 2) {
        polyline(trail, "rawX", "rawY", styles.getPropertyValue("--muted-2").trim() || "#666");
        polyline(trail, "x", "y", styles.getPropertyValue("--accent").trim() || "#4FDFFF");
      }

      const st = cursor.getState();
      if (ratioRef.current) {
        ratioRef.current.textContent =
          `pinch ${st.pinch.ratio.toFixed(2)} (in<${TUNE.pinch.enter} out>${TUNE.pinch.exit}) · ${st.pinch.phase}`;
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hand-debug">
      <b>HAND · DEBUG</b>
      <div>status: {debug.status}</div>
      <div>error: {debug.error?.message ?? "—"}</div>
      <div>fps: {debug.fps.toFixed(1)} · inference: {debug.inferenceMs.toFixed(1)}ms</div>
      <div>hands: {debug.handsCount} · {debug.handednesses.join(" · ") || "—"}</div>
      <div>arb: CURSOR (M1 — single-state)</div>
      <div ref={ratioRef}>pinch — · IDLE</div>
      <canvas ref={canvasRef} className="hd-trail" width={TRAIL_W} height={TRAIL_H} />
      <div className="hd-sliders">
        {TUNE_SPEC.map(([path, label, min, max, step]) => (
          <label key={path}>
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={getPath(TUNE, path)}
              onChange={(e) => {
                setPath(TUNE, path, Number(e.target.value));
                bump((v) => v + 1);
              }}
            />
            <i>{getPath(TUNE, path)}</i>
          </label>
        ))}
      </div>
      <button className="hd-log" onClick={() => console.log("TUNE", JSON.stringify(TUNE, null, 2))}>
        log TUNE
      </button>
    </div>
  );
}
