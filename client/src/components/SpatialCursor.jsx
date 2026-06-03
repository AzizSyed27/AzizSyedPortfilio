import { useEffect, useRef, useState } from "react";

export function SpatialCursor({ mode = "dot" }) {
  const dotRef = useRef(null);
  const trailRefs = useRef([]);
  const [hover, setHover] = useState(false);
  const posRef = useRef({ x: -100, y: -100 });
  const trailPosRef = useRef([]);
  const TRAIL_COUNT = 12;

  useEffect(() => {
    if (mode === "off") return undefined;
    if (typeof matchMedia !== "undefined" && matchMedia("(hover: none), (max-width: 720px)").matches) return undefined;

    trailPosRef.current = Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 }));

    let raf;
    const tick = () => {
      const { x, y } = posRef.current;
      if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
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
      const isInteractive = target && target.closest?.("a, button, input, textarea, [data-cursor='hover']");
      setHover(!!isInteractive);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  if (mode === "off") return null;
  if (typeof matchMedia !== "undefined" && matchMedia("(hover: none), (max-width: 720px)").matches) return null;

  return (
    <>
      <div ref={dotRef} className="spatial-cursor" data-hover={hover ? "1" : "0"} />
      {mode === "trail" && Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div key={i} ref={(el) => (trailRefs.current[i] = el)} className="cursor-trail" />
      ))}
    </>
  );
}
