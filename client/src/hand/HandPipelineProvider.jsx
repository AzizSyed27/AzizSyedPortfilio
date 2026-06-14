// Phase 2 coordination hub, following the ASL-Hand-Coach provider pattern.
// The provider itself is always mounted (context for the PIP, debug overlay
// and the M1+ recognizers); the camera/landmarker only exist while the inner
// <PipelineRunner> is mounted, which is exactly while handState !== 'standby'.
// Unmounting the runner IS the teardown — the ported hook stops every stream
// track and closes the landmarker, so the camera light goes off on exit.
//
// Lifecycle driven here:
//   requesting + unsupported          → notice, abortHand()
//   requesting + camera granted       → startBoot()  (boot plays while the
//                                       model finishes loading in parallel)
//   any active + pipeline error       → mapped notice, abortHand()
//
// Recognizers (M1+) will subscribe to frames here and call intents only —
// never the DOM.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMode } from "../mode/ModeProvider";
import { useHandTracking } from "./useHandTracking";
import { landmarksToFeatureVector } from "./features";
import { DEBUG_PARAM, DEBUG_VALUE, FPS_WINDOW, PIP_THROTTLE_HZ, TUNE, isHandModeSupported } from "./config";
import { makeFrame, viewportToCamera } from "./debug/syntheticFrame";
import { createArbitrator } from "./gestures/arbitrator";

const HandPipelineContext = createContext(null);

const EMPTY_STATS = () => ({ tStamps: [], inferenceMs: 0, handsCount: 0, handednesses: [] });

function parseHandedness(results, i) {
  const first = results.handednesses?.[i]?.[0];
  const raw = (first?.categoryName ?? first?.displayName ?? "").toString().toLowerCase();
  if (raw.includes("left")) return "Left";
  if (raw.includes("right")) return "Right";
  return "Unknown";
}

function fpsFrom(tStamps) {
  if (tStamps.length < 2) return 0;
  const spanMs = tStamps[tStamps.length - 1] - tStamps[0];
  return spanMs > 0 ? ((tStamps.length - 1) * 1000) / spanMs : 0;
}

function noticeFromError(error) {
  const name = error?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return "Camera permission denied — staying in mouse mode.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError")
    return "No camera found — staying in mouse mode.";
  return "Hand tracking failed to start — staying in mouse mode.";
}

function PipelineRunner({ onResults, onStatusChange }) {
  const { videoRef, status, error } = useHandTracking({ onResults });

  useEffect(() => {
    onStatusChange(status, error);
  }, [status, error, onStatusChange]);

  // Hidden offscreen landmarker input — never displayed, never `display:none`
  // (some browsers stall currentTime on undisplayed videos).
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      aria-hidden="true"
      style={{ position: "fixed", left: "-9999px", top: 0, width: "2px", height: "2px", opacity: 0, pointerEvents: "none" }}
    />
  );
}

