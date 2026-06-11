// Ported from ASL-Hand-Coach src/recognition/features.ts (type-stripped,
// logic identical). Handedness is "Left" | "Right" | "Unknown"; a landmark is
// { x, y, z } in MediaPipe normalized image space.

function dist3(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizeHandedness(handedness) {
  if (handedness === "Left" || handedness === "Right") return handedness;
  return "Unknown";
}

/*
 * Convert 21 landmarks into a normalized feature vector:
 * - translate so wrist (0) is the origin
 * - scale by palm size (distance wrist (0) to middle-finger knuckle (9))
 * - mirror X for Left hand so templates can be shared between Left/Right
 *
 * Output vector is length 63: [x0,y0,z0, x1,y1,z1, ... x20,y20,z20]
 */
export function landmarksToFeatureVector(landmarks, handednessIn) {
  const handedness = normalizeHandedness(handednessIn);

  if (!landmarks || landmarks.length !== 21) {
    return { vector: [], palmSize: 0, handedness };
  }

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  // Palm size for scaling. If it's tiny/0, fall back to 1 to avoid division by 0.
  const palmSizeRaw = dist3(wrist, middleMcp);
  const palmSize = palmSizeRaw > 1e-6 ? palmSizeRaw : 1;

  const vector = [];

  for (let i = 0; i < landmarks.length; i++) {
    let x = (landmarks[i].x - wrist.x) / palmSize;
    const y = (landmarks[i].y - wrist.y) / palmSize;
    const z = (landmarks[i].z - wrist.z) / palmSize;

    // Mirror left hand X so templates can be shared
    if (handedness === "Left") x = -x;

    vector.push(x, y, z);
  }

  return { vector, palmSize: palmSizeRaw, handedness };
}
