import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Section } from "../components/Section";
import { Marquee } from "../components/Marquee";
import { useActions } from "../intents/actions";
import { FEATURED_PROJECTS } from "../content/projects";
import { BIO } from "../content/bio";

const Gallery3D = lazy(() => import("../components/Gallery3D").then((m) => ({ default: m.Gallery3D })));

function HeroManifesto() {
  const actions = useActions();
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(el.querySelectorAll(".rv"));
    const clear = () => items.forEach((it) => {
      it.style.opacity = "";
      it.style.transform = "";
      it.style.willChange = "";
    });
    const isGallery = (it) => it.classList.contains("hero-gallery-inner");
    items.forEach((it) => {
      it.style.opacity = "0";
      it.style.transform = isGallery(it) ? "translateY(22px) scale(0.97)" : "translateY(16px)";
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
        it.style.transform = isGallery(it)
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
    const el = heroRef.current;
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
    <div className="hero hero-split" ref={heroRef}>
      <div className="hero-col-text">
        <div className="eyebrow rv" data-d="0.05">
          SOFTWARE ENGINEER · CV · AI AGENTS · FULL-STACK
        </div>
        <h1 className="display hero-headline">
          <span className="rv" data-d="0.12">I build software</span>
          <span className="rv" data-d="0.21">that <em>thinks</em>,</span>
          <span className="rv" data-d="0.30">sees &amp; <em>responds</em>.</span>
        </h1>
        <p className="body-l rv" data-d="0.40" style={{ maxWidth: "44ch" }}>
          {BIO.blurb}
        </p>
        <div className="hero-cta rv" data-d="0.48">
          <button className="btn" onClick={() => actions.goToPage("projects")} data-cursor="hover">
            View work <span className="arr">→</span>
          </button>
          <button className="btn ghost" onClick={() => actions.goToPage("contact")} data-cursor="hover">
            Get in touch
          </button>
        </div>
        <div className="hero-statstrip rv" data-d="0.56">
          <div className="hero-stat"><div className="v">$50K+</div><div className="l">Donations processed</div></div>
          <div className="hero-stat"><div className="v">2,000+</div><div className="l">REST APIs tested</div></div>
          <div className="hero-stat"><div className="v">4.30</div><div className="l">GPA · Centennial</div></div>
        </div>
      </div>

      <div className="hero-col-gallery">
        <div className="hero-gallery-inner rv" data-d="0.34">
          <Suspense fallback={<div style={{ minHeight: 440 }} />}>
            <Gallery3D hero />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function NowCard({ k, v }) {
  return (
    <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{k}</div>
      <div style={{ fontFamily: "var(--f-display)", fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
        {v}
      </div>
    </div>
  );
}

export default function Home() {
  const actions = useActions();
  return (
    <div className="page-enter">
      <Section num="01" label="Index · /home" style={{ marginBottom: 64 }}>
        <HeroManifesto />
      </Section>

      <Marquee items={[
        "React", "TypeScript", "Spring Boot", "FastAPI", "PostGIS",
        "Three.js", "Gemini API", "MediaPipe", "AWS", "Cloudflare",
        "Computer Vision", "AI Agents", "Geospatial", "Full-stack",
      ]} />

      <Section num="02" label="Selected work · /projects">
        <div className="featured-grid">
          {FEATURED_PROJECTS.map((p) => (
            <article key={p.id} className="project-card" data-cursor="hover" data-hand-project={p.id} onClick={() => actions.openProject(p.id)}>
              <div>
                <div className="pc-num">{p.num} · {p.url}</div>
                <h3 className="pc-title">{p.title}</h3>
                <p className="pc-desc" style={{ marginTop: 16 }}>{p.desc}</p>
              </div>
              <div className="pc-stat">
                {p.stats.map((s, i) => (
                  <div key={i}><b>{s.v}</b>{s.l}</div>
                ))}
              </div>
              <div className="pc-meta">
                {p.tags.map((t, i) => <span key={i}>{t}</span>)}
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <button className="btn ghost" onClick={() => actions.goToPage("projects")} data-cursor="hover">
            All work <span className="arr">→</span>
          </button>
        </div>
      </Section>

      <Section num="03" label="Now · /currently">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <NowCard k="Studying" v="B.Sc Computer Science (Honours), Ontario Tech University. Expected May 2027." />
          <NowCard k="Working on" v="Hand-tracking input for the web — a Tony-Stark-style way to control this site without a mouse." />
          <NowCard k="Open to" v="Internships, freelance, and projects with teams that care about getting the details right." />
        </div>
      </Section>
    </div>
  );
}
