// Ported from ASL-Hand-Coach src/recognition/stability.ts (type-stripped,
// logic identical). Debounces a stream of per-frame predictions: a candidate
// is promoted to stable once held for requiredStableMs, and stable clears
// after requiredClearMs of continuous null. Call update() every frame.

export class StabilityFilter {
  constructor(cfg) {
    this.cfg = cfg; // { requiredStableMs, requiredClearMs }

    this.candidate = null;
    this.candidateSinceMs = 0;

    this.stable = null;
    this.stableSinceMs = 0;

    this.nullSinceMs = null;
  }

  update(pred, nowMs) {
    // Track how long we've been "unknown"
    if (pred === null) {
      if (this.nullSinceMs === null) this.nullSinceMs = nowMs;
    } else {
      this.nullSinceMs = null;
    }

    // Candidate logic
    if (pred !== this.candidate) {
      this.candidate = pred;
      this.candidateSinceMs = nowMs;
    }

    const candidateForMs = nowMs - this.candidateSinceMs;

    // Promote candidate to stable if it's non-null and held long enough
    if (this.candidate !== null && candidateForMs >= this.cfg.requiredStableMs) {
      if (this.stable !== this.candidate) {
        this.stable = this.candidate;
        this.stableSinceMs = nowMs;
      }
    }

    // Clear stable if we've been unknown long enough
    if (this.nullSinceMs !== null) {
      const nullForMs = nowMs - this.nullSinceMs;
      if (nullForMs >= this.cfg.requiredClearMs) {
        this.stable = null;
        this.stableSinceMs = nowMs;
      }
    }

    const stableForMs = this.stable ? nowMs - this.stableSinceMs : 0;

    return {
      stable: this.stable,
      stableForMs,
      candidate: this.candidate,
      candidateForMs,
    };
  }
}
