const GESTURES = [
  { gesture: "Open palm",        mouse: "Mouse cursor",       intent: "Move the cursor" },
  { gesture: "Pinch",            mouse: "Click",              intent: "Select / grab / open" },
  { gesture: "Fist",             mouse: "Right-click",        intent: "Scatter / reset" },
  { gesture: "Swipe L / R",      mouse: "Nav buttons · 1–6",  intent: "Change page" },
  { gesture: "Two-hand spread",  mouse: "Scroll · trackpad",  intent: "Zoom 3D model" },
  { gesture: "Two-hand rotate",  mouse: "Drag inside gallery",intent: "Rotate 3D model" },
  { gesture: "Pull apart",       mouse: "Click project card", intent: "Open exploded view" },
  { gesture: "Flick away",       mouse: "Esc · backdrop click",intent: "Close overlay" },
  { gesture: "Palm up",          mouse: "Press H",            intent: "Toggle this cheat sheet" },
];

export function CheatSheet({ onClose }) {
  return (
    <div className="cheat-sheet" role="dialog" aria-modal="true" aria-labelledby="cheat-title" onClick={onClose}>
      <div className="cheat-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cheat-head">
          <span id="cheat-title">GESTURES · /REFERENCE</span>
          <button className="cheat-close" onClick={onClose} aria-label="Close cheat sheet">×</button>
        </div>
        <p className="cheat-note">
          Phase 2 will recognize these gestures from your webcam. Until then,
          every interaction has a mouse/keyboard equivalent — listed alongside.
        </p>
        <div className="cheat-grid">
          {GESTURES.map((g) => (
            <div key={g.gesture} className="cheat-row">
              <span className="cheat-gesture">{g.gesture}</span>
              <span className="cheat-mouse">{g.mouse}</span>
              <span className="cheat-intent">{g.intent}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .cheat-sheet { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); }
        .cheat-panel { max-width: 720px; width: 100%; background: var(--bg); color: var(--fg); border: 1px solid var(--line-strong); border-radius: 12px; padding: 24px 28px 28px; box-shadow: var(--shadow); font-family: var(--f-body); }
        .cheat-head { display: flex; align-items: center; justify-content: space-between; font-family: var(--f-mono); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); padding-bottom: 10px; }
        .cheat-close { background: transparent; border: 0; color: var(--fg); font-size: 22px; cursor: pointer; line-height: 1; }
        .cheat-note { color: var(--muted); margin: 14px 0 18px; font-size: 14px; line-height: 1.5; }
        .cheat-grid { display: grid; gap: 8px; }
        .cheat-row { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 18px; padding: 10px 0; border-top: 1px solid var(--line); font-size: 14px; }
        .cheat-row:first-child { border-top: 0; }
        .cheat-gesture { font-family: var(--f-mono); color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; align-self: center; }
        .cheat-mouse   { font-family: var(--f-mono); color: var(--muted); font-size: 12px; align-self: center; }
        .cheat-intent  { color: var(--fg); }
      `}</style>
    </div>
  );
}
