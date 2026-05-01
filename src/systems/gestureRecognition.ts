import type { HoleState } from '../store/useBansuriStore';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'START' | 'STOP' | 'NONE';

/**
 * BANSURI FINGERING REFERENCE (standard 6-hole bamboo flute, C scale)
 *
 * The flute is held horizontally. Left hand is upper (near blow hole),
 * right hand is lower. Holes numbered 1–6 top to bottom:
 *
 *   Sa  (C4) — ALL 6 holes closed
 *   Re  (D4) — holes 1–5 closed, hole 6 open
 *   Ga  (E4) — holes 1–4 closed, holes 5–6 open
 *   Ma  (F4) — holes 2–6 open, hole 1 HALF-covered (left index rolled/tilted)
 *   Pa  (G4) — holes 1–3 closed, holes 4–6 open
 *   Dha (A4) — holes 1–2 closed, holes 3–6 open
 *   Ni  (B4) — hole 1 closed only, holes 2–6 open
 *
 * MediaPipe landmark mapping:
 *   Hole 1 → Left hand  index  finger  (tip=8,  pip=7,  dip=6,  mcp=5)
 *   Hole 2 → Left hand  middle finger  (tip=12, pip=11, dip=10, mcp=9)
 *   Hole 3 → Left hand  ring   finger  (tip=16, pip=15, dip=14, mcp=13)
 *   Hole 4 → Right hand index  finger  (tip=8,  pip=7,  dip=6,  mcp=5)
 *   Hole 5 → Right hand middle finger  (tip=12, pip=11, dip=10, mcp=9)
 *   Hole 6 → Right hand ring   finger  (tip=16, pip=15, dip=14, mcp=13)
 *
 * When only ONE hand is visible we treat it as the LEFT hand (holes 1–3)
 * and assume right hand holes 4–6 are all closed (most notes only need left hand).
 */

// ─── Angle-based curl ────────────────────────────────────────────────────────
// Using 3D dot-product angle between (pip→tip) and (pip→mcp) vectors.
// This is rotation-invariant — works even when the hand is held sideways.

function vec3(a: NormalizedLandmark, b: NormalizedLandmark) {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}

function dot3(u: { x: number; y: number; z: number }, v: typeof u) {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

function mag3(u: { x: number; y: number; z: number }) {
  return Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
}

/**
 * Returns the bend angle (degrees) at the PIP joint.
 * 0° = fully straight/extended, ~90°+ = curled.
 */
function pipAngle(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): number {
  const v1 = vec3(lm[pip], lm[tip]); // pip → tip
  const v2 = vec3(lm[pip], lm[mcp]); // pip → mcp
  const cosA = dot3(v1, v2) / (mag3(v1) * mag3(v2) + 1e-6);
  return Math.acos(Math.max(-1, Math.min(1, cosA))) * (180 / Math.PI);
}

// Thresholds (degrees). Tuned for flute-holding posture.
const CLOSED_ANGLE = 70;    // ≥ 70° = finger is curled down onto hole
const HALF_ANGLE_LO = 35;   // 35–69° = half-hole (Ma technique)
const HALF_ANGLE_HI = 69;
// < 35° = finger is lifted / hole open

function angleToState(angle: number): HoleState {
  if (angle >= CLOSED_ANGLE) return 'CLOSED';
  if (angle >= HALF_ANGLE_LO) return 'HALF_OPEN';
  return 'OPEN';
}

// Finger definitions: [tip, pip, mcp]
const FINGERS = [
  [8,  7,  5],  // index
  [12, 11, 9],  // middle
  [16, 15, 13], // ring
] as const;

function getThreeFingerStates(hand: NormalizedLandmark[]): [HoleState, HoleState, HoleState] {
  return FINGERS.map(([tip, pip, mcp]) =>
    angleToState(pipAngle(hand, tip, pip, mcp))
  ) as [HoleState, HoleState, HoleState];
}

// ─── Ma half-hole detection ───────────────────────────────────────────────────
// Ma is played by rolling/tilting the LEFT index finger so it half-covers hole 1.
// Signature: index is HALF_OPEN, middle and ring are CLOSED.
function isMaHalfHole(hand: NormalizedLandmark[]): boolean {
  const [idx, mid, rng] = getThreeFingerStates(hand);
  return idx === 'HALF_OPEN' && mid === 'CLOSED' && rng === 'CLOSED';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function detectHoleStates(landmarks: NormalizedLandmark[][]): HoleState[] {
  if (landmarks.length === 0) {
    return ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
  }

  if (landmarks.length === 1) {
    const hand = landmarks[0];
    if (isMaHalfHole(hand)) {
      // Hole 1 half-covered, rest open → Ma
      return ['HALF_OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
    }
    const [h1, h2, h3] = getThreeFingerStates(hand);
    // Single hand = left hand (holes 1–3). Right hand holes 4–6 open by default.
    // This allows Sa/Re/Ga/Ma detection with one hand.
    // Pa/Dha/Ni require both hands (or user holds both in frame).
    return [h1, h2, h3, 'OPEN', 'OPEN', 'OPEN'];
  }

  // Two hands: sort by wrist X — in a mirrored webcam feed the LEFT hand
  // wrist (landmark 0) appears on the RIGHT side of the screen (higher X).
  const [handA, handB] = landmarks;
  const leftHand  = handA[0].x > handB[0].x ? handA : handB; // higher X = left in mirror
  const rightHand = handA[0].x > handB[0].x ? handB : handA;

  if (isMaHalfHole(leftHand)) {
    return ['HALF_OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
  }

  const [h1, h2, h3] = getThreeFingerStates(leftHand);
  const [h4, h5, h6] = getThreeFingerStates(rightHand);
  return [h1, h2, h3, h4, h5, h6];
}

// ─── Start / Stop gestures ────────────────────────────────────────────────────
let openPalmStart: number | null = null;
let fistStart: number | null = null;
const GESTURE_HOLD_MS = 800;

export function detectGesture(landmarks: NormalizedLandmark[][]): GestureType {
  const now = Date.now();

  if (landmarks.length === 0) {
    openPalmStart = fistStart = null;
    return 'NONE';
  }

  const hand = landmarks[0];

  // Count extended vs curled fingers (index, middle, ring, pinky)
  let extended = 0, curled = 0;
  for (const [tip, pip, mcp] of FINGERS) {
    const angle = pipAngle(hand, tip, pip, mcp);
    if (angle < 40) extended++; else curled++;
  }
  // Also check pinky
  const pinkyAngle = pipAngle(hand, 20, 19, 17);
  if (pinkyAngle < 40) extended++; else curled++;

  if (extended >= 3) {
    if (!openPalmStart) openPalmStart = now;
    else if (now - openPalmStart >= GESTURE_HOLD_MS) { openPalmStart = null; return 'START'; }
  } else { openPalmStart = null; }

  if (curled >= 3) {
    if (!fistStart) fistStart = now;
    else if (now - fistStart >= GESTURE_HOLD_MS) { fistStart = null; return 'STOP'; }
  } else { fistStart = null; }

  return 'NONE';
}
