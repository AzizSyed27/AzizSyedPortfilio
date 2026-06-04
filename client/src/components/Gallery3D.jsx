import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SCENE_PRESETS } from "../three/GalleryScene";

const GalleryScene = lazy(() =>
  import("../three/GalleryScene").then((m) => ({ default: m.GalleryScene })),
);

const GALLERY_OBJECTS = [
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
    id: "terrain", label: "terrain", code: "OBJ/03",
    tag: "HiddenHooks · PostGIS",
    note: "100K+ Ontario water bodies, flattened into a heightfield I can actually reason about.",
    art: "terrain",
  },
  {
    id: "graph", label: "agent graph", code: "OBJ/04",
    tag: "Debug pipeline · Gemini",
    note: "Three agents passing a bug between them until one of them finally admits it's the bug.",
    art: "graph",
  },
];

export function Gallery3D({ hero = false }) {
  const [active, setActive] = useState("e46");
  const obj = GALLERY_OBJECTS.find((o) => o.id === active) || GALLERY_OBJECTS[0];
  const thumbs = GALLERY_OBJECTS.filter((o) => o.id !== "e46");
  const stageRef = useRef(null);
  const objRef = useRef(null);
  const hoverRef = useRef(false);
  const tiltRef = useRef({ x: -8, y: 0 });

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
  const pick = (id) => setActive((cur) => (cur === id ? "e46" : id));

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
                  <GalleryScene preset={SCENE_PRESETS[obj.modelId]} />
                </Suspense>
              ) : (
                <GalleryArt kind={obj.art} />
              )}
            </div>
            {!is3D && <div className="g3d-shadow" />}
          </div>
          <div className="g3d-affordance">drag to rotate · pinch to zoom</div>
        </div>
        <div className="g3d-thumbs">
          {thumbs.map((o) => (
            <button key={o.id} className="g3d-thumb" data-active={active === o.id ? "1" : "0"} onClick={() => pick(o.id)} data-cursor="hover">
              <div className="g3d-thumb-art"><GalleryArt kind={o.art} mini /></div>
              <span>{o.label}</span>
            </button>
          ))}
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
  if (kind === "terrain") {
    return (
      <svg viewBox="0 0 200 120" className="g3d-svg">
        <g {...common}>{[0,1,2,3,4].map((r) => (
          <path key={r} d={`M16 ${50 + r * 12} L60 ${30 + r * 12} L100 ${46 + r * 12} L140 ${26 + r * 12} L184 ${44 + r * 12}`} />
        ))}</g>
        <g {...faint}>{[0,1,2,3,4,5].map((c) => (
          <line key={c} x1={16 + c * 33.6} y1={50} x2={16 + c * 33.6} y2={98} opacity="0.5" />
        ))}</g>
      </svg>
    );
  }
  const nodes = [[40,30],[100,18],[160,38],[30,86],[92,72],[150,92],[112,108]];
  const edges = [[0,1],[1,2],[0,3],[0,4],[1,4],[2,5],[4,5],[4,6],[3,6],[5,6]];
  return (
    <svg viewBox="0 0 200 120" className="g3d-svg">
      <g {...faint}>{edges.map((e, i) => (
        <line key={i} x1={nodes[e[0]][0]} y1={nodes[e[0]][1]} x2={nodes[e[1]][0]} y2={nodes[e[1]][1]} />
      ))}</g>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n[0]} cy={n[1]} r={mini ? 4 : 6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={stroke} />
          <circle cx={n[0]} cy={n[1]} r={mini ? 1.6 : 2.4} fill="var(--accent)" stroke="none" />
        </g>
      ))}
    </svg>
  );
}
