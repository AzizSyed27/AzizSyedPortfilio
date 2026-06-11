import { useState } from "react";
import { Section } from "../components/Section";
import portraitB from "../assets/person-pics/aziz_top_shot_2.jpeg";
import gym from "../assets/person-pics/portfolio_gym.jpeg";
import trail from "../assets/person-pics/portfolio_trails.jpeg";
import car from "../assets/person-pics/portfolio_whip.jpeg";
import fishing from "../assets/person-pics/portfolio_hooked.jpeg";
import pets from "../assets/person-pics/portfolio_pets.jpeg";
import boat from "../assets/person-pics/portfolio_boat.jpeg";
import catCar from "../assets/person-pics/portfolio_cat_car.jpeg";
import mech from "../assets/person-pics/portfolio_mech.jpeg";
import scenicFishing from "../assets/person-pics/portfolio_scenic_fishing.jpeg";
import motorCat from "../assets/person-pics/portfolio_cat_moto.jpeg";
import cat from "../assets/person-pics/portfolio_cat.jpeg";
import resumePdf from "../assets/Aziz_Syed_Resume.pdf";

// The photo cluster cycles between two sets via the loop arrow pinned to its
// corner. Each set fills the same six tilted slots (pf-1 … pf-6).
const PHOTO_SETS = [
  [
    { cls: "pf-1", src: portraitB, caption: "PORTRAIT.JPG" },
    { cls: "pf-2", src: gym,       caption: "GYM.JPG" },
    { cls: "pf-3", src: car,       caption: "DRIVE.JPG" },
    { cls: "pf-4", src: trail,     caption: "OUTDOORS.JPG" },
    { cls: "pf-5", src: fishing,   caption: "FISHING.JPG" },
    { cls: "pf-6", src: pets,      caption: "PETS.JPG" },
  ],
  [
    { cls: "pf-1", src: motorCat,       caption: "MOTOR-CAT.JPG" },
    { cls: "pf-2", src: boat,           caption: "BOATING.JPG" },
    { cls: "pf-3", src: catCar,         caption: "CO-PILOT.JPG" },
    { cls: "pf-4", src: mech,           caption: "ENGINE.JPG" },
    { cls: "pf-5", src: scenicFishing,  caption: "SHORELINE.JPG" },
  { cls: "pf-6", src: cat,              caption: "CAT.JPG" }, // reused to pad set 2 to six
  ],
];

function PhotoSlot({ cls, src, caption }) {
  return (
    <figure className={`photo-file ${cls}`}>
      {src ? (
        <img src={src} alt={caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", minHeight: 140, display: "grid", placeItems: "center", color: "var(--muted-2)", fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", background: "var(--surface)" }}>
          photo pending
        </div>
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function TimelineItem({ when, what, where, desc, details, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
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
        {hasDetails && <span className="ti-toggle" aria-hidden="true">{open ? "–" : "+"}</span>}
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

export default function About() {
  const [set, setSet] = useState(0);
  const photos = PHOTO_SETS[set];
  const cycle = () => setSet((s) => (s + 1) % PHOTO_SETS.length);

  return (
    <div className="page-enter">
      <Section num="02" label="About · /aziz">
        <h2 className="display" style={{ fontSize: "clamp(56px, 9vw, 132px)", marginBottom: 56 }}>
          Hi — I'm <em>Aziz</em>.
        </h2>
        <div className="about-grid">
          <div className="photo-cluster">
            {photos.map((p) => <PhotoSlot key={`${set}-${p.cls}`} {...p} />)}
            <button className="photo-cycle" onClick={cycle} data-cursor="hover" aria-label="Next photo set">
              <span className="pc-count">{String(set + 1).padStart(2, "0")} / {String(PHOTO_SETS.length).padStart(2, "0")}</span>
              <span className="pc-arr" aria-hidden="true">›</span>
            </button>
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
              <a className="btn" href={resumePdf} download data-cursor="hover">
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
