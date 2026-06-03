import { useEffect, useLayoutEffect, useRef } from "react";

export function HeroBand({ children, right }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(el.querySelectorAll(".rv"));
    const clear = () => items.forEach((it) => {
      it.style.opacity = "";
      it.style.transform = "";
      it.style.willChange = "";
    });
    const isR = (it) => it.classList.contains("hero-band-rinner");
    items.forEach((it) => {
      it.style.opacity = "0";
      it.style.transform = isR(it) ? "translateY(22px) scale(0.97)" : "translateY(16px)";
      it.style.willChange = "opacity, transform";
    });
    const DUR = 700;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let raf;
    const loop = (now) => {
      let done = true;
      for (const it of items) {
        const d = (parseFloat(it.dataset.d) || 0) * 1000;
        const p = Math.max(0, Math.min(1, (now - start - d) / DUR));
        if (p < 1) done = false;
        const e = ease(p);
        it.style.opacity = String(e);
        it.style.transform = isR(it)
          ? `translateY(${(22 * (1 - e)).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(3)})`
          : `translateY(${(16 * (1 - e)).toFixed(2)}px)`;
      }
      if (done) clear(); else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const fb = setTimeout(clear, 2200);
    return () => { cancelAnimationFrame(raf); clearTimeout(fb); clear(); };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="hero-band" ref={ref}>
      <div className="hero-band-text">{children}</div>
      <div className="hero-band-right">
        <div className="hero-band-rinner rv" data-d="0.3">{right}</div>
      </div>
    </div>
  );
}
