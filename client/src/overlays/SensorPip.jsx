import { useEffect, useRef } from "react";
import { useHandPipeline } from "../hand/HandPipelineProvider";
import { HAND_CONNECTIONS } from "../hand/config";

// SENSOR · LIVE diagnostic panel (design: "Hand Mode Sensor PIP"). Privacy-
// first: only the landmark skeleton is drawn on a themed canvas — the raw
// camera feed is never rendered anywhere. Drawing happens per inference frame
// via the pipeline's frame-renderer registration, outside React; the readout
// row below it is ordinary React state throttled by the provider.
export function SensorPip() {
  const { subscribeFrame, debug, arbitrator } = useHandPipeline();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const draw = (results) => {
      ctx.clearRect(0, 0, w, h);

      // Re-read per frame (≤30fps, negligible) so theme switches recolor the
      // skeleton with no observer plumbing.
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue("--accent").trim();
      const accentBright = styles.getPropertyValue("--accent-bright").trim() || accent;

      for (const lm of results.landmarks ?? []) {
        // Bones — mirrored X so the wireframe moves like a mirror
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.moveTo((1 - lm[a].x) * w, lm[a].y * h);
          ctx.lineTo((1 - lm[b].x) * w, lm[b].y * h);
        }
        ctx.stroke();

        // Joints — wrist slightly larger, per the design skeleton
        ctx.globalAlpha = 1;
        ctx.fillStyle = accentBright;
        for (let i = 0; i < lm.length; i++) {
          ctx.beginPath();
          ctx.arc((1 - lm[i].x) * w, lm[i].y * h, i === 0 ? 2.4 : 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    return subscribeFrame(draw);
  }, [subscribeFrame]);

  const tracking = debug.status === "running";
  const hasHand = debug.handsCount > 0;
  const track = !tracking ? "init" : hasHand ? "lock" : "scan";

  // Live gesture label from the arbitrator (mutable shared object — safe to
  // read at render time; this component already re-renders at the debug
  // snapshot's 5Hz throttle).
  const gestureLabel =
    arbitrator.state === "DIAL" ? "▸ theme dial"
    : arbitrator.state === "TWO_HAND"
      ? (arbitrator.context.twoHandMode === "PULL" ? "▸ pull apart" : "▸ two hands · spatial")
    : arbitrator.state === "SCROLL" ? "▸ fist · scroll"
    : arbitrator.state === "PINCH_ACTIVE" ? "▸ pinch"
    : arbitrator.state === "SWIPE_COOLDOWN" ? "▸ swipe"
    : arbitrator.context.pose === "OPEN_PALM"
      ? (arbitrator.context.swipeArmed ? "▸ open palm · armed" : "▸ open palm")
    : hasHand ? "▸ tracking"
    : "▸ no hand";

  return (
    <div className="pip" aria-hidden="true">
      <div className="pip-head">
        <span className="pip-title"><span className="rec" /> SENSOR · <b>LIVE</b></span>
        <span className="pip-cam">CAM 01</span>
      </div>
      <div className="pip-video">
        <div className="scan" />
        <canvas ref={canvasRef} className="pip-canvas" />
        <span className="vc a" /><span className="vc b" /><span className="vc c" /><span className="vc d" />
        <span className="pip-gesture">{gestureLabel}</span>
      </div>
      <div className="pip-readout">
        <div className="ro"><span className="k">fps</span><span className="v">{Math.round(debug.fps)}</span></div>
        <div className="ro"><span className="k">landmarks</span><span className="v">{debug.handsCount * 21}</span></div>
        <div className="ro"><span className="k">latency</span><span className="v">{Math.round(debug.inferenceMs)}ms</span></div>
        <div className="ro"><span className="k">track</span><span className={track === "lock" ? "v grn" : "v"}>{track}</span></div>
      </div>
    </div>
  );
}
