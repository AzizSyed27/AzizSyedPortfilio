import { useEffect, useState } from "react";

export function HudReticle() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="hud-overlay on" aria-hidden="true">
      <div className="hud-corner hud-tl" />
      <div className="hud-corner hud-tr" />
      <div className="hud-corner hud-bl" />
      <div className="hud-corner hud-br" />
      <div className="hud-readout">
        <b>HAND CTRL · LIVE (mouse fallback)</b><br />
        gesture: open palm<br />
        confidence: 94%<br />
        x:{pos.x.toFixed(3)} y:{pos.y.toFixed(3)}
      </div>
    </div>
  );
}
