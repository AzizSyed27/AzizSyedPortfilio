import { useEffect } from "react";
import { PROJECTS_BY_ID } from "../content/projects";

export function ExplodedView({ id, onClose }) {
  const project = PROJECTS_BY_ID[id];

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!project) return null;
  const layers = project.layers ?? DEFAULT_LAYERS;

  return (
    <div className="exploded" role="dialog" aria-modal="true" aria-labelledby="exp-title" onClick={onClose}>
      <div className="exp-panel" onClick={(e) => e.stopPropagation()} data-theme="hud">
        <div className="exp-head">
          <span>{project.num} · EXPLODED VIEW</span>
          <button className="exp-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="exp-grid">
          <div className="exp-stage">
            {layers.map((layer, i) => (
              <div className="exp-layer" key={layer.label} style={{ transform: `translateZ(${-i * 50}px) translateY(${i * 22}px)`, opacity: 1 - i * 0.06 }}>
                <div className="exp-layer-tag">L/{String(i + 1).padStart(2, "0")} · {layer.label}</div>
                <p>{layer.desc}</p>
              </div>
            ))}
          </div>
          <div className="exp-meta">
            <h2 id="exp-title" className="display">{project.title}</h2>
            <p className="lede">{project.desc}</p>
            <div className="exp-stats">
              {project.stats?.map((s, i) => (
                <div key={i}><b>{s.v}</b><span>{s.l}</span></div>
              ))}
            </div>
            <div className="exp-tags">
              {project.tags?.map((t) => <span key={t}>{t}</span>)}
            </div>
            {project.url && <a className="btn" href={`https://${project.url}`} target="_blank" rel="noreferrer">Visit {project.url} →</a>}
          </div>
        </div>
      </div>
      <style>{`
        .exploded { position: fixed; inset: 0; z-index: 220; padding: 40px; display: grid; place-items: center; background: rgba(5,8,12,0.78); backdrop-filter: blur(6px); }
        .exp-panel { width: min(1200px, 100%); height: min(720px, 90vh); display: grid; grid-template-rows: auto 1fr; background: var(--bg); color: var(--fg); border: 1px solid var(--line-strong); border-radius: 14px; box-shadow: 0 40px 100px rgba(0,0,0,0.6); overflow: hidden; }
        .exp-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-bottom: 1px solid var(--line); font-family: var(--f-mono); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
        .exp-close { background: transparent; border: 0; color: var(--fg); font-size: 26px; cursor: pointer; line-height: 1; }
        .exp-grid { display: grid; grid-template-columns: 1.4fr 1fr; min-height: 0; }
        .exp-stage { position: relative; padding: 40px; display: grid; gap: 18px; align-content: center; perspective: 900px; }
        .exp-layer { padding: 14px 18px; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface); transition: transform 0.4s ease, opacity 0.4s ease; }
        .exp-layer-tag { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
        .exp-layer p { margin: 0; font-size: 13px; color: var(--muted); }
        .exp-meta { padding: 40px; border-left: 1px solid var(--line); display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
        .exp-meta .display { font-size: clamp(36px, 4vw, 56px); margin: 0; }
        .exp-stats { display: flex; gap: 32px; padding-top: 14px; border-top: 1px solid var(--line); }
        .exp-stats b { display: block; font-family: var(--f-display); font-size: 32px; color: var(--accent); }
        .exp-stats span { font-family: var(--f-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .exp-tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .exp-tags span { padding: 4px 10px; border: 1px solid var(--line-strong); border-radius: 999px; font-family: var(--f-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
      `}</style>
    </div>
  );
}

const DEFAULT_LAYERS = [
  { label: "Frontend", desc: "Client-side UI and interactions." },
  { label: "API",      desc: "REST or GraphQL surface." },
  { label: "Services", desc: "Business logic, domain services." },
  { label: "Data",     desc: "Persistence layer (SQL/NoSQL)." },
  { label: "Infra",    desc: "Deployment, monitoring, CI/CD." },
];
