// Ambient hand-mode frame: corner brackets + a minimal status line. The
// center-screen reticle (and its x/y readout) is owned by HandCursor — this
// component is static chrome only.
export function HudReticle() {
  return (
    <div className="hud-overlay on" aria-hidden="true">
      <div className="hud-corner hud-tl" />
      <div className="hud-corner hud-tr" />
      <div className="hud-corner hud-bl" />
      <div className="hud-corner hud-br" />
      <div className="hud-readout">
        <b>HAND CTRL · LIVE</b>
      </div>
    </div>
  );
}
