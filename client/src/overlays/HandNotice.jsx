import { useEffect } from "react";
import { NOTICE_AUTO_DISMISS_MS } from "../hand/config";

// Small dismissible notice for hand-mode failure paths (permission denied,
// no camera, unsupported device). The site stays fully usable in mouse mode —
// this is informational, never a dead end.
export function HandNotice({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, NOTICE_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="hand-notice" role="status">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notice" data-cursor="hover">×</button>
    </div>
  );
}
