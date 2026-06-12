// Ported from ASL-Hand-Coach src/hooks/useHandTracking.ts (type-stripped,
// logic identical) with two deliberate deviations:
//   1. Defaults come from config.js — wasmBasePath points at the locally
//      served copy of the MediaPipe runtime, never a CDN.
//   2. onResults meta gains inferenceMs (measured around detectForVideo) so
//      the PIP latency readout reports the real per-frame cost.
//
// Lifecycle: starts the camera on mount, tears down fully on unmount (cancel
// rAF, stop every stream track, close the landmarker). Mount/unmount is the
// engage/exit switch — HandPipelineProvider only mounts this while hand mode
// is active. The `cancelled` flag is checked after every await so a
// StrictMode double-mount or a mid-request exit can't leak the camera.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAMERA_CONSTRAINTS,
  DELEGATE,
  MIN_HAND_DETECTION_CONFIDENCE,
  MIN_HAND_PRESENCE_CONFIDENCE,
  MIN_TRACKING_CONFIDENCE,
  MODEL_ASSET_PATH,
  NUM_HANDS,
  WASM_BASE_PATH,
} from "./config";

// status: 'idle' | 'starting_camera' | 'loading_model' | 'running' | 'error'
export function useHandTracking(options = {}) {
  const {
    modelAssetPath = MODEL_ASSET_PATH,
    wasmBasePath = WASM_BASE_PATH,
    numHands = NUM_HANDS,
    onResults,
    delegate = DELEGATE,
  } = options;

  const videoRef = useRef(null);

  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const latestResultsRef = useRef(null);
  const onResultsRef = useRef(onResults);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  // Keep callback ref fresh without restarting the pipeline
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Memoize the config so the effect only restarts if these change
  const config = useMemo(
    () => ({ modelAssetPath, wasmBasePath, numHands, delegate }),
    [modelAssetPath, wasmBasePath, numHands, delegate],
  );

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }

      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;

      latestResultsRef.current = null;
      lastVideoTimeRef.current = -1;
    };

    const start = async () => {
      try {
        setError(null);
        setStatus("starting_camera");

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) throw new Error("Video element not ready.");

        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await video.play();

        // Ensure metadata ready
        await new Promise((resolve) => {
          if (video.readyState >= 2) return resolve();
          video.onloadedmetadata = () => resolve();
        });

        if (cancelled) return;

        setStatus("loading_model");

        // Dynamic import keeps the ~200kB tasks-vision JS out of the initial
        // bundle — it loads only when hand mode is engaged.
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(config.wasmBasePath);
        if (cancelled) return;

        const create = async (delegateChoice) => {
          return await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: config.modelAssetPath,
              delegate: delegateChoice,
            },
            runningMode: "VIDEO",
            numHands: config.numHands,
            // Third port deviation: explicit confidence thresholds — lowered
            // tracking confidence keeps landmarks through moderate motion blur.
            minHandDetectionConfidence: MIN_HAND_DETECTION_CONFIDENCE,
            minHandPresenceConfidence: MIN_HAND_PRESENCE_CONFIDENCE,
            minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
          });
        };

        let lm;

        if (config.delegate === "GPU") {
          lm = await create("GPU");
        } else if (config.delegate === "CPU") {
          lm = await create("CPU");
        } else {
          // AUTO: try GPU then fall back to CPU
          try {
            lm = await create("GPU");
          } catch {
            lm = await create("CPU");
          }
        }

        if (cancelled) {
          lm.close?.();
          return;
        }

        landmarkerRef.current = lm;
        setStatus("running");

        const loop = () => {
          const videoEl = videoRef.current;
          const landmarker = landmarkerRef.current;

          if (!videoEl || !landmarker) return;

          // Only run inference when the video time advances
          if (videoEl.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = videoEl.currentTime;

            const nowMs = performance.now();
            const results = landmarker.detectForVideo(videoEl, nowMs);
            const inferenceMs = performance.now() - nowMs;

            latestResultsRef.current = results;
            onResultsRef.current?.(results, { nowMs, inferenceMs });
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e : new Error(String(e));
        setError(msg);
        setStatus("error");
        cleanup();
      }
    };

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [config]);

  return { videoRef, status, error, latestResultsRef };
}
