// pages.jsx — The 5 page views: Home, About, Services, Projects, Contact

// ───────────────────────────────────────────────────────────────
// DATA
// ───────────────────────────────────────────────────────────────
const FEATURED_PROJECTS = [
  {
    id: "pxp",
    num: "P/01",
    title: "Projects by the Projects",
    url: "ProjectsXProjects.ca",
    desc: "Full-stack nonprofit platform serving 125+ subscribers — donations, content, and supporter newsletters.",
    tags: ["React", "Spring Boot", "PostgreSQL", "Stripe", "Cloudflare"],
    exploded: "Projects by the Projects Exploded.html",
    stats: [
      { v: "$50K+", l: "in donations" },
      { v: "99.6%", l: "payment success" },
    ],
  },
  {
    id: "mye46",
    num: "P/02",
    title: "MyE46",
    url: "MyE46.app",
    desc: "Agentic 3D car configurator. Plain-English mods, live budget-aware build updates, real-time part swapping.",
    tags: ["React Three Fiber", "Three.js", "Express", "Gemini API", "Zustand"],
    exploded: "MyE46 Exploded.html",
    stats: [
      { v: "600+", l: "users week one" },
      { v: "15-30%", l: "GPU under load" },
    ],
  },
  {
    id: "asl",
    num: "P/03",
    title: "ASL Hand Coach",
    url: "ASLHandCoach.ca",
    desc: "Browser-based ASL trainer. Live camera input, 21 hand keypoints, sub-200ms ML inference.",
    tags: ["React", "TypeScript", "MediaPipe", "CNN", "Tailwind"],
    exploded: "ASL Hand Coach Exploded.html",
    stats: [
      { v: "90%", l: "recognition accuracy" },
      { v: "36", l: "signs A–Z, 0–9" },
    ],
  },
  {
    id: "hooks",
    num: "P/04",
    title: "HiddenHooks",
    url: "HiddenHooks.ca",
    desc: "PostGIS engine ranking 100K+ Ontario water bodies. Geospatial ETL across 9 open-data sources, graph inference for fish presence.",
    tags: ["FastAPI", "PostGIS", "NetworkX", "Next.js", "Mapbox GL"],
    exploded: "HiddenHooks Exploded.html",
    stats: [
      { v: "3GB+", l: "geospatial data" },
      { v: "100K+", l: "water bodies" },
    ],
  },
];

const OTHER_PROJECTS = [
  { num: "05", title: "GymNet", tags: "React · Spring Boot · PostgreSQL · Flyway", note: "Gym ops + member + admin dashboards", extra: "Role-based dashboards for members, trainers, and admins, with Flyway-versioned schema migrations." },
  { num: "06", title: "DineSmart", tags: "Angular · Spring Boot · MongoDB · GraphQL", note: "Restaurant management, Apollo Server", extra: "Menu, orders, and table management served over a GraphQL API with Apollo Server." },
  { num: "07", title: "MovieShare", tags: "ASP.NET Core · AWS EC2 · S3 · CloudFront · RDS", note: "Cloud movie streaming on AWS CI/CD", extra: "Streaming pipeline on EC2 + S3 + CloudFront with an automated CI/CD release to AWS." },
  { num: "08", title: "CommConnect", tags: "Next.js · React MFEs · Apollo Federation · Gemini", note: "Community platform with AI RAG assistant", extra: "Federated micro-frontends with a Gemini-powered RAG assistant answering community questions." },
];

const CAPABILITIES = [
  {
    num: "C/01",
    title: "Full-stack engineering",
    desc: "Comfortable end-to-end — UIs, APIs, databases, deploys. I like understanding how the whole thing fits together.",
    tags: ["React", "Angular", "Next.js", "Spring Boot", "Express", "FastAPI", ".NET Core", "REST", "GraphQL"],
    story: "Shipped a nonprofit platform end-to-end — React, Spring Boot, PostgreSQL, Stripe — now live to 125+ subscribers and $50K+ raised.",
  },
  {
    num: "C/02",
    title: "AI agents & automation",
    desc: "Multi-agent pipelines, RAG, SSE streaming. I shipped a 3-agent debug pipeline catching 150+ production bugs.",
    tags: ["Gemini API", "Agent pipelines", "RAG", "SSE", "LLM tool use"],
    story: "A 3-agent debug pipeline I built caught 150+ production defects before they ever reached a user.",
  },
  {
    num: "C/03",
    title: "Computer vision",
    desc: "Real-time ML inference in the browser. Built ASL Hand Coach: CNN palm detector + landmark regression at sub-200ms.",
    tags: ["MediaPipe", "CNN palm detection", "21-keypoint regression", "WebGL"],
    story: "ASL Hand Coach reads 36 signs at 90% accuracy with sub-200ms inference — all in the browser, no install.",
  },
  {
    num: "C/04",
    title: "Cloud & DevOps",
    desc: "Deployed across AWS, Azure, Cloudflare. CI/CD pipelines, containerization, observable releases.",
    tags: ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    story: "Turned a manual, afternoon-long release into a one-click deploy across AWS, Azure, and Cloudflare.",
  },
  {
    num: "C/05",
    title: "Geospatial & data",
    desc: "PostGIS, spatial indexes, ETL across shapefile/CSV/GeoTIFF. Graph inference with NetworkX over 100K+ entities.",
    tags: ["PostGIS", "GiST + KNN indexes", "GeoPandas", "NetworkX"],
    story: "Indexed 100,000+ Ontario water bodies into a ranked map that answers 'where are the fish' in milliseconds.",
  },
  {
    num: "C/06",
    title: "3D & real-time graphics",
    desc: "React Three Fiber, adaptive rendering. Cut GPU usage from 90% to 15-30% under 200 concurrent users.",
    tags: ["Three.js", "React Three Fiber", "Adaptive LOD", "WebGL"],
    story: "Dropped GPU load from 90% to 15–30% under 200 concurrent users with adaptive rendering.",
  },
];

