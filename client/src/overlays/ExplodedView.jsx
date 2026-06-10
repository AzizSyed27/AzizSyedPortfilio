import { Fragment, useEffect, useRef, useState } from "react";
import { PROJECTS_BY_ID } from "../content/projects";
import DecryptedText from "../components/DecryptedText";

// Per-project exploded view — a full-screen HUD scene ported from the Claude
// Design handoff (.design-bundle/.../<project> Exploded.html). Five floating
// fragments (preview, metrics, stack, architecture, case study) connected to
// the preview hub by leader lines, with depth parallax on mouse move.
//
// The page stays mounted and is blurred behind the overlay (.exp-backdrop). On
// open the fragments fly in one-by-one from the clicked card (origin optional —
// falls back to popping in place), then the text decodes/scrambles in per panel.
// Colors come from the active theme — no longer hardwired to HUD — so when hand
// mode flips the site to the HUD palette, this scene follows.

// data-depth drives both the parallax magnitude and the leader-line layout
// (preview is the hub; the other four are spokes).
const DEPTH = { preview: 0.25, stats: 1.5, tags: 1.0, arch: 0.65, case: 1.25 };

// Entrance timing: each fragment flies in over POP_MS, staggered by POP_STAGGER.
const POP_MS = 420;
const POP_STAGGER = 130;

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// HUD glyph set for the decode scramble.
const HUD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./<>#";

// Thin adapter over DecryptedText: sequential decode that auto-starts in view,
// deferred by `delay` so fragments cascade (L01 → L02 → …). Falls back to plain
// text under reduced motion. `bold` wraps the result in <b> (replaces the old
// ScrambleText `as="b"`).
function Decrypt({ text, delay = 0, className, bold = false }) {
  if (prefersReduced()) {
    const plain = <span className={className}>{text}</span>;
    return bold ? <b>{plain}</b> : plain;
  }
  const el = (
    <DecryptedText
      text={text}
      animateOn="view"
      sequential
      speed={14}
      startDelay={delay}
      characters={HUD_CHARS}
      parentClassName={className}
      encryptedClassName="exp-enc"
    />
  );
  return bold ? <b>{el}</b> : el;
}

