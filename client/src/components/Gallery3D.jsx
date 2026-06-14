import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SCENE_PRESETS } from "../three/scenePresets";
import { useMode } from "../mode/ModeProvider";

const GalleryScene = lazy(() =>
  import("../three/GalleryScene").then((m) => ({ default: m.GalleryScene })),
);

const GALLERY_OBJECTS = [
  {
    id: "coding", modelId: "coding",
    label: "coding", code: "OBJ/06",
    tag: "This site · you are here",
    note: "Me, mid-commit — the animated one, because this is the state you'll most reliably find me in. Everything else in this gallery got built from this chair.",
    art: "coding",
  },
  {
    id: "e46", modelId: "e46",
    label: "BMW E46", code: "OBJ/01",
    tag: "MyE46 · React Three Fiber",
    note: "The car I keep rebuilding in code because I can't (yet) afford to in the driveway.",
    art: "car",
  },
  {
    id: "fisherboy", modelId: "fisherboy",
    label: "fisherboy", code: "OBJ/02",
    tag: "HiddenHooks · PostGIS",
    note: "Me, with a fishing rod. The why behind HiddenHooks — 100,000 water bodies and one very specific question.",
    art: "person",
  },
  {
    id: "court", modelId: "court",
    label: "basketball court", code: "OBJ/04",
    tag: "Personal · the ballast",
    note: "The reason I leave the desk and the reason I come back to it sharper. Sports have carried weight in my life as long as the code has — they're the thing that keeps the rest in proportion.",
    art: "court",
  },
  {
    id: "cat", modelId: "cat",
    label: "cat", code: "OBJ/05",
    tag: "Personal · the co-pilot",
    note: "My cat, in PS1-era polygons — out of respect for a creature who has never once respected a deadline. The original rubber-duck debugger, if the duck judged you.",
    art: "cat",
  },
  {
    id: "forest", modelId: "forest",
    label: "forest", code: "OBJ/03",
    tag: "HiddenHooks · trip planner",
    note: "Trails, not parking lots. HiddenHooks plans a hike to every fishing spot — built because I'd rather walk to the water with friends than drive to it.",
    art: "forest",
  },
];

