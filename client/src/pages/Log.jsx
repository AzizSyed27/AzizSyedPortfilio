import { Section } from "../components/Section";
import { LOG_ENTRIES } from "../content/log-entries";

export default function Log() {
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
                  <div className="log-when">{e.date}</div>
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