export function ExplodedView({ id, origin, onClose }) {
  const project = PROJECTS_BY_ID[id];
  const sceneRef = useRef(null);
  const svgRef = useRef(null);
  const coordsRef = useRef(null);
  const [grown, setGrown] = useState(false);

  // Grab/throw physics state — mirrors StackConstellation's S.current shape so a
  // future hand-pointer can drive the same seam (pointer + grabbed). The rAF
  // loop owns `bodies`; pointer handlers write `grabbed`/`target`.
  const physRef = useRef({
    pointer: { x: 0, y: 0, vx: 0, vy: 0, svx: 0, svy: 0 },
    grabbed: null, grabDX: 0, grabDY: 0, targetX: 0, targetY: 0,
    bodies: [], canGrab: false,
  });

  // Grab a fragment on pointerdown (desktop/unscaled only). Scene is unscaled at
  // ≥981px, so pointer deltas are already in .scene layout px — no conversion.
  const onFragDown = (e) => {
    const P = physRef.current;
    if (!P.canGrab) return;
    const scene = sceneRef.current;
    const b = P.bodies.find((x) => x.id === e.currentTarget.id);
    if (!scene || !b) return;
    e.preventDefault();
    const r = scene.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    P.grabbed = b.id;
    P.grabDX = x - b.x;
    P.grabDY = y - b.y;
    P.targetX = b.x;
    P.targetY = b.y;
    P.pointer.x = x; P.pointer.y = y;
    P.pointer.vx = P.pointer.vy = P.pointer.svx = P.pointer.svy = 0;
    b.state = "grabbed";
    b.el.setAttribute("data-grabbed", "");
  };

  // Esc closes.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Entrance: each fragment flies in from the clicked card (desktop with an
  // origin rect) or pops in place (small screens / no origin), staggered
  // L01 → L05. fill:"backwards" holds each frag tiny-at-the-card during its
  // stagger delay and applies nothing after finish — so the element reverts to
  // its home (no inline transform) and the physics loop owns it uncontested.
  // Physics stays gated on `grown`, set when the last fragment lands.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || prefersReduced()) { setGrown(true); return undefined; }
    const frags = Array.from(scene.querySelectorAll(".frag"));
    if (!frags.length) { setGrown(true); return undefined; }
    const canFly =
      typeof matchMedia !== "undefined" &&
      matchMedia("(min-width: 981px) and (pointer: fine)").matches &&
      !!origin && origin.w > 0 && origin.h > 0;
    const cardCx = canFly ? origin.x + origin.w / 2 : 0;
    const cardCy = canFly ? origin.y + origin.h / 2 : 0;

    const anims = frags.map((el, i) => {
      let from;
      if (canFly) {
        const r = el.getBoundingClientRect();
        const dx = cardCx - (r.left + r.width / 2);
        const dy = cardCy - (r.top + r.height / 2);
        from = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(0.18)`;
      } else {
        from = "scale(0.5)";
      }
      return el.animate(
        [{ transform: from, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: POP_MS, delay: i * POP_STAGGER, easing: "cubic-bezier(.2,1.1,.3,1)", fill: "backwards" },
      );
    });

    let cancelled = false;
    anims[anims.length - 1].finished.then(() => { if (!cancelled) setGrown(true); }).catch(() => {});
    return () => { cancelled = true; anims.forEach((a) => a.cancel()); };
  }, [id, origin]);

  // One loop, owned after the grow lands: depth parallax at rest + grab/throw
  // physics (ported from StackConstellation.tick) + leader lines. Everything is
  // in .scene layout coords (offset* are transform-independent) so body coords
  // map 1:1 to the viewBox-less leaders SVG. Static under reduced motion.
  useEffect(() => {
    if (!grown) return undefined;
    const scene = sceneRef.current;
    const svg = svgRef.current;
    if (!scene || !svg) return undefined;
    const SVGNS = "http://www.w3.org/2000/svg";
    const reduced = prefersReduced();
    const canGrab =
      !reduced &&
      typeof matchMedia !== "undefined" &&
      matchMedia("(min-width: 981px) and (pointer: fine)").matches;
    const P = physRef.current;
    P.canGrab = canGrab;
    P.grabbed = null;
    const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // Build bodies in layout space.
    const measure = (b) => {
      b.homeX = b.el.offsetLeft + b.el.offsetWidth / 2;
      b.homeY = b.el.offsetTop + b.el.offsetHeight / 2;
      b.hw = b.el.offsetWidth / 2;
      b.hh = b.el.offsetHeight / 2;
    };
    const bodies = Array.from(scene.querySelectorAll(".frag")).map((el) => {
      const b = {
        el, id: el.id, depth: parseFloat(el.dataset.depth) || 0,
        homeX: 0, homeY: 0, hw: 30, hh: 12,
        x: 0, y: 0, vx: 0, vy: 0, ox: 0, oy: 0, throwT: 0, state: "rest",
      };
      measure(b);
      b.x = b.homeX; b.y = b.homeY;
      return b;
    });
    P.bodies = bodies;
    const hub = bodies.find((b) => b.id === "exp-frag-preview") || bodies[0];
    const spokes = bodies.filter((b) => b !== hub);

    let W = scene.offsetWidth, H = scene.offsetHeight;
    const ro = new ResizeObserver(() => {
      W = scene.offsetWidth; H = scene.offsetHeight;
      bodies.forEach(measure);
    });
    ro.observe(scene);

    const lines = spokes.map((sp) => {
      const poly = document.createElementNS(SVGNS, "polyline");
      poly.setAttribute("class", "lead-dash");
      const nodeA = document.createElementNS(SVGNS, "circle");
      nodeA.setAttribute("class", "node"); nodeA.setAttribute("r", "3.5");
      const nodeB = document.createElementNS(SVGNS, "circle");
      nodeB.setAttribute("class", "core"); nodeB.setAttribute("r", "2.2");
      svg.appendChild(poly); svg.appendChild(nodeA); svg.appendChild(nodeB);
      return { sp, poly, nodeA, nodeB };
    });
    const core = document.createElementNS(SVGNS, "circle");
    core.setAttribute("class", "core"); core.setAttribute("r", "3");
    svg.appendChild(core);

    // Edge point of a body's box facing (tx,ty), in layout coords.
    const edgeToward = (b, tx, ty) => {
      const dx = tx - b.x, dy = ty - b.y;
      const sx = dx === 0 ? Infinity : b.hw / Math.abs(dx);
      const sy = dy === 0 ? Infinity : b.hh / Math.abs(dy);
      const s = Math.min(sx, sy);
      return { x: b.x + dx * s, y: b.y + dy * s };
    };

    let mx = 0.5, my = 0.5, cmx = 0.5, cmy = 0.5, raf = 0;

    const frame = () => {
      cmx += (mx - cmx) * 0.08;
      cmy += (my - cmy) * 0.08;
      const px = cmx - 0.5;
      const py = cmy - 0.5;

      for (const b of bodies) {
        const tx = -px * b.depth * 46;
        const ty = -py * b.depth * 30;
        b.ox += (tx - b.ox) * 0.12;
        b.oy += (ty - b.oy) * 0.12;
        const restX = b.homeX + b.ox;
        const restY = b.homeY + b.oy;

        if (b.state === "grabbed") {
          const nx = b.x + (P.targetX - b.x) * 0.5;
          const ny = b.y + (P.targetY - b.y) * 0.5;
          b.vx = nx - b.x; b.vy = ny - b.y;
          b.x = nx; b.y = ny;
        } else if (b.state === "thrown") {
          b.throwT--;
          b.vx *= 0.985; b.vy *= 0.985;
          b.x += b.vx; b.y += b.vy;
          if (b.x < b.hw) { b.x = b.hw; b.vx *= -0.7; }
          if (b.x > W - b.hw) { b.x = W - b.hw; b.vx *= -0.7; }
          if (b.y < b.hh) { b.y = b.hh; b.vy *= -0.7; }
          if (b.y > H - b.hh) { b.y = H - b.hh; b.vy *= -0.7; }
          if (b.throwT <= 0) b.state = "settling";
        } else if (b.state === "settling") {
          b.vx = (b.vx + (restX - b.x) * 0.12) * 0.82;
          b.vy = (b.vy + (restY - b.y) * 0.12) * 0.82;
          b.x += b.vx; b.y += b.vy;
          if (Math.hypot(restX - b.x, restY - b.y) < 0.6 && Math.hypot(b.vx, b.vy) < 0.3) {
            b.state = "rest";
          }
        } else {
          b.x = restX; b.y = restY; b.vx = 0; b.vy = 0;
        }
      }

      // Collision separation — only when a participant is active, so the resting
      // layout never drifts. Push along the lesser-penetration axis.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          const aA = a.state === "thrown" || a.state === "grabbed";
          const bA = b.state === "thrown" || b.state === "grabbed";
          if (!aA && !bA) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const minx = (a.hw + b.hw) * 0.9;
          const miny = (a.hh + b.hh) * 0.9;
          if (Math.abs(dx) < minx && Math.abs(dy) < miny) {
            const ox = (minx - Math.abs(dx)) * (dx < 0 ? -1 : 1);
            const oy = (miny - Math.abs(dy)) * (dy < 0 ? -1 : 1);
            const wake = (bd) => { if (bd.state === "rest") bd.state = "settling"; };
            if (Math.abs(ox) < Math.abs(oy)) {
              if (a.state !== "grabbed") { a.x -= ox * 0.5; a.vx -= ox * 0.05; wake(a); }
              if (b.state !== "grabbed") { b.x += ox * 0.5; b.vx += ox * 0.05; wake(b); }
            } else {
              if (a.state !== "grabbed") { a.y -= oy * 0.5; a.vy -= oy * 0.05; wake(a); }
              if (b.state !== "grabbed") { b.y += oy * 0.5; b.vy += oy * 0.05; wake(b); }
            }
          }
        }
      }

      for (const b of bodies) {
        const rot = px * b.depth * 2.2;
        b.el.style.transform =
          `translate3d(${(b.x - b.homeX).toFixed(2)}px, ${(b.y - b.homeY).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      }

      core.setAttribute("cx", hub.x); core.setAttribute("cy", hub.y);
      lines.forEach(({ sp, poly, nodeA, nodeB }) => {
        const a = edgeToward(sp, hub.x, hub.y);
        const b = edgeToward(hub, sp.x, sp.y);
        const midx = (a.x + b.x) / 2;
        poly.setAttribute("points", `${a.x},${a.y} ${midx},${a.y} ${b.x},${b.y}`);
        nodeA.setAttribute("cx", a.x); nodeA.setAttribute("cy", a.y);
        nodeB.setAttribute("cx", b.x); nodeB.setAttribute("cy", b.y);
        const lit = !!P.grabbed && (sp.id === P.grabbed || hub.id === P.grabbed);
        const cls = lit ? "lead-dash lead-active" : "lead-dash";
        if (poly.getAttribute("class") !== cls) poly.setAttribute("class", cls);
      });

      if (coordsRef.current) {
        coordsRef.current.textContent =
          `x:${cmx.toFixed(3)} y:${cmy.toFixed(3)} · z-depth: 5 layers`;
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const onMoveMouse = (e) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; };
    const onPointerMove = (e) => {
      const r = scene.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      P.pointer.vx = x - P.pointer.x;
      P.pointer.vy = y - P.pointer.y;
      P.pointer.svx = 0.45 * P.pointer.svx + 0.55 * P.pointer.vx;
      P.pointer.svy = 0.45 * P.pointer.svy + 0.55 * P.pointer.vy;
      P.pointer.x = x; P.pointer.y = y;
      if (P.grabbed) { P.targetX = x - P.grabDX; P.targetY = y - P.grabDY; }
    };
    const onPointerUp = () => {
      if (!P.grabbed) return;
      const b = bodies.find((x) => x.id === P.grabbed);
      if (b) {
        const vx = Math.abs(P.pointer.svx) > Math.abs(b.vx) ? P.pointer.svx : b.vx;
        const vy = Math.abs(P.pointer.svy) > Math.abs(b.vy) ? P.pointer.svy : b.vy;
        b.vx = clampN(vx * 1.5, -40, 40);
        b.vy = clampN(vy * 1.5, -40, 40);
        b.throwT = Math.hypot(b.vx, b.vy) > 1.5 ? 140 : 0;
        b.state = b.throwT > 0 ? "thrown" : "settling";
        b.el.removeAttribute("data-grabbed");
      }
      P.grabbed = null;
    };

    if (!reduced) window.addEventListener("mousemove", onMoveMouse);
    if (canGrab) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
    const onResize = () => { if (reduced) frame(); };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (!reduced) window.removeEventListener("mousemove", onMoveMouse);
      if (canGrab) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      }
      window.removeEventListener("resize", onResize);
      lines.forEach(({ poly, nodeA, nodeB }) => { poly.remove(); nodeA.remove(); nodeB.remove(); });
      core.remove();
      P.bodies = []; P.grabbed = null; P.canGrab = false;
    };
  }, [id, grown]);

  if (!project) return null;
  const { num, title, tags = [], stats = [], arch = [], caseStudy, preview = {} } = project;

  // Boot-up reveal: each fragment's text decodes right after that panel lands —
  // startDelay = (its pop delay) + POP_MS — so the cascade tracks the fly-in.
  // Chrome (title/bottom readouts) isn't a fragment: title shows with the
  // backdrop, bottom after the last panel. Reduced motion → instant.
  const D = {
    title: 120,
    preview: 0 * POP_STAGGER + POP_MS,
    stats: 1 * POP_STAGGER + POP_MS,
    tags: 2 * POP_STAGGER + POP_MS,
    arch: 3 * POP_STAGGER + POP_MS,
    caseT: 4 * POP_STAGGER + POP_MS,
    caseB: 4 * POP_STAGGER + POP_MS + 40,
    bottom: 4 * POP_STAGGER + POP_MS + 100,
  };

  return (
    <div
      className="exploded-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exp-title"
      onClick={onClose}
    >
      <div className="exp-viewport">
        <div className="exp-backdrop" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <div className="hud-corner c-tl" aria-hidden="true" />
        <div className="hud-corner c-tr" aria-hidden="true" />
        <div className="hud-corner c-bl" aria-hidden="true" />
        <div className="hud-corner c-br" aria-hidden="true" />

        <div className="top-readout" aria-hidden="true">
          <div className="title" id="exp-title">
            <Decrypt text="HAND MODE // EXPLODED VIEW —" delay={D.title} />{" "}
            <Decrypt bold text={`${num} · ${title}`} delay={D.title + 60} />
          </div>
          <div className="right">
            <div>
              <span className="live-dot" />
              <Decrypt className="live" text="TRACKING · OPEN PALM" delay={D.title + 100} />
            </div>
            <div ref={coordsRef}>x:0.500 y:0.500 · z-depth: 5 layers</div>
          </div>
        </div>

        {/* Clicks inside the scene shouldn't dismiss; only the backdrop closes. */}
        <div className="stage" onClick={(e) => e.stopPropagation()}>
          <div className="scene" ref={sceneRef}>
            <svg className="leaders" ref={svgRef} />

            <div className="frag" id="exp-frag-preview" data-depth={DEPTH.preview} onPointerDown={onFragDown}>
              <div className="frag-label"><Decrypt text="L01 · PREVIEW.LAYER" delay={D.preview} /></div>
              {preview.image ? (
                <div className="preview-shot">
                  <img src={preview.image} alt={`${title} screenshot`} draggable={false} />
                  <div className="preview-meta">
                    <Decrypt text={preview.metaLeft || ""} delay={D.preview + 30} />
                    <Decrypt text={preview.dims || ""} delay={D.preview + 60} />
                  </div>
                </div>
              ) : (
                <div className="preview-fallback">
                  <div className="ph"><Decrypt text={`Drop ${title} screenshot`} delay={D.preview + 30} /></div>
                  <div className="preview-meta">
                    <Decrypt text={preview.metaLeft || ""} delay={D.preview + 50} />
                    <Decrypt text={preview.dims || ""} delay={D.preview + 80} />
                  </div>
                </div>
              )}
            </div>

            <div className="frag" id="exp-frag-stats" data-depth={DEPTH.stats} onPointerDown={onFragDown}>
              <div className="frag-label"><Decrypt text="L02 · METRICS" delay={D.stats} /></div>
              <span className="frag-idx"><Decrypt text="02 / 05" delay={D.stats} /></span>
              <div className="stat-row">
                {stats.map((s, i) => (
                  <div className="stat-cell" key={i}>
                    <div className="v"><Decrypt text={s.v} delay={D.stats + 40 + i * 30} /></div>
                    <div className="l"><Decrypt text={s.l} delay={D.stats + 70 + i * 30} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="frag" id="exp-frag-tags" data-depth={DEPTH.tags} onPointerDown={onFragDown}>
              <div className="frag-label"><Decrypt text="L03 · STACK" delay={D.tags} /></div>
              <span className="frag-idx"><Decrypt text="03 / 05" delay={D.tags} /></span>
              <h3 className="frag-h"><Decrypt text="Runtime dependencies" delay={D.tags + 30} /></h3>
              <div className="tags-wrap">
                {tags.map((t, i) => (
                  <span className="tag" key={t}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <Decrypt text={t} delay={D.tags + 60 + i * 30} />
                  </span>
                ))}
              </div>
            </div>

            <div className="frag" id="exp-frag-arch" data-depth={DEPTH.arch} onPointerDown={onFragDown}>
              <div className="frag-label"><Decrypt text="L04 · ARCHITECTURE" delay={D.arch} /></div>
              <span className="frag-idx"><Decrypt text="04 / 05" delay={D.arch} /></span>
              <h3 className="frag-h"><Decrypt text="Request path" delay={D.arch + 30} /></h3>
              <div className="arch-diagram">
                {arch.map((n, i) => (
                  <Fragment key={n.label}>
                    {i > 0 && <div className="arch-link" />}
                    <div className="arch-node">
                      <Decrypt text={n.label} delay={D.arch + 60 + i * 30} />
                      <small><Decrypt text={n.sub} delay={D.arch + 80 + i * 30} /></small>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            {caseStudy && (
              <div className="frag" id="exp-frag-case" data-depth={DEPTH.case} onPointerDown={onFragDown}>
                <div className="frag-label"><Decrypt text="L05 · CASE STUDY" delay={D.caseT} /></div>
                <span className="frag-idx"><Decrypt text="05 / 05" delay={D.caseT} /></span>
                <div className="case-title"><Decrypt text={caseStudy.title} delay={D.caseT + 30} /></div>
                <div className="case-body">
                  {caseStudy.body.map((seg, i) =>
                    typeof seg === "string"
                      ? <Decrypt key={i} text={seg} delay={D.caseB + i * 25} />
                      : <Decrypt key={i} bold text={seg.b} delay={D.caseB + i * 25} />,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bottom-readout">
          <button className="back-link" onClick={onClose} type="button">
            <Decrypt text="← back to work" delay={D.bottom} />
          </button>
          <div className="affordance" aria-hidden="true">
            <Decrypt text="move cursor to orbit · layers separated on Z" delay={D.bottom + 40} />
          </div>
          <button className="exp-close" onClick={onClose} aria-label="Close exploded view" type="button">×</button>
        </div>
      </div>

      <style>{`
        .exploded-view {
          --p: color-mix(in srgb, var(--surface) 78%, transparent);
          --a5: color-mix(in srgb, var(--accent) 5%, transparent);
          --a6: color-mix(in srgb, var(--accent) 6%, transparent);
          --a8: color-mix(in srgb, var(--accent) 8%, transparent);
          --a10: color-mix(in srgb, var(--accent) 10%, transparent);
          --a12: color-mix(in srgb, var(--accent) 12%, transparent);
          position: fixed; inset: 0; z-index: 220; overflow: hidden;
          color: var(--fg); font-family: var(--f-body);
        }
        .exploded-view .exp-viewport { position: absolute; inset: 0; }
        /* Blurs the live page behind the overlay + a translucent theme scrim for
           contrast. A faint accent glow keeps a touch of the HUD feel. */
        .exploded-view .exp-backdrop {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(120% 90% at 70% 18%, var(--a10) 0%, transparent 55%),
            color-mix(in srgb, var(--bg) 55%, transparent);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          animation: exp-fade 0.25s ease-out both;
        }
        @keyframes exp-fade { from { opacity: 0; } to { opacity: 1; } }
        .exploded-view .grain {
          position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.05;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .exploded-view .hud-corner { position: absolute; width: 60px; height: 60px; z-index: 40; pointer-events: none; }
        .exploded-view .hud-corner::before, .exploded-view .hud-corner::after { content: ""; position: absolute; background: var(--accent); opacity: 0.8; }
        .exploded-view .hud-corner::before { width: 22px; height: 1.5px; }
        .exploded-view .hud-corner::after { width: 1.5px; height: 22px; }
        .exploded-view .c-tl { top: 22px; left: 22px; } .exploded-view .c-tl::before, .exploded-view .c-tl::after { top: 0; left: 0; }
        .exploded-view .c-tr { top: 22px; right: 22px; } .exploded-view .c-tr::before { top: 0; right: 0; } .exploded-view .c-tr::after { top: 0; right: 0; }
        .exploded-view .c-bl { bottom: 22px; left: 22px; } .exploded-view .c-bl::before { bottom: 0; left: 0; } .exploded-view .c-bl::after { bottom: 0; left: 0; }
        .exploded-view .c-br { bottom: 22px; right: 22px; } .exploded-view .c-br::before { bottom: 0; right: 0; } .exploded-view .c-br::after { bottom: 0; right: 0; }

        .exploded-view .top-readout {
          position: absolute; top: 30px; left: 64px; right: 64px; z-index: 41;
          display: flex; justify-content: space-between; align-items: flex-start;
          font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted); pointer-events: none;
        }
        .exploded-view .top-readout .title { color: var(--fg); }
        .exploded-view .top-readout .title b { color: var(--accent-bright); font-weight: 500; }
        .exploded-view .top-readout .right { text-align: right; line-height: 1.7; }
        .exploded-view .top-readout .right .live { color: var(--accent); }
        .exploded-view .live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background: var(--accent); margin-right:6px; vertical-align: 1px; animation: exp-blink 1.4s ease-in-out infinite; }
        @keyframes exp-blink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }

        .exploded-view .bottom-readout {
          position: absolute; bottom: 30px; left: 64px; right: 64px; z-index: 41;
          display: flex; justify-content: space-between; align-items: flex-end;
          font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted-2);
        }
        .exploded-view .affordance { color: var(--accent); pointer-events: none; }
        .exploded-view .back-link {
          color: var(--muted); background: transparent; font: inherit; text-transform: inherit; letter-spacing: inherit;
          border: 0.5px solid var(--line-strong); border-radius: 999px; padding: 7px 14px; cursor: pointer;
          transition: color .2s, border-color .2s, background .2s;
        }
        .exploded-view .back-link:hover { color: var(--fg); border-color: var(--accent); background: var(--a8); }
        .exploded-view .exp-close { background: transparent; border: 0; color: var(--fg); font-size: 24px; line-height: 1; cursor: pointer; }

        .exploded-view .stage { position: absolute; inset: 0; z-index: 10; }
        .exploded-view .scene { position: absolute; inset: 0; }

        .exploded-view svg.leaders { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 11; pointer-events: none; overflow: visible; }
        .exploded-view svg.leaders polyline { stroke: var(--accent); stroke-width: 1; opacity: 0.55; fill: none; }
        .exploded-view svg.leaders .lead-dash { stroke-dasharray: 3 4; opacity: 0.4; }
        .exploded-view svg.leaders .lead-active { stroke-width: 1.8; opacity: 0.9; animation: exp-leadpulse 0.9s ease-in-out infinite; }
        @keyframes exp-leadpulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
        .exploded-view svg.leaders circle.node { fill: var(--bg); stroke: var(--accent); stroke-width: 1.2; }
        .exploded-view svg.leaders circle.core { fill: var(--accent); }

        .exploded-view .frag {
          position: absolute; z-index: 12;
          background: var(--p);
          backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
          border: 0.5px solid var(--line-strong); border-radius: 10px;
          box-shadow: 0 30px 60px -28px rgba(0,0,0,0.8);
          will-change: transform; transition: box-shadow .3s, border-color .3s;
          user-select: none;
        }
        .exploded-view .frag:hover { border-color: var(--accent); box-shadow: 0 40px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px var(--accent); z-index: 30; }
        /* Grab affordance — only meaningful on unscaled desktop, harmless otherwise. */
        @media (min-width: 981px) and (pointer: fine) { .exploded-view .frag { cursor: grab; } }
        .exploded-view .frag[data-grabbed] {
          z-index: 40; border-color: var(--accent); cursor: grabbing;
          box-shadow: 0 0 0 1px var(--accent), 0 40px 80px -30px rgba(0,0,0,0.9);
        }
        .exploded-view .frag-label {
          position: absolute; top: -9px; left: 14px;
          font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent); background: var(--bg); padding: 2px 8px; border: 0.5px solid var(--line-strong); border-radius: 4px;
        }
        .exploded-view .frag-idx {
          position: absolute; top: 10px; right: 12px;
          font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; color: var(--muted-2);
        }
        .exploded-view h3.frag-h { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); font-weight: 400; }

        .exploded-view #exp-frag-preview { left: 6%; top: 20%; width: 40%; padding: 12px; }
        /* 16:9 frame so screenshots (1920×1080) fit without distortion. */
        .exploded-view .preview-shot, .exploded-view .preview-fallback { width: 100%; aspect-ratio: 16 / 9; height: auto; border-radius: 5px; overflow: hidden; position: relative; }
        .exploded-view .preview-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .exploded-view .preview-fallback {
          background:
            linear-gradient(135deg, var(--a12), transparent 60%),
            repeating-linear-gradient(135deg, var(--a5) 0 12px, transparent 12px 24px),
            var(--surface);
          display: grid; place-items: center;
        }
        .exploded-view .preview-fallback .ph {
          font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent); border: 0.5px dashed var(--line-strong); border-radius: 6px; padding: 10px 16px;
        }
        .exploded-view .preview-meta {
          position: absolute; bottom: 10px; left: 12px; right: 12px; display: flex; justify-content: space-between;
          font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
        }
        .exploded-view .preview-shot .preview-meta { color: var(--fg); text-shadow: 0 1px 6px rgba(0,0,0,0.8); }

        .exploded-view #exp-frag-stats { left: 60%; top: 13%; width: 33%; padding: 22px; }
        .exploded-view .stat-row { display: flex; gap: 26px; align-items: flex-start; }
        .exploded-view .stat-cell .v { font-family: var(--f-display); font-size: 40px; line-height: 1; letter-spacing: -0.02em; color: var(--fg); white-space: nowrap; }
        .exploded-view .stat-cell .l { font-family: var(--f-mono); font-size: 9.5px; line-height: 1.4; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-top: 8px; max-width: 13ch; display: inline-block; }

        .exploded-view #exp-frag-tags { left: 67%; top: 44%; width: 30%; padding: 18px 20px 20px; }
        .exploded-view .tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .exploded-view .tag { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--fg); border: 0.5px solid var(--line-strong); border-radius: 999px; padding: 5px 11px; background: var(--a6); }
        .exploded-view .tag b { color: var(--accent); font-weight: 400; margin-right: 4px; }

        .exploded-view #exp-frag-arch { left: 13%; top: 74%; width: 33%; padding: 18px 20px; }
        .exploded-view .arch-diagram { display: flex; align-items: center; gap: 0; margin-top: 10px; }
        .exploded-view .arch-node { flex: 1; border: 0.5px solid var(--line-strong); border-radius: 6px; padding: 9px 6px; text-align: center; font-family: var(--f-mono); font-size: 8.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--fg); background: var(--a5); line-height: 1.4; }
        .exploded-view .arch-node small { display: block; color: var(--muted-2); font-size: 7.5px; margin-top: 3px; }
        .exploded-view .arch-link { flex: 0 0 18px; height: 1px; background: var(--accent); position: relative; opacity: 0.7; }
        .exploded-view .arch-link::after { content: "›"; position: absolute; right: -2px; top: -8px; color: var(--accent); font-size: 11px; }

        .exploded-view #exp-frag-case { left: 50%; top: 70%; width: 30%; padding: 20px 22px; }
        .exploded-view .case-title { font-family: var(--f-display); font-size: 22px; line-height: 1.05; letter-spacing: -0.01em; margin-bottom: 8px; }
        .exploded-view .case-body { font-size: 12.5px; line-height: 1.55; color: var(--muted); }
        .exploded-view .case-body b { color: var(--fg); font-weight: 500; }

        /* Not-yet-decoded glyphs (DecryptedText encryptedClassName) tint to the
           accent so text resolves from accent-colored cipher into place. */
        .exploded-view .exp-enc { color: var(--accent); opacity: 0.85; }

        @media (max-width: 980px) {
          .exploded-view .scene { transform: scale(0.62); transform-origin: center; }
          .exploded-view .top-readout, .exploded-view .bottom-readout { left: 24px; right: 24px; }
        }
        @media (max-width: 640px) {
          .exploded-view .scene { transform: scale(0.42); }
        }
        @media (prefers-reduced-motion: reduce) {
          .exploded-view .live-dot { animation: none; }
          .exploded-view .exp-backdrop { animation: none; }
        }
      `}</style>
    </div>
  );
}