export function HandPipelineProvider({ children }) {
  const { handState, startBoot, abortHand } = useMode();
  const active = handState !== "standby";

  // Tab hidden → release the camera (the runner unmounts, stopping all tracks
  // so the OS camera light goes off); tab visible → silently re-acquire
  // (permission already granted). handState stays put, so on return tracking
  // resumes with no re-boot.
  const [hidden, setHidden] = useState(typeof document !== "undefined" && document.hidden);
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  // Transient confirmation toast (e.g. pinch-hold "Copied · …"); HandNotice
  // auto-dismisses. Same surface as the failure notice.
  const flashNotice = useCallback((msg) => setNotice(msg), []);

  // The shared interaction state machine — stable identity, mutated in place
  // by HandCursor/HandGestures, read everywhere (PIP label, debug, gates).
  const arbRef = useRef(null);
  if (!arbRef.current) arbRef.current = createArbitrator();

  // Per-frame data lives in refs — zero re-renders on the inference path.
  const statsRef = useRef(EMPTY_STATS());
  const frameSubsRef = useRef(new Set());
  const latestVectorRef = useRef(null);

  // Frame subscribers (SensorPip draw, cursor controller, debug trails) are
  // called per inference frame outside React; returns an unsubscribe.
  const subscribeFrame = useCallback((fn) => {
    frameSubsRef.current.add(fn);
    return () => frameSubsRef.current.delete(fn);
  }, []);
  const getLatestVector = useCallback(() => latestVectorRef.current, []);

  const handleResults = useCallback((results, meta) => {
    const s = statsRef.current;
    s.tStamps.push(meta.nowMs);
    if (s.tStamps.length > FPS_WINDOW) s.tStamps.shift();
    s.inferenceMs = meta.inferenceMs;
    s.handsCount = results.landmarks?.length ?? 0;
    s.handednesses = (results.landmarks ?? []).map((_, i) => parseHandedness(results, i));

    if (s.handsCount > 0) {
      latestVectorRef.current = landmarksToFeatureVector(results.landmarks[0], s.handednesses[0]).vector;
    } else {
      latestVectorRef.current = null;
    }

    const fps = fpsFrom(s.tStamps);
    for (const fn of frameSubsRef.current) {
      try {
        fn(results, meta, fps);
      } catch (err) {
        // One bad subscriber must not kill the rest of the pipeline.
        console.error("hand frame subscriber failed", err);
      }
    }
  }, []);

  const handleStatusChange = useCallback((nextStatus, nextError) => {
    setStatus(nextStatus);
    setError(nextError);
  }, []);

  // Requesting: bail out immediately on unsupported devices (camera untouched);
  // otherwise clear any stale notice while the permission prompt is up.
  useEffect(() => {
    if (handState !== "requesting") return;
    if (!isHandModeSupported()) {
      setNotice("Hand mode needs a desktop browser with a camera.");
      abortHand();
    } else {
      setNotice(null);
    }
  }, [handState, abortHand]);

  // Camera granted (stream attached, model loading) → start the boot sequence.
  useEffect(() => {
    if (handState === "requesting" && (status === "loading_model" || status === "running")) {
      startBoot();
    }
  }, [handState, status, startBoot]);

  // Pipeline failure anywhere in the active lifecycle → notice + full exit.
  useEffect(() => {
    if (active && status === "error") {
      setNotice(noticeFromError(error));
      abortHand();
    }
  }, [active, status, error, abortHand]);

  // Back to standby: reset the mirrored pipeline state.
  useEffect(() => {
    if (!active) {
      setStatus("idle");
      setError(null);
      statsRef.current = EMPTY_STATS();
      latestVectorRef.current = null;
      arbRef.current.reset();
    }
  }, [active]);

  // Throttled debug/readout snapshot for React consumers (PIP, debug overlay).
  const [debug, setDebug] = useState({ fps: 0, inferenceMs: 0, handsCount: 0, handednesses: [], status: "idle", error: null });
  useEffect(() => {
    if (!active) {
      setDebug({ fps: 0, inferenceMs: 0, handsCount: 0, handednesses: [], status: "idle", error: null });
      return undefined;
    }
    const tick = () => {
      const s = statsRef.current;
      setDebug({
        fps: fpsFrom(s.tStamps),
        inferenceMs: s.inferenceMs,
        handsCount: s.handsCount,
        handednesses: s.handednesses,
        status,
        error,
      });
    };
    tick();
    const id = setInterval(tick, 1000 / PIP_THROTTLE_HZ);
    return () => clearInterval(id);
  }, [active, status, error]);

  // ?debug=hand drive shaft: lets the debug panel and Playwright inject
  // synthetic frames below the camera (provider is outside the Router, so the
  // param is read from the initial URL — load the page with it).
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (new URLSearchParams(window.location.search).get(DEBUG_PARAM) !== DEBUG_VALUE) return undefined;
    window.__handDebug = Object.assign(window.__handDebug ?? {}, {
      version: 1,
      tune: TUNE,
      arb: arbRef.current,
      injectFrame: handleResults,
      makeFrame,
      viewportToCamera,
    });
    return () => {
      delete window.__handDebug;
    };
  }, [handleResults]);

  const value = useMemo(
    () => ({ status, error, notice, dismissNotice, flashNotice, subscribeFrame, getLatestVector, debug, arbitrator: arbRef.current }),
    [status, error, notice, dismissNotice, flashNotice, subscribeFrame, getLatestVector, debug],
  );

  return (
    <HandPipelineContext.Provider value={value}>
      {children}
      {active && !hidden && <PipelineRunner onResults={handleResults} onStatusChange={handleStatusChange} />}
    </HandPipelineContext.Provider>
  );
}

export function useHandPipeline() {
  const ctx = useContext(HandPipelineContext);
  if (!ctx) throw new Error("useHandPipeline must be used inside HandPipelineProvider");
  return ctx;
}
