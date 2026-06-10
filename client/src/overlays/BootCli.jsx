import { useEffect, useState } from "react";
import { CLI_LINES, CLI_CHAR_MS, CLI_LINE_PAUSE } from "./bootTimeline";

// Frame 01 · CLI — a small centered terminal that boots with a typewriter, line
// by line, like a real CLI. Styles live in BootSequence's scoped <style>.

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Tiny pixel-hand mascot for the titlebar.
const HAND_GRID = [
  ".#.#.#.#.", ".#.#.#.#.", ".#.#.#.#.", ".#.#.#.#.",
  "#########", "#########", ".###g###.", ".#######.",
  ".#######.", "..*****..", "..*****..",
];
function PixelHand() {
  const cell = 4, cols = 9, rows = HAND_GRID.length, rects = [];
  HAND_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const cls = ch === "*" ? "px-mag" : ch === "g" ? "px-grn" : "px-blue";
      rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell - 0.5} height={cell - 0.5} className={cls} />);
    });
  });
  return <svg className="pixel-hand" viewBox={`0 0 ${cols * cell} ${rows * cell}`}>{rects}</svg>;
}

function Line({ kind, text, cursor }) {
  // Teal/cyan status stamp on ok/wait lines ("[ ok ]" / "[ .. ]").
  const stamped = kind === "ok" || kind === "wait";
  return (
    <div className={`cli-line cli-${kind}`}>
      {stamped
        ? <><span className={`cli-stamp ${kind === "ok" ? "s-ok" : "s-wait"}`}>{text.slice(0, 6)}</span>{text.slice(6)}</>
        : text}
      {cursor && <span className="cli-cur" />}
    </div>
  );
}

export function BootCli() {
  const [shown, setShown] = useState([]);

  useEffect(() => {
    if (prefersReduced()) {
      setShown(CLI_LINES.map((l) => ({ kind: l.kind, text: l.text, done: true })));
      return undefined;
    }
    let li = 0, ci = 0, cancelled = false, t;
    const tick = () => {
      if (cancelled) return;
      const line = CLI_LINES[li];
      if (!line) return;
      ci += 1;
      setShown((prev) => {
        const next = prev.slice();
        next[li] = { kind: line.kind, text: line.text.slice(0, ci), done: ci >= line.text.length };
        return next;
      });
      if (ci >= line.text.length) { li += 1; ci = 0; t = setTimeout(tick, CLI_LINE_PAUSE); }
      else { t = setTimeout(tick, CLI_CHAR_MS); }
    };
    t = setTimeout(tick, 60);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const lastIdx = shown.length - 1;

  return (
    <div className="frame frame-cli">
      <div className="cli-card">
        <div className="cli-titlebar">
          <span className="cli-dots"><i /><i /><i /></span>
          <span className="cli-title">handctrl — /engage</span>
          <PixelHand />
        </div>
        <div className="cli-body">
          {shown.map((l, i) => (
            <Line key={i} kind={l.kind} text={l.text} cursor={i === lastIdx} />
          ))}
        </div>
      </div>
    </div>
  );
}
