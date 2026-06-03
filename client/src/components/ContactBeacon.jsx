import { useEffect, useRef, useState } from "react";

function fmtTO() {
  try {
    return new Date().toLocaleTimeString("en-CA", { timeZone: "America/Toronto", hour12: false });
  } catch {
    return new Date().toLocaleTimeString();
  }
}

export function ContactBeacon() {
  const ringRefs = useRef([]);
  const [clock, setClock] = useState(fmtTO());

  useEffect(() => {
    const id = setInterval(() => setClock(fmtTO()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf;
    const period = 2800;
    const loop = (now) => {
      ringRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = (((now + i * period / 3) % period) / period);
        el.style.transform = `translate(-50%, -50%) scale(${(0.2 + t * 1.05).toFixed(3)})`;
        el.style.opacity = String(((1 - t) * 0.5).toFixed(3));
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="beacon">
      <div className="beacon-head"><span>SIGNAL · OPEN CHANNEL</span><span className="dim">cam · 01</span></div>
      <div className="beacon-stage">
        <span className="bk-ring" ref={(el) => (ringRefs.current[0] = el)} />
        <span className="bk-ring" ref={(el) => (ringRefs.current[1] = el)} />
        <span className="bk-ring" ref={(el) => (ringRefs.current[2] = el)} />
        <span className="bk-core"><span className="bk-core-dot" /></span>
        <span className="bk-cross v" /><span className="bk-cross h" />
      </div>
      <div className="beacon-readout">
        <div className="br-row"><span className="k">Location</span><span className="v">Scarborough, ON</span></div>
        <div className="br-row"><span className="k">Local time</span><span className="v mono-accent">{clock} · EST</span></div>
        <div className="br-row"><span className="k">Reply</span><span className="v">usually within a day</span></div>
        <div className="br-row"><span className="k">Signal</span><span className="v status">● READY</span></div>
      </div>
    </div>
  );
}