export function Gallery3D({ hero = false }) {
  const { handState } = useMode();
  const handLive = handState === "live"; // perf gate: shed GPU for the tracker
  const [active, setActive] = useState(GALLERY_OBJECTS[0].id);
  const obj = GALLERY_OBJECTS.find((o) => o.id === active) || GALLERY_OBJECTS[0];
  const stageRef = useRef(null);
  const objRef = useRef(null);
  const hoverRef = useRef(false);
  const tiltRef = useRef({ x: -8, y: 0 });
  const stripRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: GALLERY_OBJECTS.length > 3 });

  const recomputeEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      left: el.scrollLeft > 1,
      right: el.scrollLeft < max - 1,
    });
  }, []);

  useLayoutEffect(() => {
    recomputeEdges();
    const el = stripRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => recomputeEdges());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recomputeEdges]);

  const scrollByStep = (dir) => {
    const el = stripRef.current;
    if (!el) return;
    const firstThumb = el.querySelector(".g3d-thumb");
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 14;
    const step = (firstThumb?.getBoundingClientRect().width || el.clientWidth / 3) + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const is3D = !!obj.modelId;

  // CSS auto-sway for SVG variants. Skip writes when the R3F canvas is mounted
  // — OrbitControls owns rotation in that case and a CSS transform on the
  // wrapper would rotate the whole canvas as a DOM element.
  useEffect(() => {
    let raf;
    const loop = (t) => {
      if (!is3D) {
        if (!hoverRef.current) {
          const yaw = Math.sin(t / 2200) * 20;
          const pitch = -8 + Math.cos(t / 2700) * 3.5;
          tiltRef.current = { x: pitch, y: yaw };
        }
        const el = objRef.current;
        if (el) el.style.transform = `rotateX(${tiltRef.current.x.toFixed(2)}deg) rotateY(${tiltRef.current.y.toFixed(2)}deg)`;
      } else {
        const el = objRef.current;
        if (el && el.style.transform) el.style.transform = "";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [is3D]);

  const onMove = (e) => {
    if (is3D) return; // OrbitControls handles pointer when canvas is active
    hoverRef.current = true;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    tiltRef.current = { x: -dy * 12 - 4, y: dx * 24 };
  };
  const onLeave = () => { hoverRef.current = false; };
  const pick = (id) => setActive(id);

  return (
    <div className={`gallery3d-wrap ${hero ? "in-hero" : ""}`} style={{ marginTop: hero ? 0 : 8 }}>
      {!hero && (
        <div className="section-label" data-num="G/01" style={{ marginBottom: 18 }}>Gallery · /3D-index</div>
      )}
      <div className="gallery3d">
        <div className="g3d-viewport" ref={stageRef} onMouseMove={onMove} onMouseLeave={onLeave} data-cursor="hover">
          <span className="g3d-corner tl" />
          <span className="g3d-corner tr" />
          <span className="g3d-corner bl" />
          <span className="g3d-corner br" />
          <div className="g3d-readout">
            <div>{obj.code} · {obj.label}</div>
            <div className="dim">render: webgl · 60fps</div>
          </div>
          <div className="g3d-axis">x · y · z</div>
          <div
            className="g3d-stage"
            style={is3D ? { position: "absolute", inset: 0, width: "auto", height: "auto", maxWidth: "none", minWidth: 0 } : undefined}
          >
            <div className="g3d-object" ref={objRef} style={is3D ? { position: "absolute", inset: 0 } : undefined}>
              {is3D ? (
                <Suspense fallback={null}>
                  <GalleryScene preset={SCENE_PRESETS[obj.modelId]} live={handLive} />
                </Suspense>
              ) : (
                <GalleryArt kind={obj.art} />
              )}
            </div>
            {!is3D && <div className="g3d-shadow" />}
          </div>
          <div className="g3d-affordance">drag to rotate · pinch to zoom</div>
        </div>
        <div className="g3d-thumb-row">
          <button
            className="g3d-thumb-arrow prev"
            onClick={() => scrollByStep(-1)}
            disabled={!edges.left}
            data-cursor="hover"
            aria-label="Previous models"
          >‹</button>
          <div className="g3d-thumbs" ref={stripRef} onScroll={recomputeEdges}>
            {GALLERY_OBJECTS.map((o) => (
              <button key={o.id} className="g3d-thumb" data-active={active === o.id ? "1" : "0"} onClick={() => pick(o.id)} data-cursor="hover">
                <div className="g3d-thumb-art"><GalleryArt kind={o.art} mini /></div>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <button
            className="g3d-thumb-arrow next"
            onClick={() => scrollByStep(1)}
            disabled={!edges.right}
            data-cursor="hover"
            aria-label="Next models"
          >›</button>
        </div>
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

function GalleryArt({ kind, mini = false }) {
  const stroke = mini ? 1.4 : 1.6;
  const common = { fill: "none", stroke: "var(--accent)", strokeWidth: stroke, strokeLinejoin: "round", strokeLinecap: "round" };
  const faint = { ...common, stroke: "var(--line-strong)", strokeWidth: stroke * 0.7 };

  if (kind === "car") {
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}><path d="M20 92 L180 92 M40 100 L160 100" /></g>
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
  if (kind === "person") {
    // Schematic stick figure + fishing rod. Used only as the thumbnail icon
    // for the fisherboy slot; the full slot renders the GLTF model.
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          <line x1="20" y1="106" x2="180" y2="106" />
        </g>
        <g {...common}>
          {/* head */}
          <circle cx="92" cy="20" r="7" />
          {/* torso */}
          <line x1="92" y1="27" x2="92" y2="64" />
          {/* arms — right arm angles up to the rod */}
          <line x1="92" y1="36" x2="76" y2="60" />
          <line x1="92" y1="36" x2="112" y2="46" />
          {/* legs */}
          <line x1="92" y1="64" x2="78" y2="100" />
          <line x1="92" y1="64" x2="106" y2="100" />
          {/* fishing rod from right hand, angled up-right */}
          <line x1="112" y1="46" x2="178" y2="14" />
        </g>
        <g {...faint}>
          {/* fishing line dangling from rod tip */}
          <path d="M178 14 Q180 50 168 90" />
          {/* small hook glyph */}
          <circle cx="166" cy="92" r="1.6" fill="var(--accent)" stroke="none" />
        </g>
      </svg>
    );
  }
  if (kind === "forest") {
    // Schematic low-poly forest thumbnail — three triangle trees standing on a
    // faint trail. Used only as the OBJ/03 thumb icon; full slot renders GLTF.
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          {/* horizon / trail */}
          <line x1="16" y1="98" x2="184" y2="98" />
          <path d="M30 102 Q 80 96, 130 102 T 180 100" />
        </g>
        <g {...common}>
          {/* big tree */}
          <path d="M60 96 L88 96 L74 48 Z" />
          <line x1="74" y1="96" x2="74" y2="108" />
          {/* mid tree */}
          <path d="M108 96 L132 96 L120 60 Z" />
          <line x1="120" y1="96" x2="120" y2="106" />
          {/* small tree */}
          <path d="M148 98 L168 98 L158 72 Z" />
          <line x1="158" y1="98" x2="158" y2="106" />
        </g>
      </svg>
    );
  }
  if (kind === "court") {
    // Schematic basketball-court thumbnail — outer rectangle, half-court line,
    // two keys with hoop circles, center circle. OBJ/04 thumb icon only;
    // full slot renders the GLTF.
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          {/* outer court */}
          <rect x="18" y="22" width="164" height="76" rx="2" />
        </g>
        <g {...common}>
          {/* half-court line */}
          <line x1="100" y1="22" x2="100" y2="98" />
          {/* center circle */}
          <circle cx="100" cy="60" r="9" />
          {/* left key */}
          <rect x="18" y="44" width="32" height="32" />
          <circle cx="50" cy="60" r="9" />
          {/* right key */}
          <rect x="150" y="44" width="32" height="32" />
          <circle cx="150" cy="60" r="9" />
        </g>
        <g {...common}>
          {/* hoops — small filled circles at each end */}
          <circle cx="22" cy="60" r="2.2" fill="var(--accent)" stroke="none" />
          <circle cx="178" cy="60" r="2.2" fill="var(--accent)" stroke="none" />
        </g>
      </svg>
    );
  }
  if (kind === "cat") {
    // Schematic low-poly cat head — triangle ears, head outline, eyes, snout,
    // whiskers. OBJ/05 thumb icon only; the full slot renders the GLTF.
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          <line x1="40" y1="106" x2="160" y2="106" />
        </g>
        <g {...common}>
          {/* ears */}
          <path d="M74 36 L66 12 L92 30 Z" />
          <path d="M126 36 L134 12 L108 30 Z" />
          {/* head — faceted low-poly outline */}
          <path d="M74 36 L92 30 L108 30 L126 36 L134 60 L118 86 L82 86 L66 60 Z" />
          {/* eyes */}
          <path d="M84 54 L92 54" />
          <path d="M108 54 L116 54" />
          {/* snout */}
          <path d="M96 66 L100 72 L104 66" />
        </g>
        <g {...faint}>
          {/* whiskers */}
          <path d="M104 70 L132 64 M104 73 L132 76" />
          <path d="M96 70 L68 64 M96 73 L68 76" />
        </g>
      </svg>
    );
  }
  if (kind === "coding") {
    // Schematic desk + monitor (code lines on screen) with a small seated
    // figure. OBJ/06 thumb icon only; the full slot renders the animated GLTF.
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...faint}>
          {/* desk surface + floor */}
          <line x1="28" y1="92" x2="172" y2="92" />
          <line x1="40" y1="100" x2="160" y2="100" />
        </g>
        <g {...common}>
          {/* monitor */}
          <rect x="96" y="34" width="58" height="38" rx="2" />
          <line x1="125" y1="72" x2="125" y2="80" />
          <line x1="113" y1="80" x2="137" y2="80" />
        </g>
        <g {...faint}>
          {/* code lines on screen */}
          <line x1="104" y1="44" x2="124" y2="44" />
          <line x1="104" y1="52" x2="140" y2="52" />
          <line x1="112" y1="60" x2="132" y2="60" />
        </g>
        <g {...common}>
          {/* seated figure at the desk */}
          <circle cx="64" cy="46" r="8" />
          <path d="M64 54 L64 76" />
          {/* arm reaching to the desk/keyboard */}
          <path d="M64 60 L86 70" />
          {/* seated legs */}
          <path d="M64 76 L80 76 L80 92" />
          <path d="M64 76 L56 92" />
          {/* chair back */}
          <path d="M50 58 L50 92" {...faint} />
        </g>
        <g {...common}>
          {/* keyboard on the desk */}
          <rect x="78" y="84" width="34" height="7" rx="1" />
        </g>
      </svg>
    );
  }
  // Fallback — shouldn't be reached now that every gallery item has a known
  // art kind. Render an empty SVG so callers don't break.
  return <svg viewBox="0 0 200 120" className="g3d-svg" />;
}
