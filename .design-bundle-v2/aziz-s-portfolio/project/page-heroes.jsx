// page-heroes.jsx — split-hero header bands + live companions for
// Services (radar), Work (split-flap board), Contact (beacon).
// All motion is rAF/timer-driven (CSS animations strand in this runtime).

(function () {
  const { useState, useEffect, useRef, useLayoutEffect } = React;

  // ── Shared: two-column header band with rAF reveal + cursor parallax ──
  function HeroBand({ children, right }) {
    const ref = useRef(null);

    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const items = Array.from(el.querySelectorAll(".rv"));
      const clear = () => items.forEach((it) => { it.style.opacity = ""; it.style.transform = ""; it.style.willChange = ""; });
      if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const isR = (it) => it.classList.contains("hero-band-rinner");
      items.forEach((it) => {
        it.style.opacity = "0";
        it.style.transform = isR(it) ? "translateY(22px) scale(0.97)" : "translateY(16px)";
        it.style.willChange = "opacity, transform";
      });
      const DUR = 700, start = performance.now(), ease = (t) => 1 - Math.pow(1 - t, 3);
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
      if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let raf, tx = 0, ty = 0, cx = 0, cy = 0;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      };
      const loop = () => {
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
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

  // ── Services: capability radar ──
  const CAP_BLIPS = [
    { n: "Full-stack", a: 24, r: 0.64 },
    { n: "AI agents", a: 92, r: 0.82 },
    { n: "Computer vision", a: 150, r: 0.52 },
    { n: "Cloud / DevOps", a: 208, r: 0.74 },
    { n: "Geospatial", a: 272, r: 0.6 },
    { n: "3D / real-time", a: 330, r: 0.86 },
  ];
  function CapabilityRadar() {
    const sweepRef = useRef(null);
    const [active, setActive] = useState(0);
    const [hover, setHover] = useState(null);
    const activeRef = useRef(0), hoverRef = useRef(null);
    useEffect(() => { hoverRef.current = hover; }, [hover]);

    useEffect(() => {
      let raf; const period = 7000;
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
          <span>CAPABILITY · RADAR</span><span className="dim">sweep · live</span>
        </div>
        <div className="cap-radar-stage">
          <div className="cr-rings" />
          <div className="cr-sweep" ref={sweepRef} />
          {CAP_BLIPS.map((b, i) => (
            <button
              key={b.n} className="cr-blip" data-on={i === shown ? "1" : "0"}
              style={pos(b)} data-cursor="hover"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
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

  // ── Work: split-flap project board ──
  const BOARD = [
    { code: "P/01", name: "Projects by the Projects", stack: "Spring Boot · React", year: "25", status: "LIVE" },
    { code: "P/02", name: "MyE46", stack: "R3F · Gemini", year: "25", status: "LIVE" },
    { code: "P/03", name: "ASL Hand Coach", stack: "MediaPipe · CNN", year: "24", status: "LIVE" },
    { code: "P/04", name: "HiddenHooks", stack: "PostGIS · FastAPI", year: "24", status: "LIVE" },
    { code: "P/05", name: "GymNet", stack: "Spring Boot · React", year: "24", status: "SHIPPED" },
    { code: "P/06", name: "DineSmart", stack: "Angular · GraphQL", year: "23", status: "SHIPPED" },
    { code: "P/07", name: "MovieShare", stack: ".NET · AWS", year: "23", status: "SHIPPED" },
    { code: "P/08", name: "CommConnect", stack: "Next.js · RAG", year: "24", status: "SHIPPED" },
  ];
  const ROWS = 5;
  function ProjectFlipBoard() {
    const [offset, setOffset] = useState(0);
    const rowRefs = useRef([]);
    const hoverRef = useRef(false);

    useEffect(() => {
      const id = setInterval(() => { if (!hoverRef.current) setOffset((o) => (o + 1) % BOARD.length); }, 2400);
      return () => clearInterval(id);
    }, []);

    useEffect(() => {
      rowRefs.current.filter(Boolean).forEach((el, i) => {
        el.style.transformOrigin = "top";
        const start = performance.now() + i * 70, dur = 280;
        const step = (now) => {
          const p = Math.max(0, Math.min(1, (now - start) / dur));
          const e = 1 - Math.pow(1 - p, 3);
          el.style.opacity = String(e);
          el.style.transform = `scaleY(${(0.15 + 0.85 * e).toFixed(3)})`;
          if (p < 1) requestAnimationFrame(step);
          else { el.style.opacity = ""; el.style.transform = ""; el.style.transformOrigin = ""; }
        };
        requestAnimationFrame(step);
      });
    }, [offset]);

    const rows = Array.from({ length: ROWS }, (_, i) => BOARD[(offset + i) % BOARD.length]);
    return (
      <div className="flip-board"
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}>
        <div className="fb-head">
          <span>PROJECT INDEX</span>
          <span className="fb-live"><i />LIVE · {BOARD.length} BUILDS</span>
        </div>
        <div className="fb-cols">
          <span>CODE</span><span>PROJECT</span><span>STACK</span><span>YR</span><span>STATUS</span>
        </div>
        <div className="fb-rows">
          {rows.map((r, i) => (
            <div className="fb-row" key={i} ref={(el) => (rowRefs.current[i] = el)}>
              <span className="fb-code">{r.code}</span>
              <span className="fb-name">{r.name}</span>
              <span className="fb-stack">{r.stack}</span>
              <span className="fb-year">'{r.year}</span>
              <span className={`fb-status s-${r.status}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Contact: signal beacon with live local clock ──
  function fmtTO() {
    try { return new Date().toLocaleTimeString("en-CA", { timeZone: "America/Toronto", hour12: false }); }
    catch (e) { return new Date().toLocaleTimeString(); }
  }
  function ContactBeacon() {
    const ringRefs = useRef([]);
    const [clock, setClock] = useState(fmtTO());
    useEffect(() => { const id = setInterval(() => setClock(fmtTO()), 1000); return () => clearInterval(id); }, []);
    useEffect(() => {
      let raf; const period = 2800;
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

  Object.assign(window, { HeroBand, CapabilityRadar, ProjectFlipBoard, ContactBeacon });
})();
