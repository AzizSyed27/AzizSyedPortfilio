// stack-constellation.jsx — floating, grabbable tech constellation for Services /tools
// Physics layer (drift, cursor-repel, grab-drag-throw, category gravity) driven by an
// abstract { pointer, grabbing } input so hand mode can feed it later. Mouse drives it now.

(function () {
  const { useState, useRef, useEffect } = React;

  // ── tech → projects (inverted from real project data) ────────────
  // c = category: lang | fw | cloud | concept
  const TECH = [
    { n: "TypeScript", c: "lang", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Tru North Couriers", "EWCC"] },
    { n: "JavaScript", c: "lang", p: ["Projects by the Projects", "DineSmart", "Portfolio"] },
    { n: "Python", c: "lang", p: ["HiddenHooks", "InternHub", "Homebound", "EWCC", "DineSmart", "Portfolio"] },
    { n: "Java", c: "lang", p: ["GymNet", "Projects by the Projects", "DineSmart"] },
    { n: "C#", c: "lang", p: ["MovieShare"] },
    { n: "SQL", c: "lang", p: ["Tru North Couriers"] },
    { n: "Bash", c: "lang", p: ["InternHub"] },

    { n: "React", c: "fw", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Projects by the Projects", "Tru North Couriers", "Portfolio"] },
    { n: "Next.js", c: "fw", p: ["HiddenHooks", "Tru North Couriers"] },
    { n: "Angular", c: "fw", p: ["EWCC", "DineSmart"] },
    { n: "Node.js", c: "fw", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Projects by the Projects", "Portfolio"] },
    { n: "Express", c: "fw", p: ["MyE46"] },
    { n: "Spring Boot", c: "fw", p: ["GymNet", "Projects by the Projects", "DineSmart"] },
    { n: "Flask", c: "fw", p: ["Homebound"] },
    { n: "FastAPI", c: "fw", p: ["HiddenHooks", "Homebound", "DineSmart"] },
    { n: "Django", c: "fw", p: ["EWCC"] },
    { n: ".NET", c: "fw", p: ["MovieShare"] },
    { n: "Three.js / R3F", c: "fw", p: ["MyE46", "Tru North Couriers"] },
    { n: "MediaPipe", c: "fw", p: ["ASL Hand Coach", "Portfolio"] },
    { n: "scikit-learn / XGBoost", c: "fw", p: ["Homebound"] },
    { n: "SwiftUI", c: "fw", p: ["MorseBridge"] },

    { n: "PostgreSQL", c: "cloud", p: ["HiddenHooks", "GymNet"] },
    { n: "PostGIS", c: "cloud", p: ["HiddenHooks"] },
    { n: "MongoDB", c: "cloud", p: ["EWCC", "DineSmart"] },
    { n: "Docker", c: "cloud", p: ["HiddenHooks", "GymNet", "Projects by the Projects"] },
    { n: "AWS", c: "cloud", p: ["Projects by the Projects", "MovieShare"] },
    { n: "Azure", c: "cloud", p: ["Homebound", "Tru North Couriers"] },
    { n: "Cloudflare", c: "cloud", p: ["Projects by the Projects"] },
    { n: "CI/CD", c: "cloud", p: ["HiddenHooks", "Projects by the Projects", "EWCC", "MovieShare"] },
    { n: "Git", c: "cloud", p: ["MyE46", "DineSmart"] },
    { n: "Jira", c: "cloud", p: ["Tru North Couriers"] },
    { n: "Linux/Unix", c: "cloud", p: ["InternHub"] },
    { n: "Stripe", c: "cloud", p: ["Projects by the Projects"] },

    { n: "AI agents", c: "concept", p: ["MyE46", "HiddenHooks", "Portfolio"] },
    { n: "Machine Learning", c: "concept", p: ["HiddenHooks", "ASL Hand Coach", "Homebound", "Portfolio"] },
    { n: "Computer Vision", c: "concept", p: ["ASL Hand Coach", "Portfolio"] },
    { n: "REST API", c: "concept", p: ["GymNet", "Projects by the Projects", "Tru North Couriers", "EWCC", "DineSmart"] },
    { n: "Microservices", c: "concept", p: ["Tru North Couriers"] },
    { n: "Concurrency", c: "concept", p: ["MyE46", "Projects by the Projects"] },
    { n: "OAuth2", c: "concept", p: ["Projects by the Projects"] },
    { n: "JWT Auth", c: "concept", p: ["DineSmart"] },
    { n: "Kerberos Auth", c: "concept", p: ["MovieShare"] },
  ];

  const CATS = {
    lang:    { label: "Languages",   anchor: { x: 0.23, y: 0.30 } },
    fw:      { label: "Frameworks",  anchor: { x: 0.73, y: 0.28 } },
    cloud:   { label: "Cloud / Data", anchor: { x: 0.26, y: 0.74 } },
    concept: { label: "Concepts",    anchor: { x: 0.73, y: 0.72 } },
  };
  const CAT_ORDER = ["lang", "fw", "cloud", "concept"];

  const MAXP = Math.max(...TECH.map(t => t.p.length)); // 7 (React)
  const byName = {};
  TECH.forEach(t => { byName[t.n] = t; });

  // co-occurrence: techs that share ≥1 project, with shared count
  const LINKS = {};
  TECH.forEach(a => {
    const set = a.p;
    LINKS[a.n] = TECH
      .filter(b => b.n !== a.n && b.p.some(pr => set.includes(pr)))
      .map(b => ({ n: b.n, w: b.p.filter(pr => set.includes(pr)).length }))
      .sort((x, y) => y.w - x.w);
  });

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  const rnd = (s) => { const x = Math.sin(hash(s)) * 10000; return x - Math.floor(x); };

  function fontFor(t) { return 12 + 17 * ((t.p.length - 1) / (MAXP - 1)); }
  function opacityFor(t) { return 0.5 + 0.45 * ((t.p.length - 1) / (MAXP - 1)); }

  // ── Component ────────────────────────────────────────────────────
  function StackConstellation() {
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = typeof matchMedia !== "undefined" && matchMedia("(max-width: 760px)").matches;
    const [view, setView] = useState(reduced || small ? "grid" : "cloud");
    const [active, setActive] = useState(null);

    const fieldRef = useRef(null);
    const nodeRefs = useRef({});
    const svgRef = useRef(null);
    const S = useRef({
      bodies: [], W: 0, H: 0,
      pointer: { x: -999, y: -999, vx: 0, vy: 0, svx: 0, svy: 0, inside: false },
      grabbed: null, grabDX: 0, grabDY: 0, targetX: 0, targetY: 0,
      active: null, lineEls: [],
    });

    // keep active in ref for the rAF loop
    useEffect(() => { S.current.active = active; }, [active]);

    useEffect(() => {
      if (view !== "cloud") return;
      const field = fieldRef.current;
      const svg = svgRef.current;
      let raf;

      function measure() {
        const r = field.getBoundingClientRect();
        S.current.W = r.width; S.current.H = r.height;
      }

      function homeFor(t) {
        const a = CATS[t.c].anchor;
        const W = S.current.W, H = S.current.H;
        const spread = Math.min(W, H) * 0.2;
        const ang = rnd(t.n) * Math.PI * 2;
        const rad = (0.35 + rnd(t.n + "r") * 0.65) * spread;
        return { x: a.x * W + Math.cos(ang) * rad, y: a.y * H + Math.sin(ang) * rad };
      }

      measure();
      const bodies = TECH.map(t => {
        const h = homeFor(t);
        return {
          name: t.n, t, x: h.x, y: h.y, vx: 0, vy: 0, homeX: h.x, homeY: h.y, hw: 30, hh: 12,
          // organic per-word drift params (smooth, continuous, desynchronized)
          f1: 0.10 + rnd(t.n + "f1") * 0.13, f2: 0.06 + rnd(t.n + "f2") * 0.10,
          f3: 0.09 + rnd(t.n + "f3") * 0.12, f4: 0.05 + rnd(t.n + "f4") * 0.09,
          ph1: rnd(t.n + "p1") * 6.28, ph2: rnd(t.n + "p2") * 6.28,
          ph3: rnd(t.n + "p3") * 6.28, ph4: rnd(t.n + "p4") * 6.28,
          amp: 24 + rnd(t.n + "a") * 38, throwT: 0,
        };
      });
      bodies.forEach(b => {
        const el = nodeRefs.current[b.name];
        if (el) { b.hw = el.offsetWidth / 2; b.hh = el.offsetHeight / 2; }
      });
      S.current.bodies = bodies;

      const ro = new ResizeObserver(() => {
        measure();
        S.current.bodies.forEach(b => { const h = homeFor(b.t); b.homeX = h.x; b.homeY = h.y; });
      });
      ro.observe(field);

      const R = 120; // (unused) legacy radius
      function tick() {
        const st = S.current;
        const { bodies, W, H } = st;
        const time = performance.now() / 1000;
        for (const b of bodies) {
          if (b.name === st.grabbed) {
            // follow cursor and record the word's real velocity for the throw
            const nx = b.x + (st.targetX - b.x) * 0.5;
            const ny = b.y + (st.targetY - b.y) * 0.5;
            b.vx = nx - b.x; b.vy = ny - b.y;
            b.x = nx; b.y = ny;
          } else if (b.throwT > 0) {
            // free-flight throw phase: lively, springy wall bounces that ride for a
            // while, then hand off to a gentle glide home
            b.throwT--;
            b.vx *= 0.992; b.vy *= 0.992;
            b.x += b.vx; b.y += b.vy;
            if (b.x < b.hw) { b.x = b.hw; b.vx *= -0.86; }
            if (b.x > W - b.hw) { b.x = W - b.hw; b.vx *= -0.86; }
            if (b.y < b.hh) { b.y = b.hh; b.vy *= -0.86; }
            if (b.y > H - b.hh) { b.y = H - b.hh; b.vy *= -0.86; }
          } else {
            // smooth, continuous drift target around home (layered sines, per-word phase)
            const dx = Math.sin(time * b.f1 + b.ph1) * b.amp + Math.sin(time * b.f2 + b.ph2) * b.amp * 0.5;
            const dy = Math.cos(time * b.f3 + b.ph3) * b.amp + Math.cos(time * b.f4 + b.ph4) * b.amp * 0.5;
            const tx = b.homeX + dx;
            const ty = b.homeY + dy;
            // ease velocity toward the drift target — fluid, never snappy.
            // cap the homing accel so a word returning from far (after a throw) glides home.
            let ax = (tx - b.x) * 0.02;
            let ay = (ty - b.y) * 0.02;
            ax = clamp(ax, -0.8, 0.8);
            ay = clamp(ay, -0.8, 0.8);
            b.vx = (b.vx + ax) * 0.90;
            b.vy = (b.vy + ay) * 0.90;
            b.x += b.vx; b.y += b.vy;
            if (b.x < b.hw) { b.x = b.hw; b.vx *= -0.5; }
            if (b.x > W - b.hw) { b.x = W - b.hw; b.vx *= -0.5; }
            if (b.y < b.hh) { b.y = b.hh; b.vy *= -0.5; }
            if (b.y > H - b.hh) { b.y = H - b.hh; b.vy *= -0.5; }
          }
        }
        // light collision separation (gentle — clouds may overlap a little)
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], b = bodies[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const minx = (a.hw + b.hw) * 0.88, miny = (a.hh + b.hh) * 1.2;
            if (Math.abs(dx) < minx && Math.abs(dy) < miny) {
              const ox = (minx - Math.abs(dx)) * (dx < 0 ? -1 : 1) * 0.012;
              const oy = (miny - Math.abs(dy)) * (dy < 0 ? -1 : 1) * 0.012;
              if (a.name !== st.grabbed) { a.x -= ox; a.y -= oy; }
              if (b.name !== st.grabbed) { b.x += ox; b.y += oy; }
            }
          }
        }
        // write transforms + state classes
        const act = st.active;
        const linkSet = act ? new Set(LINKS[act].map(l => l.n)) : null;
        for (const b of bodies) {
          const el = nodeRefs.current[b.name];
          if (!el) continue;
          el.style.transform = `translate(${(b.x - b.hw).toFixed(1)}px, ${(b.y - b.hh).toFixed(1)}px)`;
          const ds = !act ? "idle" : b.name === act ? "active" : linkSet.has(b.name) ? "linked" : "dim";
          if (el.dataset.state !== ds) el.dataset.state = ds;
        }
        // connection lines from active node
        drawLines(act, linkSet);
        raf = requestAnimationFrame(tick);
      }

      function drawLines(act, linkSet) {
        const st = S.current;
        if (!act) {
          if (st.lineEls.length) { st.lineEls.forEach(l => l.remove()); st.lineEls = []; }
          return;
        }
        const a = st.bodies.find(b => b.name === act);
        if (!a) return;
        const targets = LINKS[act].slice(0, 16);
        while (st.lineEls.length < targets.length) {
          const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
          ln.setAttribute("class", "const-line");
          svg.appendChild(ln); st.lineEls.push(ln);
        }
        while (st.lineEls.length > targets.length) st.lineEls.pop().remove();
        targets.forEach((tg, i) => {
          const b = st.bodies.find(x => x.name === tg.n);
          const ln = st.lineEls[i];
          if (!b) { ln.setAttribute("opacity", "0"); return; }
          ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y);
          ln.setAttribute("x2", b.x); ln.setAttribute("y2", b.y);
          ln.setAttribute("opacity", String(0.15 + 0.32 * (tg.w / MAXP)));
        });
      }

      raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); S.current.lineEls.forEach(l => l.remove()); S.current.lineEls = []; };
    }, [view]);

    // ── pointer handlers (the input seam hand mode will reuse) ──────
    useEffect(() => {
      if (view !== "cloud") return;
      const field = fieldRef.current;
      function toLocal(e) {
        const r = field.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
      }
      function onMove(e) {
        const p = toLocal(e); const st = S.current;
        st.pointer.vx = p.x - st.pointer.x; st.pointer.vy = p.y - st.pointer.y;
        st.pointer.svx = 0.45 * st.pointer.svx + 0.55 * st.pointer.vx;
        st.pointer.svy = 0.45 * st.pointer.svy + 0.55 * st.pointer.vy;
        st.pointer.x = p.x; st.pointer.y = p.y; st.pointer.inside = p.inside;
        if (st.grabbed) { st.targetX = p.x - st.grabDX; st.targetY = p.y - st.grabDY; }
      }
      function onUp() {
        const st = S.current;
        if (st.grabbed) {
          const b = st.bodies.find(x => x.name === st.grabbed);
          if (b) {
            // throw with the flick speed (smoothed pointer velocity), boosted —
            // fall back to the word's own drag velocity if that's larger
            const vx = Math.abs(st.pointer.svx) > Math.abs(b.vx) ? st.pointer.svx : b.vx;
            const vy = Math.abs(st.pointer.svy) > Math.abs(b.vy) ? st.pointer.svy : b.vy;
            b.vx = clamp(vx * 1.7, -72, 72);
            b.vy = clamp(vy * 1.7, -72, 72);
            const speed = Math.hypot(b.vx, b.vy);
            b.throwT = speed > 2 ? 240 : 0;
          }
          st.grabbed = null;
        }
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    }, [view]);

    function onWordDown(e, name) {
      e.preventDefault();
      const st = S.current;
      const b = st.bodies.find(x => x.name === name);
      if (!b) return;
      const r = fieldRef.current.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      st.grabbed = name; st.grabDX = x - b.x; st.grabDY = y - b.y;
      st.targetX = b.x; st.targetY = b.y;
      setActive(name);
    }
    function reset() {
      const st = S.current;
      st.bodies.forEach(b => {
        b.vx = (rnd(b.name + "k" + Date.now()) - 0.5) * 80;
        b.vy = (rnd(b.name + "j" + Date.now()) - 0.5) * 80;
        b.throwT = 90;
      });
    }

    const act = active ? byName[active] : null;

    return (
      <div className="const-wrap">
        <div className="const-bar">
          <div className="const-toggle" role="tablist">
            <button className={view === "cloud" ? "on" : ""} onClick={() => setView("cloud")} data-cursor="hover">◇ Cloud</button>
            <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} data-cursor="hover">▦ Grid</button>
          </div>
          {view === "cloud" && (
            <button className="const-reset" onClick={reset} data-cursor="hover">⟲ scatter</button>
          )}
        </div>

        {view === "cloud" ? (
          <div className="const-field" ref={fieldRef}
            onMouseLeave={() => { if (!S.current.grabbed) setActive(null); }}>
            <svg className="const-lines" ref={svgRef} />
            {CAT_ORDER.map(c => (
              <div key={c} className={`const-catlabel cat-${c}`}>{CATS[c].label}</div>
            ))}
            {TECH.map(t => (
              <button
                key={t.n}
                ref={el => (nodeRefs.current[t.n] = el)}
                className="const-word"
                data-state="idle"
                data-cursor="hover"
                style={{ fontSize: `${fontFor(t).toFixed(1)}px`, "--w-op": opacityFor(t).toFixed(2) }}
                onMouseDown={e => onWordDown(e, t.n)}
                onMouseEnter={() => { if (!S.current.grabbed) setActive(t.n); }}
              >
                {t.n}
              </button>
            ))}

            <div className={`const-readout ${act ? "on" : ""}`}>
              {act ? (
                <React.Fragment>
                  <div className="cr-head">
                    <span className="cr-name">{act.n}</span>
                    <span className="cr-cat">{CATS[act.c].label}</span>
                  </div>
                  <div className="cr-count">{act.p.length} project{act.p.length > 1 ? "s" : ""}</div>
                  <div className="cr-projects">{act.p.join("  ·  ")}</div>
                </React.Fragment>
              ) : (
                <div className="cr-hint">
                  <b>drag</b> to grab · <b>fling</b> to scatter · <b>hover</b> to trace links
                  <span className="cr-hand">↳ in hand mode: pinch to grab · fist to reset</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="const-grid">
            {CAT_ORDER.map(c => (
              <div key={c} className="const-gcat">
                <div className="const-gcat-h">
                  <span>{CATS[c].label}</span>
                  <span className="gcat-n">{TECH.filter(t => t.c === c).length}</span>
                </div>
                <div className="const-chips">
                  {TECH.filter(t => t.c === c).map(t => (
                    <span key={t.n} className="const-chip">
                      {t.n}<i>{t.p.length}</i>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  window.StackConstellation = StackConstellation;
})();
