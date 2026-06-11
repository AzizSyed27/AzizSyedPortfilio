// One-euro filter (Casiez, Roussel & Vogel, CHI 2012) for continuous cursor
// smoothing: low cutoff at rest kills jitter, cutoff rises with speed so fast
// moves don't lag. Params are read from the passed object on EVERY call, so
// the ?debug=hand sliders mutating TUNE.oneEuro take effect mid-stream.

function lowPass() {
  let initialized = false;
  let stored = 0;
  return {
    filter(value, alpha) {
      if (!initialized) {
        initialized = true;
        stored = value;
        return value;
      }
      stored = alpha * value + (1 - alpha) * stored;
      return stored;
    },
    reset() {
      initialized = false;
      stored = 0;
    },
  };
}

function alphaFor(cutoff, dt) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export function createOneEuro(params) {
  const x = lowPass();
  const dx = lowPass();
  let lastT = null;
  let prevRaw = null;

  return {
    filter(value, tMs) {
      const dt = lastT !== null && tMs > lastT ? (tMs - lastT) / 1000 : 1 / params.freq;
      lastT = tMs;

      const rate = prevRaw === null ? 0 : (value - prevRaw) / dt;
      prevRaw = value;

      const edx = dx.filter(rate, alphaFor(params.dCutoff, dt));
      const cutoff = params.minCutoff + params.beta * Math.abs(edx);
      return x.filter(value, alphaFor(cutoff, dt));
    },
    reset() {
      x.reset();
      dx.reset();
      lastT = null;
      prevRaw = null;
    },
  };
}

export function createOneEuro2D(params) {
  const fx = createOneEuro(params);
  const fy = createOneEuro(params);
  return {
    filter(point, tMs) {
      return { x: fx.filter(point.x, tMs), y: fy.filter(point.y, tMs) };
    },
    reset() {
      fx.reset();
      fy.reset();
    },
  };
}
