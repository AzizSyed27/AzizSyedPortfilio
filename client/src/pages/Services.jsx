import { useEffect, useRef, useState } from "react";
import { Section } from "../components/Section";
import { HeroBand } from "../components/HeroBand";
import { CapabilityRadar } from "../components/CapabilityRadar";
import { StackConstellation } from "../components/StackConstellation";
import { CAPABILITIES, CLIENTS } from "../content/capabilities";

function useTypewriter(text) {
  const [typed, setTyped] = useState("");
  const [active, setActive] = useState(false);
  const timer = useRef(null);
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
  useEffect(() => () => clearInterval(timer.current), []);
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

export default function Services() {
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
