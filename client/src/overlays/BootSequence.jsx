export function BootSequence({ state }) {
  const showCli = state === "calibrating";
  const showHud = state === "calibrating" || state === "live";
  return (
    <div className="boot" aria-live="polite">
      {showCli && (
        <div className="boot-frame boot-cli">
          <pre>{`
> HANDCTRL v3.0.0
[ok] optical tracking online
[ok] identity profile loaded
[..] calibrating webcam ........ 11/55
[ok] modules ready
> ready in 1.6s
`}</pre>
        </div>
      )}
      {showHud && (
        <div className="boot-frame boot-hud">
          <div className="boot-corner tl" />
          <div className="boot-corner tr" />
          <div className="boot-corner bl" />
          <div className="boot-corner br" />
          <div className="boot-readout">
            <b>HAND CTRL · {state.toUpperCase()}</b>
            <br />
            mouse fallback active
            <br />
            press [H] for gesture cheat sheet
          </div>
        </div>
      )}
      <style>{`
        .boot { position: fixed; inset: 0; pointer-events: none; z-index: 180; }
        .boot-frame { position: absolute; inset: 0; color: var(--accent); font-family: var(--f-mono); }
        .boot-cli { display: grid; place-items: center; background: rgba(5,8,12,0.65); animation: bootFade 1.6s linear forwards; }
        .boot-cli pre { font-size: 13px; line-height: 1.6; color: var(--accent); background: rgba(0,0,0,0.5); padding: 20px 28px; border: 1px solid var(--line-strong); border-radius: 10px; }
        .boot-hud .boot-corner { position: absolute; width: 26px; height: 26px; border-color: var(--accent); border-style: solid; border-width: 0; }
        .boot-hud .boot-corner.tl { top: 18px; left: 18px; border-top-width: 2px; border-left-width: 2px; }
        .boot-hud .boot-corner.tr { top: 18px; right: 18px; border-top-width: 2px; border-right-width: 2px; }
        .boot-hud .boot-corner.bl { bottom: 18px; left: 18px; border-bottom-width: 2px; border-left-width: 2px; }
        .boot-hud .boot-corner.br { bottom: 18px; right: 18px; border-bottom-width: 2px; border-right-width: 2px; }
        .boot-readout { position: absolute; left: 22px; bottom: 22px; font-size: 12px; line-height: 1.6; letter-spacing: 0.04em; color: var(--accent); }
        @keyframes bootFade { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}
