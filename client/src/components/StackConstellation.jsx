// Floating, grabbable tech constellation for Services /tools.
// Physics layer (drift, grab-drag-throw, springy walls) driven by an
// abstract { pointer, grabbed } input so hand mode can feed it later.
// Mouse drives it now. CSS lives in src/theme/design.css (.const-* L2049+).

import { useEffect, useMemo, useRef, useState } from "react";
import { TECHS, CATEGORIES, CAT_ORDER } from "../content/stack";

const MAXP = Math.max(...TECHS.map((t) => t.p.length));
const BY_NAME = Object.fromEntries(TECHS.map((t) => [t.n, t]));

// Co-occurrence: techs that share ≥1 project, weighted by shared count.
const LINKS = Object.fromEntries(
  TECHS.map((a) => [
    a.n,
    TECHS
      .filter((b) => b.n !== a.n && b.p.some((pr) => a.p.includes(pr)))
      .map((b) => ({ n: b.n, w: b.p.filter((pr) => a.p.includes(pr)).length }))
      .sort((x, y) => y.w - x.w),
  ]),
);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
const rnd  = (s) => { const x = Math.sin(hash(s)) * 10000; return x - Math.floor(x); };

const fontFor    = (t) => 12 + 17 * ((t.p.length - 1) / (MAXP - 1));
const opacityFor = (t) => 0.5 + 0.45 * ((t.p.length - 1) / (MAXP - 1));

