const HAND_LABEL = {
  standby: "Standby",
  requesting: "Requesting…",
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
      title="Toggle spatial hand control (camera required)"
    >
      <span className="dot" />
      <span>Hand Ctrl · {HAND_LABEL[state] ?? "Standby"}</span>
    </button>
  );
}
