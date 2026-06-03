import { useEffect, useRef, useState } from "react";

const CAP_BLIPS = [
  { n: "Full-stack",      a: 24,  r: 0.64 },
  { n: "AI agents",       a: 92,  r: 0.82 },
  { n: "Computer vision", a: 150, r: 0.52 },
  { n: "Cloud / DevOps",  a: 208, r: 0.74 },
  { n: "Geospatial",      a: 272, r: 0.60 },
  { n: "3D / real-time",  a: 330, r: 0.86 },
];

export function CapabilityRadar() {
  const sweepRef = useRef(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(null);
  const activeRef = useRef(0);
  const hoverRef = useRef(null);

  useEffect(() => { hoverRef.current = hover; }, [hover]);

  useEffect(() => {
    let raf;
    const period = 7000;
    const loop = (now) => {
      const ang = ((now % period) / period) * 360;
      if (sweepRef.current) sweepRef.current.style.transform = `rotate(${ang.toFixed(1)}deg)`;
      if (hoverRef.current == null) {
        let best = 0, bd = 999;
        CAP_BLIPS.forEach((b, i) => {
          const diff = Math.abs(((b.a - ang + 360) % 360 + 180) % 360 - 180);
          if (diff < bd) { bd = diff; best = i; }
        });
        if (best !== activeRef.current) { activeRef.current = best; setActive(best); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const shown = hover != null ? hover : active;
  const pos = (b) => {
    const rad = (b.a - 90) * Math.PI / 180;
    return { left: `${50 + Math.cos(rad) * b.r * 42}%`, top: `${50 + Math.sin(rad) * b.r * 42}%` };
  };

  return (
    <div className="cap-radar">
      <div className="cap-radar-head">
        <span>CAPABILITY · RADAR</span>
        <span className="dim">sweep · live</span>
      </div>
      <div className="cap-radar-stage">
        <div className="cr-rings" />
        <div className="cr-sweep" ref={sweepRef} />
        {CAP_BLIPS.map((b, i) => (
          <button
            key={b.n}
            className="cr-blip"
            data-on={i === shown ? "1" : "0"}
            style={pos(b)}
            data-cursor="hover"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="cr-dot" />
          </button>
        ))}
        <div className="cr-core" />
      </div>
      <div className="cap-radar-readout">
        <span className="crr-idx">{String(shown + 1).padStart(2, "0")} / 06</span>
        <span className="crr-name">{CAP_BLIPS[shown].n}</span>
      </div>
    </div>
  );
}
