const HAND_LABEL = {
  standby: "Standby",
  calibrating: "Calibrating",
  live: "Live",
};

export function HandCtrlPill({ state = "standby", onClick }) {
  return (
    <button
      className="hand-pill"
      data-state={state}
      onClick={onClick}
      data-cursor="hover"
      title="Preview spatial hand control (mouse-driven in Phase 1)"
    >
      <span className="dot" />
      <span>Hand Ctrl · {HAND_LABEL[state] ?? "Standby"}</span>
    </button>
  );
}