const CLIENTS = [
  {
    id: "C/01",
    initial: "A",
    name: "Able I.T Solutions",
    role: "AI ticket-triage agent + technical support workflows",
    desc: "Built an AI agent that ranks support tickets by severity with auto-synopses. Eliminated ~2 hrs of manual triage per shift.",
    metric: "92%",
    metricL: "resolution rate",
    story: "Ranked tickets by severity with auto-synopses, clearing ~2 hours of manual triage every shift.",
  },
  {
    id: "C/02",
    initial: "R",
    name: "Remedy's Rx Pharmacy",
    role: "Legacy POS modernization · inventory automation",
    desc: "Refactored Angular POS workflow, cutting checkout from 5 to 3 steps. Automated weekly inventory reconciliation in Python + SQL.",
    metric: "25%",
    metricL: "faster checkout",
    story: "Trimmed checkout from 5 steps to 3 and automated weekly inventory reconciliation in Python + SQL.",
  },
];

// ───────────────────────────────────────────────────────────────
// HOME
// ───────────────────────────────────────────────────────────────
function HomePage({ heroVariant, setRoute }) {
  return (
    <div className="page-enter">
      <Section num="01" label="Index · /home" style={{ marginBottom: 64 }}>
        {heroVariant === "manifesto" && <HeroManifesto setRoute={setRoute} />}
        {heroVariant === "spatial" && <HeroSpatial setRoute={setRoute} />}
        {heroVariant === "telemetry" && <HeroTelemetry setRoute={setRoute} />}
      </Section>

      <Marquee items={[
        "React", "TypeScript", "Spring Boot", "FastAPI", "PostGIS",
        "Three.js", "Gemini API", "MediaPipe", "AWS", "Cloudflare",
        "Computer Vision", "AI Agents", "Geospatial", "Full-stack",
      ]} />

      <Section num="02" label="Selected work · /projects">
        <div className="featured-grid">
          {FEATURED_PROJECTS.map((p) => (
            <article key={p.id} className="project-card" data-cursor="hover">
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
          <button className="btn ghost" onClick={() => setRoute("projects")} data-cursor="hover">
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

// HERO — Manifesto variant (split: text left, live 3D right)
function HeroManifesto({ setRoute }) {
  const heroRef = React.useRef(null);

  // Entrance reveal — driven by rAF (CSS animations/transitions strand in this
  // runtime). Base state is visible; we hide synchronously then animate in, with
  // a hard fallback that clears all inline styles so it can never stay blank.
  React.useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll(".rv"));
    const clear = () => items.forEach((it) => { it.style.opacity = ""; it.style.transform = ""; it.style.willChange = ""; });
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
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
        if (isGallery(it)) {
          it.style.transform = `translateY(${(22 * (1 - e)).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(3)})`;
        } else {
          it.style.transform = `translateY(${(16 * (1 - e)).toFixed(2)}px)`;
        }
      }
      if (done) { clear(); } else { raf = requestAnimationFrame(loop); }
    };
    raf = requestAnimationFrame(loop);
    const fallback = setTimeout(clear, 2200); // guarantee visible no matter what
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); clear(); };
  }, []);

  // Cursor-reactive parallax across the whole hero (smoothed). Teases hand-control.
  React.useEffect(() => {
    const el = heroRef.current;
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
          I'm Aziz — I build computer-vision pipelines, agentic LLM systems,
          and 3D experiences that ship to real users.
        </p>
        <div className="hero-cta rv" data-d="0.48">
          <button className="btn" onClick={() => setRoute("projects")} data-cursor="hover">
            View work <span className="arr">→</span>
          </button>
          <button className="btn ghost" onClick={() => setRoute("contact")} data-cursor="hover">
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
          <Gallery3D hero />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 3D MODEL GALLERY (Home / Manifesto hero)
// ───────────────────────────────────────────────────────────────
const GALLERY_OBJECTS = [
  {
    id: "e46",
    label: "BMW E46",
    code: "OBJ/01",
    tag: "MyE46 · React Three Fiber",
    note: "The car I keep rebuilding in code because I can't (yet) afford to in the driveway.",
    art: "car",
  },
  {
    id: "hand",
    label: "hand mesh",
    code: "OBJ/02",
    tag: "ASL Hand Coach · MediaPipe",
    note: "21 keypoints per frame — the same mesh that'll one day let you steer this page.",
    art: "hand",
  },
  {
    id: "terrain",
    label: "terrain",
    code: "OBJ/03",
    tag: "HiddenHooks · PostGIS",
    note: "100K+ Ontario water bodies, flattened into a heightfield I can actually reason about.",
    art: "terrain",
  },
  {
    id: "graph",
    label: "agent graph",
    code: "OBJ/04",
    tag: "Debug pipeline · Gemini",
    note: "Three agents passing a bug between them until one of them finally admits it's the bug.",
    art: "graph",
  },
];

function Gallery3D({ hero }) {
  // E46 is always the featured/default object; the 3 thumbnails select the
  // "other" objects. Clicking the active thumbnail again returns to the E46.
  const [active, setActive] = React.useState("e46");
  const obj = GALLERY_OBJECTS.find((o) => o.id === active) || GALLERY_OBJECTS[0];
  const thumbs = GALLERY_OBJECTS.filter((o) => o.id !== "e46");
  const stageRef = React.useRef(null);
  const objRef = React.useRef(null);
  const hoverRef = React.useRef(false);
  const tiltRef = React.useRef({ x: -8, y: 0 });

  // Continuous, living motion: a gentle auto-sway when idle; mouse takes over on hover.
  React.useEffect(() => {
    let raf;
    const loop = (t) => {
      if (!hoverRef.current) {
        const yaw = Math.sin(t / 2200) * 20;          // ±20° sway (flat art never goes edge-on)
        const pitch = -8 + Math.cos(t / 2700) * 3.5;  // subtle bob
        tiltRef.current = { x: pitch, y: yaw };
      }
      const el = objRef.current;
      if (el) el.style.transform = `rotateX(${tiltRef.current.x.toFixed(2)}deg) rotateY(${tiltRef.current.y.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e) => {
    hoverRef.current = true;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    tiltRef.current = { x: -dy * 12 - 4, y: dx * 24 };
  };
  const onLeave = () => { hoverRef.current = false; };
  const pick = (id) => setActive((cur) => (cur === id ? "e46" : id));

  return (
    <div className={`gallery3d-wrap ${hero ? "in-hero" : ""}`} style={{ marginTop: hero ? 0 : 8 }}>
      {!hero && (
        <div className="section-label" data-num="G/01" style={{ marginBottom: 18 }}>Gallery · /3D-index</div>
      )}

      <div className="gallery3d">
        {/* Featured 3D viewport */}
        <div
          className="g3d-viewport"
          ref={stageRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          data-cursor="hover"
        >
          <span className="g3d-corner tl" />
          <span className="g3d-corner tr" />
          <span className="g3d-corner bl" />
          <span className="g3d-corner br" />

          <div className="g3d-readout">
            <div>{obj.code} · {obj.label}</div>
            <div className="dim">render: webgl · 60fps</div>
          </div>
          <div className="g3d-axis">x · y · z</div>

          <div className="g3d-stage">
            <div className="g3d-object" ref={objRef}>
              <GalleryArt kind={obj.art} />
            </div>
            <div className="g3d-shadow" />
          </div>

          <div className="g3d-affordance">drag to rotate · pinch to zoom</div>
        </div>

        {/* Row of 3 thumbnail indicators for the other objects */}
        <div className="g3d-thumbs">
          {thumbs.map((o) => (
            <button
              key={o.id}
              className="g3d-thumb"
              data-active={active === o.id ? "1" : "0"}
              onClick={() => pick(o.id)}
              data-cursor="hover"
            >
              <div className="g3d-thumb-art"><GalleryArt kind={o.art} mini /></div>
              <span>{o.label}</span>
            </button>
          ))}
        </div>

        {/* Memory core caption */}
        <div className="memory-core">
          <div className="mc-head">
            <span className="mc-dot" />
            memory core · {obj.code} · {obj.label}
          </div>
          <p className="mc-note">{obj.note}</p>
          <div className="mc-tag">{obj.tag}</div>
        </div>
      </div>
    </div>
  );
}

// Schematic HUD-style line art for each gallery object
function GalleryArt({ kind, mini }) {
  const stroke = mini ? 1.4 : 1.6;
  const common = { fill: "none", stroke: "var(--accent)", strokeWidth: stroke, strokeLinejoin: "round", strokeLinecap: "round" };
  const faint = { ...common, stroke: "var(--line-strong)", strokeWidth: stroke * 0.7 };

  if (kind === "car") {
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          <path d="M20 92 L180 92 M40 100 L160 100" />
        </g>
        <g {...common}>
          <path d="M28 78 L44 78 L62 54 L132 54 L154 78 L172 78 L172 86 L28 86 Z" />
          <path d="M62 54 L72 70 L128 70 L138 54" />
          <path d="M96 54 L96 70" {...faint} />
          <circle cx="60" cy="86" r="13" />
          <circle cx="60" cy="86" r="5" />
          <circle cx="142" cy="86" r="13" />
          <circle cx="142" cy="86" r="5" />
          <path d="M28 80 L40 80 M160 80 L172 80" />
        </g>
      </svg>
    );
  }
  if (kind === "hand") {
    const pts = [[100,96],[72,82],[56,60],[48,40],[44,22],[78,70],[74,42],[72,22],[72,6],[96,68],[98,40],[100,20],[100,4],[116,70],[122,44],[126,26],[128,12],[134,76],[146,58],[154,46],[160,36]];
    const bones = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          {bones.map((b, i) => (
            <line key={i} x1={pts[b[0]][0]} y1={pts[b[0]][1]} x2={pts[b[1]][0]} y2={pts[b[1]][1]} />
          ))}
        </g>
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={mini ? 2 : 2.6} fill="var(--accent)" stroke="none" />
        ))}
      </svg>
    );
  }
  if (kind === "terrain") {
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...common}>
          {[0,1,2,3,4].map((r) => (
            <path key={r} d={`M16 ${50 + r * 12} L60 ${30 + r * 12} L100 ${46 + r * 12} L140 ${26 + r * 12} L184 ${44 + r * 12}`} />
          ))}
        </g>
        <g {...faint}>
          {[0,1,2,3,4,5].map((c) => (
            <line key={c} x1={16 + c * 33.6} y1={50 - c * 0} x2={16 + c * 33.6} y2={98} opacity="0.5" />
          ))}
        </g>
      </svg>
    );
  }
  // graph
  const nodes = [[40,30],[100,18],[160,38],[30,86],[92,72],[150,92],[112,108]];
  const edges = [[0,1],[1,2],[0,3],[0,4],[1,4],[2,5],[4,5],[4,6],[3,6],[5,6]];
  return (
    <svg viewBox="0 0 200 120" className="g3d-svg">
      <g {...faint}>
        {edges.map((e, i) => (
          <line key={i} x1={nodes[e[0]][0]} y1={nodes[e[0]][1]} x2={nodes[e[1]][0]} y2={nodes[e[1]][1]} />
        ))}
      </g>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n[0]} cy={n[1]} r={mini ? 4 : 6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={stroke} />
          <circle cx={n[0]} cy={n[1]} r={mini ? 1.6 : 2.4} fill="var(--accent)" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

// HERO — Spatial Grid variant
function HeroSpatial({ setRoute }) {
  return (
    <div className="hero" style={{ gap: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "end" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>SOFTWARE ENGINEER · SCARBOROUGH, ON</div>
          <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 108px)" }}>
            Aziz <em>Syed</em>.
          </h1>
          <p className="body-l" style={{ marginTop: 24 }}>
            Engineer working across full-stack, computer vision, and AI
            agents. Currently studying at Ontario Tech, freelancing for two
            small businesses, and prototyping hand-tracked web interfaces.
          </p>
        </div>
        <div className="spatial-grid">
          <SpatialTile style={{ left: "5%", top: "10%", width: 230 }}
            depth={1.2} num="P/01" title="Projects by the Projects" tag="Spring Boot · React" />
          <SpatialTile style={{ left: "42%", top: "0%", width: 200 }}
            depth={0.5} num="P/02" title="MyE46" tag="React Three Fiber" />
          <SpatialTile style={{ left: "0%", top: "58%", width: 210 }}
            depth={0.8} num="P/03" title="ASL Hand Coach" tag="MediaPipe" />
          <SpatialTile style={{ left: "48%", top: "44%", width: 220 }}
            depth={1.5} num="P/04" title="HiddenHooks" tag="PostGIS · FastAPI" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn" onClick={() => setRoute("projects")} data-cursor="hover">
          Explore work <span className="arr">→</span>
        </button>
        <button className="btn ghost" onClick={() => setRoute("about")} data-cursor="hover">
          About me
        </button>
      </div>
      <div className="hero-meta-row">
        <div className="hero-stat"><div className="v">600+</div><div className="l">Users week one (MyE46)</div></div>
        <div className="hero-stat"><div className="v">100K+</div><div className="l">Waterbodies indexed</div></div>
        <div className="hero-stat"><div className="v">21</div><div className="l">Hand keypoints / frame</div></div>
      </div>
    </div>
  );
}

// HERO — Telemetry variant
function HeroTelemetry({ setRoute }) {
  return (
    <div className="hero">
      <div className="eyebrow">/telemetry · Aziz Syed · session-2026.05</div>
      <div className="telemetry">
        <div>
          <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 104px)" }}>
            Engineer<br />in <em>motion</em>.
          </h1>
          <p className="body-l" style={{ marginTop: 24 }}>
            I'm Aziz. Below is a live readout of what I've been building
            and what I've been good at. Mostly full-stack, AI agents, and
            real-time ML in the browser. Click anything to dig in.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setRoute("projects")} data-cursor="hover">
              View work <span className="arr">→</span>
            </button>
            <button className="btn ghost" onClick={() => setRoute("contact")} data-cursor="hover">
              Hire me
            </button>
          </div>
        </div>
        <div className="telem-panel">
          <div className="telem-row">
            <span className="k">React / TS</span>
            <span className="bar"><i style={{ width: "92%" }} /></span>
            <span className="v">0.92</span>
          </div>
          <div className="telem-row">
            <span className="k">Spring Boot</span>
            <span className="bar"><i style={{ width: "88%" }} /></span>
            <span className="v">0.88</span>
          </div>
          <div className="telem-row">
            <span className="k">PostGIS</span>
            <span className="bar"><i style={{ width: "76%" }} /></span>
            <span className="v">0.76</span>
          </div>
          <div className="telem-row">
            <span className="k">Three.js</span>
            <span className="bar"><i style={{ width: "82%" }} /></span>
            <span className="v">0.82</span>
          </div>
          <div className="telem-row">
            <span className="k">AI agents</span>
            <span className="bar"><i style={{ width: "85%" }} /></span>
            <span className="v">0.85</span>
          </div>
          <div className="telem-row">
            <span className="k">MediaPipe</span>
            <span className="bar"><i style={{ width: "80%" }} /></span>
            <span className="v">0.80</span>
          </div>
          <div className="telem-row">
            <span className="k">AWS / Azure</span>
            <span className="bar"><i style={{ width: "78%" }} /></span>
            <span className="v">0.78</span>
          </div>
          <div style={{ marginTop: 16, position: "relative" }}>
            <div className="radar">
              <div className="radar-blip" style={{ left: "30%", top: "40%" }} />
              <div className="radar-blip" style={{ left: "62%", top: "55%", animationDelay: "0.5s" }} />
              <div className="radar-blip" style={{ left: "48%", top: "25%", animationDelay: "1.1s" }} />
              <div className="radar-blip" style={{ left: "70%", top: "70%", animationDelay: "1.6s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// ABOUT
// ───────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div className="page-enter">
      <Section num="02" label="About · /aziz">
        <h2 className="display" style={{ fontSize: "clamp(56px, 9vw, 132px)", marginBottom: 56 }}>
          Hi — I'm <em>Aziz</em>.
        </h2>
        <div className="about-grid">
          <div className="photo-cluster">
            <figure className="photo-file pf-1">
              <image-slot id="about-portrait" shape="rect" placeholder="Drop portrait" style={{ display: "block" }}></image-slot>
              <figcaption>PORTRAIT.JPG</figcaption>
            </figure>
            <figure className="photo-file pf-2">
              <image-slot id="about-setup" shape="rect" placeholder="Drop photo" style={{ display: "block" }}></image-slot>
              <figcaption>SETUP.JPG</figcaption>
            </figure>
            <figure className="photo-file pf-3">
              <image-slot id="about-drive" shape="rect" placeholder="Drop photo" style={{ display: "block" }}></image-slot>
              <figcaption>DRIVE.JPG</figcaption>
            </figure>
            <figure className="photo-file pf-4">
              <image-slot id="about-outdoors" shape="rect" placeholder="Drop photo" style={{ display: "block" }}></image-slot>
              <figcaption>OUTDOORS.JPG</figcaption>
            </figure>
            <figure className="photo-file pf-5">
              <image-slot id="about-hobbies" shape="rect" placeholder="Drop photo" style={{ display: "block" }}></image-slot>
              <figcaption>HOBBIES.JPG</figcaption>
            </figure>
            <figure className="photo-file pf-6">
              <image-slot id="about-sports" shape="rect" placeholder="Drop photo" style={{ display: "block" }}></image-slot>
              <figcaption>SPORTS.JPG</figcaption>
            </figure>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <p className="lede">
              I'm a software engineer based in Scarborough, ON. I like
              building things that ship — not just demos.
            </p>
            <p className="body-l">
              Right now I'm a Computer Science (Honours) student at Ontario
              Tech University, finishing up a Software Engineering Technology
              advanced diploma at Centennial College where I've been an
              Honours Scholar at a 4.30/4.5 GPA. Outside of school I freelance
              for small businesses, intern in software, and build my own things
              on the side.
            </p>
            <p className="body-l">
              The work I'm most proud of sits at the intersection of full-stack
              engineering and something a little weirder — agentic LLM pipelines
              that catch bugs in PRs, real-time hand tracking in the browser,
              3D car configurators that don't melt your GPU, a PostGIS engine
              ranking 100,000+ Ontario water bodies for where the fish probably are.
            </p>
            <p className="body-l">
              I'm currently working on adding optional hand-tracking control to
              this site — point at things from across the room and the page
              responds. Tony Stark, but smaller scope and on a student budget.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <a className="btn" href="uploads/Aziz_Syed_Resume.pdf" download data-cursor="hover">
                Download résumé <span className="arr">↓</span>
              </a>
              <a className="btn ghost" href="https://linkedin.com/in/azizsyed27" target="_blank" rel="noreferrer" data-cursor="hover">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section num="03" label="Trajectory · /experience">
        <div className="timeline">
          <TimelineItem
            when="May 2025 – Aug 2025"
            what="Software Engineer Intern"
            where="TheCodeCrackers Inc · Vaughan, ON"
            desc="3-agent AI debugging pipeline. Postman test plans across 2,000+ REST APIs. Jira API integration for end-to-end defect tracking."
            defaultOpen
            details={[
              "Designed a 3-agent debug pipeline (triage → reproduce → patch) that surfaced 150+ production defects before release.",
              "Authored Postman test plans covering 2,000+ REST endpoints, wired into CI for automated regression gating.",
              "Integrated the Jira API for end-to-end defect tracking, from detection through resolution.",
            ]}
          />
          <TimelineItem
            when="Jan 2025 – Present"
            what="Chief Technology Officer"
            where="Projects by the Projects · Community Nonprofit"
            desc="Technical planning, platform direction, supporter onboarding strategy."
            details={[
              "Own the technical roadmap and platform direction for the nonprofit.",
              "Designed supporter onboarding from sign-up through first donation.",
            ]}
          />
          <TimelineItem
            when="May 2023 – Present"
            what="Technical Customer Service Rep"
            where="Able I.T Solutions · Scarborough, ON"
            desc="AI ticket-triage agent. 92% resolution rate across 20-40 daily client issues."
            details={[
              "Built an AI ticket-triage agent that ranks issues by severity with auto-synopses.",
              "Held a 92% resolution rate across 20–40 daily client issues.",
            ]}
          />
          <TimelineItem
            when="Feb 2022 – May 2023"
            what="Junior Developer"
            where="Remedy's Rx Pharmacy · Scarborough, ON"
            desc="Modernized Angular POS workflow. Python + SQL inventory automation across 1,000+ weekly transactions."
            details={[
              "Refactored the Angular POS flow, cutting checkout from 5 steps to 3.",
              "Automated weekly inventory reconciliation across 1,000+ transactions in Python + SQL.",
            ]}
          />
        </div>
      </Section>

      <Section num="04" label="Education · /school">
        <div className="timeline">
          <TimelineItem when="Sep 2025 – May 2027" what="B.Sc Computer Science (Honours)" where="Ontario Tech University · Oshawa, ON" desc="Data Structures & Algorithms, System Design, Computer Networks, Database Systems." />
          <TimelineItem when="Jan 2023 – Dec 2025" what="Software Engineering Technology — Advanced Diploma" where="Centennial College · Scarborough, ON" desc="Honours Scholar · GPA 4.30/4.5." />
        </div>
      </Section>
    </div>
  );
}

function TimelineItem({ when, what, where, desc, details, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const hasDetails = Array.isArray(details) && details.length > 0;
  return (
    <div className="timeline-item" data-open={open && hasDetails ? "1" : "0"}>
      <div
        className={`ti-head ${hasDetails ? "expandable" : ""}`}
        onClick={hasDetails ? () => setOpen((v) => !v) : undefined}
        data-cursor={hasDetails ? "hover" : undefined}
      >
        <div style={{ flex: 1 }}>
          <div className="when">{when}</div>
          <div className="what">{what}</div>
          <div className="where">{where}</div>
        </div>
        {hasDetails && (
          <span className="ti-toggle" aria-hidden="true">{open ? "–" : "+"}</span>
        )}
      </div>
      {desc && <p className="body-l" style={{ marginTop: 8, fontSize: 14 }}>{desc}</p>}
      {hasDetails && (
        <div className="ti-detail" data-open={open ? "1" : "0"}>
          <div className="ti-detail-inner">
            <div className="ti-detail-label">Highlights</div>
            <ul className="ti-detail-list">
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function useTypewriter(text) {
  const [typed, setTyped] = React.useState("");
  const [active, setActive] = React.useState(false);
  const timer = React.useRef(null);
  const start = () => {
    setActive(true);
    let i = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(timer.current);
    }, 16);
  };
  const stop = () => {
    clearInterval(timer.current);
    setActive(false);
    setTyped("");
  };
  React.useEffect(() => () => clearInterval(timer.current), []);
  return { typed, active, start, stop };
}

function CapCard({ c }) {
  const { typed, active, start, stop } = useTypewriter(c.story || "");

  return (
    <div className="cap" onMouseEnter={start} onMouseLeave={stop} data-cursor="hover">
      <div className="cap-h">
        <h3>{c.title}</h3>
        <span className="cap-num">{c.num}</span>
      </div>
      <p className="cap-desc">{c.desc}</p>
      <div className="cap-tags">
        {c.tags.map((t, i) => <span key={i}>{t}</span>)}
      </div>
      <div className="cap-more">
        <div className="cap-more-inner">
          <div className="cap-more-label">Outcome</div>
          <p className="cap-more-line">
            {typed}
            <span className="type-caret" data-on={active ? "1" : "0"} />
          </p>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ c }) {
  const { typed, active, start, stop } = useTypewriter(c.story || "");

  return (
    <div className="client-card" onMouseEnter={start} onMouseLeave={stop} data-cursor="hover">
      <div className="logo">{c.initial}</div>
      <div className="client-body">
        <h4>{c.name}</h4>
        <div className="eyebrow" style={{ marginTop: 6 }}>{c.role}</div>
        <p>{c.desc}</p>
        <div className="cap-more">
          <div className="cap-more-inner">
            <div className="cap-more-label">Outcome</div>
            <p className="cap-more-line">
              {typed}
              <span className="type-caret" data-on={active ? "1" : "0"} />
            </p>
          </div>
        </div>
      </div>
      <div className="stat">
        <b>{c.metric}</b>{c.metricL}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// SERVICES
// ───────────────────────────────────────────────────────────────
function ServicesPage() {
  return (
    <div className="page-enter">
      <Section num="03" label="Services · /capabilities">
        <HeroBand right={<CapabilityRadar />}>
          <h2 className="display rv" data-d="0.05" style={{ fontSize: "clamp(48px, 6.5vw, 104px)", marginBottom: 24 }}>
            What I <em>do</em>.
          </h2>
          <p className="lede rv" data-d="0.16" style={{ marginBottom: 0 }}>
            A snapshot of where I'm sharpest — full-stack engineering,
            AI agents, computer vision, and the messy infrastructure
            between them.
          </p>
        </HeroBand>
        <div className="cap-grid" style={{ marginTop: 8 }}>
          {CAPABILITIES.map((c) => <CapCard key={c.num} c={c} />)}
        </div>
      </Section>

      <Section num="04" label="Client work · /freelance">
        <h3 className="display" style={{ fontSize: "clamp(40px, 5vw, 72px)", marginBottom: 24 }}>
          For small businesses,<br /><em>built carefully</em>.
        </h3>
        <p className="body-l" style={{ marginBottom: 40 }}>
          I take a small number of freelance projects per year — typically
          for businesses who need their existing software to actually work,
          or who want one new automation that pays for itself in saved hours.
        </p>
        <div>
          {CLIENTS.map((c) => <ClientCard key={c.id} c={c} />)}
        </div>
      </Section>

      <Section num="05" label="Stack · /tools">
        <p className="lede" style={{ marginBottom: 24 }}>
          Day-to-day tools I'm comfortable in — grab one to see where it ships.
        </p>
        <StackConstellation />
      </Section>
    </div>
  );
}

function StackBlock({ label, items }) {
  return (
    <div style={{ borderTop: "0.5px solid var(--line-strong)", paddingTop: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "var(--f-mono)", fontSize: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 10 }}>
            <span style={{ color: "var(--accent)" }}>{String(i + 1).padStart(2, "0")}</span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// PROJECTS
// ───────────────────────────────────────────────────────────────
function ProjectsPage() {
  return (
    <div className="page-enter">
      <Section num="04" label="Work · /index">
        <HeroBand right={<ProjectFlipBoard />}>
          <h2 className="display rv" data-d="0.05" style={{ fontSize: "clamp(48px, 6.5vw, 104px)", marginBottom: 24 }}>
            Selected <em>work</em>.
          </h2>
          <p className="lede rv" data-d="0.16" style={{ marginBottom: 0 }}>
            A mix of things I've shipped to real users, things I've built
            for school, and things I built because I couldn't stop thinking
            about them.
          </p>
        </HeroBand>
        <div className="featured-grid" style={{ marginTop: 8 }}>
          {FEATURED_PROJECTS.map((p) => <ProjectCardTilt key={p.id} p={p} />)}
        </div>
      </Section>

      <Section num="05" label="Additional · /archive">
        <div>
          {OTHER_PROJECTS.map((p, i) => (
            <ArchiveRow key={i} p={p} defaultOpen={p.title === "GymNet"} />
          ))}
        </div>
      </Section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// WORK PAGE — tilt card + expandable archive row variants
// ───────────────────────────────────────────────────────────────
function ProjectCardTilt({ p }) {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform =
      `perspective(900px) translateY(-8px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
  };
  const onEnter = () => setHover(true);
  const onLeave = () => {
    setHover(false);
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <article
      ref={ref}
      className="project-card project-card--tilt"
      data-cursor="hover"
      data-hover={hover ? "1" : "0"}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="pc-codebadge">{p.num}</div>
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
      {p.exploded && (
        <a
          className="pc-explode"
          href={p.exploded}
          data-cursor="hover"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="pc-explode-icon" aria-hidden="true">⊹</span>
          Exploded view
          <span className="pc-explode-arr">→</span>
        </a>
      )}
    </article>
  );
}

function ArchiveRow({ p, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div
      className="project-row archive-row"
      data-cursor="hover"
      data-open={open ? "1" : "0"}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="pr-num">P/{p.num}</span>
      <div>
        <div className="pr-title">{p.title}</div>
        <div className="eyebrow" style={{ marginTop: 6 }}>{p.note}</div>
        {p.extra && (
          <div className="ar-extra">
            <div className="ar-extra-inner">{p.extra}</div>
          </div>
        )}
      </div>
      <span className="pr-tags">{p.tags}</span>
      <span className="pr-arrow">→</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// CONTACT
// ───────────────────────────────────────────────────────────────
function ContactPage() {
  const [sent, setSent] = React.useState(false);
  return (
    <div className="page-enter">
      <Section num="05" label="Contact · /reach-out">
        <HeroBand right={<ContactBeacon />}>
          <h2 className="display rv" data-d="0.05" style={{ fontSize: "clamp(48px, 7vw, 116px)", marginBottom: 28 }}>
            Let's <em>talk</em>.
          </h2>
          <p className="lede rv" data-d="0.16" style={{ marginBottom: 0 }}>
            Roles, freelance, collaborations, hand-tracking nerdery —
            whatever it is, I'd love to hear about it. Fastest reply is
            email or LinkedIn.
          </p>
        </HeroBand>

        <div className="contact-grid" style={{ marginTop: 8 }}>
          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="contact-field">
              <label>01 · Name</label>
              <input type="text" placeholder="Your name" required />
            </div>
            <div className="contact-field">
              <label>02 · Email</label>
              <input type="email" placeholder="hi@yourdomain.com" required />
            </div>
            <div className="contact-field">
              <label>03 · What's on your mind</label>
              <textarea rows="4" placeholder="A few sentences is plenty…" required />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button type="submit" className="btn" data-cursor="hover">
                Send <span className="arr">→</span>
              </button>
              {sent && (
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  · Message queued. I'll reply within a day.
                </span>
              )}
            </div>
          </form>

          <div>
            <div className="contact-detail">
              <div className="label">Email</div>
              <div className="value"><a href="mailto:azizsyed2016@gmail.com" data-cursor="hover">azizsyed2016@gmail.com</a></div>
            </div>

            <div className="contact-detail">
              <div className="label">Where</div>
              <div className="value">Scarborough, Ontario · Canada</div>
            </div>
            <div className="contact-detail">
              <div className="label">Online</div>
              <div className="value" style={{ display: "flex", gap: 18, fontSize: 18, flexWrap: "wrap" }}>
                <a href="https://github.com/AzizSyed27" target="_blank" rel="noreferrer" data-cursor="hover">github</a>
                <a href="https://linkedin.com/in/azizsyed27" target="_blank" rel="noreferrer" data-cursor="hover">linkedin</a>
                <a href="https://azizsyed.ca" target="_blank" rel="noreferrer" data-cursor="hover">azizsyed.ca</a>
              </div>
            </div>
            <div style={{ marginTop: 32, padding: 18, border: "0.5px dashed var(--line-strong)", borderRadius: 8 }}>
              <div className="eyebrow" style={{ marginBottom: 8, color: "var(--accent)" }}>↑ COMING SOON</div>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 22, lineHeight: 1.2 }}>
                Hand-tracking mode lets you navigate this whole site without touching the keyboard.
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// LOG — terminal-styled build journal
// ───────────────────────────────────────────────────────────────
const LOG_ENTRIES = [
  {
    when: "2026.05.28",
    tag: "shipped",
    title: "Theme Select pill",
    body: "Added an 8-palette switcher to the top bar. The pill's swatch reflects the active theme, and the whole site recolors on tap.",
  },
  {
    when: "2026.05.21",
    tag: "built",
    title: "Exploded project views",
    body: "Broke MyE46 and three other projects into floating, leader-lined layers in the blue/black hand-mode theme. Cursor parallax does the rest.",
  },
  {
    when: "2026.05.14",
    tag: "learned",
    title: "Flexbox shrink bites back",
    body: "Lost an hour to a stat value overlapping its label — flex-shrink let the box collapse under its own text. Stacking beat fighting the flexbox.",
  },
  {
    when: "2026.05.06",
    tag: "broke",
    title: "GPU on fire",
    body: "MyE46 pinned the GPU at 90% under a 200-user load test. Adaptive LOD pulled it back down to a calm 15–30%.",
  },
  {
    when: "2026.04.27",
    tag: "shipped",
    title: "HiddenHooks v1",
    body: "A PostGIS engine ranking 100K+ Ontario water bodies went live behind FastAPI, with a Mapbox front end. 3GB of geospatial data, finally queryable.",
  },
  {
    when: "2026.04.15",
    tag: "learned",
    title: "Sub-200ms in the browser",
    body: "Got the ASL hand classifier under 200ms per frame by trimming the landmark regressor and warming the CNN once on load instead of per-inference.",
  },
  {
    when: "2026.04.02",
    tag: "shipped",
    title: "$50K milestone",
    body: "Projects by the Projects crossed $50K in processed donations at a 99.6% payment success rate. Quietly, in production, for months.",
  },
  {
    when: "2026.03.20",
    tag: "broke",
    title: "Stripe webhook race",
    body: "A duplicate webhook double-counted a donation in staging. Idempotency keys caught it well before it could ever reach prod.",
  },
];

function LogPage() {
  return (
    <div className="page-enter">
      <Section num="06" label="Log · /build-journal">
        <div className="log-hero">
          <h2 className="display" style={{ fontSize: "clamp(56px, 9vw, 132px)", margin: 0 }}>
            Build <em>log</em>.
          </h2>
          <p className="lede" style={{ margin: 0 }}>
            A running tail of what I've shipped, learned, or broken lately.
          </p>
        </div>

        <div className="terminal">
          <div className="terminal-head">
            <span className="terminal-dots"><i /><i /><i /></span>
            <span className="terminal-title">aziz@portfolio: ~/build-journal — log --tail</span>
          </div>
          <div className="terminal-body">
            {LOG_ENTRIES.map((e, i) => (
              <div key={i} className="log-entry">
                <div className="log-meta">
                  <div className="log-when">{e.when}</div>
                  <span className={`log-tag tag-${e.tag}`}>{e.tag}</span>
                </div>
                <div className="log-main">
                  <div className="log-title">
                    <span className="log-prompt">›</span> {e.title}
                  </div>
                  <p className="log-body">{e.body}</p>
                </div>
              </div>
            ))}
            <div className="log-tailline">
              <span className="log-prompt">$</span> tail -f build-journal.log<span className="log-cursor" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, { HomePage, AboutPage, ServicesPage, ProjectsPage, ContactPage, LogPage, Gallery3D, GalleryArt });
