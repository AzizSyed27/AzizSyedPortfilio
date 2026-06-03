import { useRef, useState } from "react";
import { Section } from "../components/Section";
import { HeroBand } from "../components/HeroBand";
import { ProjectFlipBoard } from "../components/ProjectFlipBoard";
import { FEATURED_PROJECTS, ARCHIVE_PROJECTS } from "../content/projects";
import { useActions } from "../intents/actions";

function ProjectCardTilt({ p }) {
  const actions = useActions();
  const ref = useRef(null);
  const [hover, setHover] = useState(false);

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
      onClick={() => actions.openProject(p.id)}
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
      <button
        className="pc-explode"
        data-cursor="hover"
        onClick={(e) => { e.stopPropagation(); actions.openProject(p.id); }}
        type="button"
      >
        <span className="pc-explode-icon" aria-hidden="true">⊹</span>
        Exploded view
        <span className="pc-explode-arr">→</span>
      </button>
    </article>
  );
}

function ArchiveRow({ p, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
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

export default function Projects() {
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
          {ARCHIVE_PROJECTS.map((p) => (
            <ArchiveRow key={p.title} p={p} defaultOpen={p.title === "GymNet"} />
          ))}
        </div>
      </Section>
    </div>
  );
}