export function StackConstellation() {
  const initialView = useMemo(() => {
    if (typeof matchMedia === "undefined") return "cloud";
    return matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)").matches ? "grid" : "cloud";
  }, []);
  const [view, setView] = useState(initialView);
  const [active, setActive] = useState(null);

  const fieldRef = useRef(null);
  const nodeRefs = useRef({});
  const svgRef   = useRef(null);
  const S = useRef({
    bodies: [], W: 0, H: 0,
    pointer: { x: -999, y: -999, vx: 0, vy: 0, svx: 0, svy: 0, inside: false },
    grabbed: null, grabDX: 0, grabDY: 0, targetX: 0, targetY: 0,
    active: null, lineEls: [],
  });

  // Keep `active` mirrored on the ref so the rAF loop can read it without a closure.
  useEffect(() => { S.current.active = active; }, [active]);

  // ── physics loop ────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "cloud") return undefined;
    const field = fieldRef.current;
    const svg = svgRef.current;
    if (!field || !svg) return undefined;
    const sc = S.current; // stable ref captured for the cleanup
    let raf;

    const measure = () => {
      const r = field.getBoundingClientRect();
      S.current.W = r.width;
      S.current.H = r.height;
    };

    const homeFor = (t) => {
      const a = CATEGORIES[t.c].anchor;
      const W = S.current.W, H = S.current.H;
      const spread = Math.min(W, H) * 0.2;
      const ang = rnd(t.n) * Math.PI * 2;
      const rad = (0.35 + rnd(t.n + "r") * 0.65) * spread;
      return { x: a.x * W + Math.cos(ang) * rad, y: a.y * H + Math.sin(ang) * rad };
    };

    measure();
    const bodies = TECHS.map((t) => {
      const h = homeFor(t);
      return {
        name: t.n, t, x: h.x, y: h.y, vx: 0, vy: 0, homeX: h.x, homeY: h.y, hw: 30, hh: 12,
        f1: 0.10 + rnd(t.n + "f1") * 0.13, f2: 0.06 + rnd(t.n + "f2") * 0.10,
        f3: 0.09 + rnd(t.n + "f3") * 0.12, f4: 0.05 + rnd(t.n + "f4") * 0.09,
        ph1: rnd(t.n + "p1") * 6.28, ph2: rnd(t.n + "p2") * 6.28,
        ph3: rnd(t.n + "p3") * 6.28, ph4: rnd(t.n + "p4") * 6.28,
        amp: 24 + rnd(t.n + "a") * 38, throwT: 0,
      };
    });
    bodies.forEach((b) => {
      const el = nodeRefs.current[b.name];
      if (el) { b.hw = el.offsetWidth / 2; b.hh = el.offsetHeight / 2; }
    });
    S.current.bodies = bodies;

    const ro = new ResizeObserver(() => {
      measure();
      S.current.bodies.forEach((b) => { const h = homeFor(b.t); b.homeX = h.x; b.homeY = h.y; });
    });
    ro.observe(field);

    const tick = () => {
      const st = S.current;
      const { bodies: bs, W, H } = st;
      const time = performance.now() / 1000;

      for (const b of bs) {
        if (b.name === st.grabbed) {
          const nx = b.x + (st.targetX - b.x) * 0.5;
          const ny = b.y + (st.targetY - b.y) * 0.5;
          b.vx = nx - b.x; b.vy = ny - b.y;
          b.x = nx; b.y = ny;
        } else if (b.throwT > 0) {
          b.throwT--;
          b.vx *= 0.992; b.vy *= 0.992;
          b.x += b.vx; b.y += b.vy;
          if (b.x < b.hw) { b.x = b.hw; b.vx *= -0.86; }
          if (b.x > W - b.hw) { b.x = W - b.hw; b.vx *= -0.86; }
          if (b.y < b.hh) { b.y = b.hh; b.vy *= -0.86; }
          if (b.y > H - b.hh) { b.y = H - b.hh; b.vy *= -0.86; }
        } else {
          const dx = Math.sin(time * b.f1 + b.ph1) * b.amp + Math.sin(time * b.f2 + b.ph2) * b.amp * 0.5;
          const dy = Math.cos(time * b.f3 + b.ph3) * b.amp + Math.cos(time * b.f4 + b.ph4) * b.amp * 0.5;
          const tx = b.homeX + dx;
          const ty = b.homeY + dy;
          let ax = clamp((tx - b.x) * 0.02, -0.8, 0.8);
          let ay = clamp((ty - b.y) * 0.02, -0.8, 0.8);
          b.vx = (b.vx + ax) * 0.90;
          b.vy = (b.vy + ay) * 0.90;
          b.x += b.vx; b.y += b.vy;
          if (b.x < b.hw) { b.x = b.hw; b.vx *= -0.5; }
          if (b.x > W - b.hw) { b.x = W - b.hw; b.vx *= -0.5; }
          if (b.y < b.hh) { b.y = b.hh; b.vy *= -0.5; }
          if (b.y > H - b.hh) { b.y = H - b.hh; b.vy *= -0.5; }
        }
      }

      // Pairwise overlap separation — light push so clusters don't stack.
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const a = bs[i], b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const minx = (a.hw + b.hw) * 0.88;
          const miny = (a.hh + b.hh) * 1.2;
          if (Math.abs(dx) < minx && Math.abs(dy) < miny) {
            const ox = (minx - Math.abs(dx)) * (dx < 0 ? -1 : 1) * 0.012;
            const oy = (miny - Math.abs(dy)) * (dy < 0 ? -1 : 1) * 0.012;
            if (a.name !== st.grabbed) { a.x -= ox; a.y -= oy; }
            if (b.name !== st.grabbed) { b.x += ox; b.y += oy; }
          }
        }
      }

      // Write transforms + per-word data-state.
      const act = st.active;
      const linkSet = act ? new Set(LINKS[act].map((l) => l.n)) : null;
      for (const b of bs) {
        const el = nodeRefs.current[b.name];
        if (!el) continue;
        el.style.transform = `translate(${(b.x - b.hw).toFixed(1)}px, ${(b.y - b.hh).toFixed(1)}px)`;
        const ds = !act ? "idle" : b.name === act ? "active" : linkSet.has(b.name) ? "linked" : "dim";
        if (el.dataset.state !== ds) el.dataset.state = ds;
      }

      drawLines(act);
      raf = requestAnimationFrame(tick);
    };

    const drawLines = (act) => {
      const st = S.current;
      if (!act) {
        if (st.lineEls.length) { st.lineEls.forEach((l) => l.remove()); st.lineEls = []; }
        return;
      }
      const a = st.bodies.find((b) => b.name === act);
      if (!a) return;
      const targets = LINKS[act].slice(0, 16);
      while (st.lineEls.length < targets.length) {
        const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ln.setAttribute("class", "const-line");
        svg.appendChild(ln);
        st.lineEls.push(ln);
      }
      while (st.lineEls.length > targets.length) st.lineEls.pop().remove();
      targets.forEach((tg, i) => {
        const b = st.bodies.find((x) => x.name === tg.n);
        const ln = st.lineEls[i];
        if (!b) { ln.setAttribute("opacity", "0"); return; }
        ln.setAttribute("x1", a.x);
        ln.setAttribute("y1", a.y);
        ln.setAttribute("x2", b.x);
        ln.setAttribute("y2", b.y);
        ln.setAttribute("opacity", String(0.15 + 0.32 * (tg.w / MAXP)));
      });
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sc.lineEls.forEach((l) => l.remove());
      sc.lineEls = [];
    };
  }, [view]);

  // ── pointer input (the seam hand mode will replace) ───────────
  useEffect(() => {
    if (view !== "cloud") return undefined;
    const field = fieldRef.current;
    if (!field) return undefined;

    const toLocal = (e) => {
      const r = field.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
      };
    };

    const onMove = (e) => {
      const p = toLocal(e);
      const st = S.current;
      st.pointer.vx = p.x - st.pointer.x;
      st.pointer.vy = p.y - st.pointer.y;
      st.pointer.svx = 0.45 * st.pointer.svx + 0.55 * st.pointer.vx;
      st.pointer.svy = 0.45 * st.pointer.svy + 0.55 * st.pointer.vy;
      st.pointer.x = p.x; st.pointer.y = p.y; st.pointer.inside = p.inside;
      if (st.grabbed) { st.targetX = p.x - st.grabDX; st.targetY = p.y - st.grabDY; }
    };

    const onUp = () => {
      const st = S.current;
      if (!st.grabbed) return;
      const b = st.bodies.find((x) => x.name === st.grabbed);
      if (b) {
        const vx = Math.abs(st.pointer.svx) > Math.abs(b.vx) ? st.pointer.svx : b.vx;
        const vy = Math.abs(st.pointer.svy) > Math.abs(b.vy) ? st.pointer.svy : b.vy;
        b.vx = clamp(vx * 1.7, -72, 72);
        b.vy = clamp(vy * 1.7, -72, 72);
        const speed = Math.hypot(b.vx, b.vy);
        b.throwT = speed > 2 ? 240 : 0;
      }
      st.grabbed = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [view]);

  const onWordDown = (e, name) => {
    e.preventDefault();
    const st = S.current;
    const b = st.bodies.find((x) => x.name === name);
    if (!b) return;
    const r = fieldRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    st.grabbed = name;
    st.grabDX = x - b.x;
    st.grabDY = y - b.y;
    st.targetX = b.x;
    st.targetY = b.y;
    setActive(name);
  };

  const scatter = () => {
    const st = S.current;
    const stamp = Date.now();
    st.bodies.forEach((b) => {
      b.vx = (rnd(b.name + "k" + stamp) - 0.5) * 80;
      b.vy = (rnd(b.name + "j" + stamp) - 0.5) * 80;
      b.throwT = 90;
    });
  };

  const act = active ? BY_NAME[active] : null;

  return (
    <div className="const-wrap">
      <div className="const-bar">
        <div className="const-toggle" role="tablist" aria-label="Stack view">
          <button
            className={view === "cloud" ? "on" : ""}
            onClick={() => setView("cloud")}
            data-cursor="hover"
            role="tab"
            aria-selected={view === "cloud"}
          >◇ Cloud</button>
          <button
            className={view === "grid" ? "on" : ""}
            onClick={() => setView("grid")}
            data-cursor="hover"
            role="tab"
            aria-selected={view === "grid"}
          >▦ Grid</button>
        </div>
        {view === "cloud" && (
          <button className="const-reset" onClick={scatter} data-cursor="hover">⟲ scatter</button>
        )}
      </div>

      {view === "cloud" ? (
        <div
          className="const-field"
          ref={fieldRef}
          role="tabpanel"
          onMouseLeave={() => { if (!S.current.grabbed) setActive(null); }}
        >
          <svg className="const-lines" ref={svgRef} />
          {CAT_ORDER.map((c) => (
            <div key={c} className={`const-catlabel cat-${c}`}>{CATEGORIES[c].label}</div>
          ))}
          {TECHS.map((t) => (
            <button
              key={t.n}
              ref={(el) => (nodeRefs.current[t.n] = el)}
              className="const-word"
              data-state="idle"
              data-cursor="hover"
              aria-pressed={active === t.n}
              style={{ fontSize: `${fontFor(t).toFixed(1)}px`, "--w-op": opacityFor(t).toFixed(2) }}
              onMouseDown={(e) => onWordDown(e, t.n)}
              onMouseEnter={() => { if (!S.current.grabbed) setActive(t.n); }}
            >
              {t.n}
            </button>
          ))}

          <div className={`const-readout ${act ? "on" : ""}`} aria-live="polite">
            {act ? (
              <>
                <div className="cr-head">
                  <span className="cr-name">{act.n}</span>
                  <span className="cr-cat">{CATEGORIES[act.c].label}</span>
                </div>
                <div className="cr-count">{act.p.length} project{act.p.length > 1 ? "s" : ""}</div>
                <div className="cr-projects">{act.p.join("  ·  ")}</div>
              </>
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
          {CAT_ORDER.map((c) => (
            <div key={c} className="const-gcat">
              <div className="const-gcat-h">
                <span>{CATEGORIES[c].label}</span>
                <span className="gcat-n">{TECHS.filter((t) => t.c === c).length}</span>
              </div>
              <div className="const-chips">
                {TECHS.filter((t) => t.c === c).map((t) => (
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
