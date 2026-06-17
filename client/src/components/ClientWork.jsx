import { useEffect, useState } from "react";
import { useMode } from "../mode/ModeProvider";
import { HOME_CLIENTS } from "../content/capabilities";

// Home "Client work / freelance" grid (ported from the Claude Design handoff).
// Mouse: each card is a link that opens the live site in a new tab. Hand mode
// ("live"): cards become armed targets — accent ring + corner brackets +
// "Pinch to open" — and a pinch opens an in-page focus preview instead (an
// external new tab can't be opened hands-free). Close the preview with the ✕
// button, a backdrop click, or Esc.
export function ClientWork() {
  const { handState } = useMode();
  const handLive = handState === "live";
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (!focused) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setFocused(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  return (
    <>
      <div className={`home-client-grid ${handLive ? "hand-live" : ""}`}>
        {HOME_CLIENTS.map((c) => (
          <a
            key={c.id}
            className="client-show"
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="hover"
            style={{ "--cw-accent": c.accent }}
            onClick={(e) => { if (handLive) { e.preventDefault(); setFocused(c); } }}
          >
            <div className="cs-shot">
              <img src={c.shot} alt={`${c.name} website`} loading="lazy" />
              <span className="cs-chrome"><i /><i /><i /></span>
              <span className="cs-badge">Live</span>
              <span className="cs-bracket tl" /><span className="cs-bracket tr" />
              <span className="cs-bracket bl" /><span className="cs-bracket br" />
              <span className="cs-pinch">▸ Pinch to open</span>
            </div>
            <div className="cs-body">
              <div className="cs-num">{c.id} · {c.sector}</div>
              <h4 className="cs-name">{c.name}</h4>
              <p className="cs-desc">{c.desc}</p>
              <div className="cs-tags">
                {c.tags.map((t, i) => <span key={i}>{t}</span>)}
              </div>
            </div>
          </a>
        ))}
      </div>

      {focused && (
        <div className="cs-focus" onClick={() => setFocused(null)} style={{ "--cw-accent": focused.accent }}>
          <div className="cs-focus-card" onClick={(e) => e.stopPropagation()}>
            <div className="cs-focus-bar">
              <span className="cs-focus-dots"><i /><i /><i /></span>
              <span className="cs-focus-url">{focused.name}</span>
              <button className="cs-focus-close" onClick={() => setFocused(null)} data-cursor="hover" type="button">
                ✕ close
              </button>
            </div>
            <div className="cs-focus-shot">
              <img src={focused.shot} alt={`${focused.name} website`} />
            </div>
            <div className="cs-focus-meta">
              <div>
                <div className="cs-num">{focused.id} · {focused.sector}</div>
                <h4 className="cs-name" style={{ marginTop: 4 }}>{focused.name}</h4>
              </div>
              <div className="cs-tags">
                {focused.tags.map((t, i) => <span key={i}>{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
