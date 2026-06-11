// Ported from ASL-Hand-Coach src/recognition/classify.ts (type-stripped,
// logic identical). Templates are passed in as { label: number[63] } — the
// portfolio defines its own pose set in M1; nothing is bundled here.

// L2 distance between two vectors, with length check
function l2Distance(a, b) {
  if (a.length !== b.length || a.length === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Nearest neighbor template matching by L2 distance.
 * Returns { label, bestLabel, distance } where label is null if:
 * - no templates exist, or
 * - vector length mismatch, or
 * - best distance > threshold (bestLabel still reports the rejected match)
 */
export function classifyNearest(vector, templates, threshold) {
  const entries = Object.entries(templates);

  if (!vector || vector.length === 0 || entries.length === 0) {
    return { label: null, bestLabel: null, distance: Infinity };
  }

  let bestLabel = null;
  let bestDist = Infinity;

  for (const [label, tmpl] of entries) {
    if (!tmpl || tmpl.length !== vector.length) continue;
    const d = l2Distance(vector, tmpl);
    if (d < bestDist) {
      bestDist = d;
      bestLabel = label;
    }
  }

  if (!bestLabel) return { label: null, bestLabel: null, distance: Infinity };

  const accepted = bestDist <= threshold;
  return {
    label: accepted ? bestLabel : null,
    bestLabel,
    distance: bestDist,
  };
}
