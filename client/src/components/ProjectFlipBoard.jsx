import { useEffect, useRef, useState } from "react";

const BOARD = [
  { code: "P/01", name: "Projects by the Projects", stack: "Spring Boot · React", year: "25", status: "LIVE" },
  { code: "P/02", name: "MyE46",                    stack: "R3F · Gemini",         year: "25", status: "LIVE" },
  { code: "P/03", name: "ASL Hand Coach",           stack: "MediaPipe · CNN",      year: "24", status: "LIVE" },
  { code: "P/04", name: "HiddenHooks",              stack: "PostGIS · FastAPI",    year: "24", status: "LIVE" },
  { code: "P/05", name: "GymNet",                   stack: "Spring Boot · React",  year: "24", status: "SHIPPED" },
  { code: "P/06", name: "DineSmart",                stack: "Angular · GraphQL",    year: "23", status: "SHIPPED" },
  { code: "P/07", name: "MovieShare",               stack: ".NET · AWS",           year: "23", status: "SHIPPED" },
  { code: "P/08", name: "CommConnect",              stack: "Next.js · RAG",        year: "24", status: "SHIPPED" },
];
const ROWS = 5;

export function ProjectFlipBoard() {
  const [offset, setOffset] = useState(0);
  const rowRefs = useRef([]);
  const hoverRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!hoverRef.current) setOffset((o) => (o + 1) % BOARD.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    rowRefs.current.filter(Boolean).forEach((el, i) => {
      el.style.transformOrigin = "top";
      const start = performance.now() + i * 70;
      const dur = 280;
      const step = (now) => {
        const p = Math.max(0, Math.min(1, (now - start) / dur));
        const e = 1 - Math.pow(1 - p, 3);
        el.style.opacity = String(e);
        el.style.transform = `scaleY(${(0.15 + 0.85 * e).toFixed(3)})`;
        if (p < 1) requestAnimationFrame(step);
        else {
          el.style.opacity = "";
          el.style.transform = "";
          el.style.transformOrigin = "";
        }
      };
      requestAnimationFrame(step);
    });
  }, [offset]);

  const rows = Array.from({ length: ROWS }, (_, i) => BOARD[(offset + i) % BOARD.length]);

  return (
    <div
      className="flip-board"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      <div className="fb-head">
        <span>PROJECT INDEX</span>
        <span className="fb-live"><i />LIVE · {BOARD.length} BUILDS</span>
      </div>
      <div className="fb-cols">
        <span>CODE</span><span>PROJECT</span><span>STACK</span><span>YR</span><span>STATUS</span>
      </div>
      <div className="fb-rows">
        {rows.map((r, i) => (
          <div className="fb-row" key={i} ref={(el) => (rowRefs.current[i] = el)}>
            <span className="fb-code">{r.code}</span>
            <span className="fb-name">{r.name}</span>
            <span className="fb-stack">{r.stack}</span>
            <span className="fb-year">'{r.year}</span>
            <span className={`fb-status s-${r.status}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
