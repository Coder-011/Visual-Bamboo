import type { HoleState } from '../store/useBansuriStore';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'START' | 'STOP' | 'NONE';

/**
 * BANSURI FINGERING (corrected by user):
 *
 *  Pa  — all 6 holes closed
 *  Dha — top 5 closed, hole 6 open
 *  Ni  — top 4 closed, holes 5-6 open
 *  Sa  — top 3 closed, holes 4-6 open
 *  Re  — top 2 closed, holes 3-6 open
 *  Ga  — top 1 closed, holes 2-6 open
 *  Ma  — hole 1 half-covered (index rolled), rest open
 *
 * Hole → finger mapping:
 *  Hole 1 = Left  index  (tip=8,  dip=7, pip=6,  mcp=5)
 *  Hole 2 = Left  middle (tip=12, dip=11,pip=10, mcp=9)
 *  Hole 3 = Left  ring   (tip=16, dip=15,pip=14, mcp=13)
 *  Hole 4 = Right index  (tip=8,  dip=7, pip=6,  mcp=5)
 *  Hole 5 = Right middle (tip=12, dip=11,pip=10, mcp=9)
 *  Hole 6 = Right ring   (tip=16, dip=15,pip=14, mcp=13)
 */

// ─── 3D distance helper ───────────────────────────────────────────────────────
function dist3(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Curl ratio: how curled is a finger, 0 = fully open, 1 = fully closed.
 *
 * Method: compare (tip → MCP distance) to (tip → MCP distance when straight).
 * When a finger is straight, tip-to-MCP distance is maximised.
 * When curled, tip folds back toward MCP so the distance shrinks.
 *
 * We normalise by the finger's own length (MCP → tip along segments)
 * so it works regardless of hand size or camera distance.
 * This is fully rotation-invariant — works for any hand orientation.
 */
function curlRatio(lm: NormalizedLandmark[], tip: number, dip: number, pip: number, mcp: number): number {
  // Actual straight-line distance from tip to MCP
  const tipToMcp = dist3(lm[tip], lm[mcp]);

  // Max possible distance = sum of segment lengths (finger fully extended)
  const fingerLen = dist3(lm[mcp], lm[pip]) + dist3(lm[pip], lm[dip]) + dist3(lm[dip], lm[tip]);

  if (fingerLen < 1e-6) return 0;

  // When straight: tipToMcp ≈ fingerLen → ratio ≈ 1 → curl = 0
  // When curled:   tipToMcp shrinks → ratio < 1 → curl increases
  const straightness = tipToMcp / fingerLen;

  // Convert to curl: 0 = open, 1 = closed
  // straightness ~0.95 = fully open, ~0.5 = fully curled
  return Math.max(0, Math.min(1, (0.95 - straightness) / 0.45));
}

// Finger definitions: [tip, dip, pip, mcp]
const FINGER_DEFS = [
  [8,  7,  6,  5],  // index
  [12, 11, 10, 9],  // middle
  [16, 15, 14, 13], // ring
] as const;

// Thresholds — tuned for side-held flute posture
// A finger resting on a flute hole is only slightly curled (~0.3)
// A lifted finger is nearly straight (~0.1)
const CLOSED_THRESH    = 0.28; // curl ≥ 0.28 → finger is on the hole (CLOSED)
const HALF_OPEN_THRESH = 0.12; // curl 0.12–0.27 → half-hole (Ma)
// curl < 0.12 → finger lifted (OPEN)

function curlToState(curl: number): HoleState {
  if (curl >= CLOSED_THRESH)    return 'CLOSED';
  if (curl >= HALF_OPEN_THRESH) return 'HALF_OPEN';
  return 'OPEN';
}

function getThreeFingerStates(hand: NormalizedLandmark[]): [HoleState, HoleState, HoleState] {
  return FINGER_DEFS.map(([tip, dip, pip, mcp]) =>
    curlToState(curlRatio(hand, tip, dip, pip, mcp))
  ) as [HoleState, HoleState, HoleState];
}

// ─── Ma half-hole ─────────────────────────────────────────────────────────────
// Index finger slightly curled (half-hole), middle + ring fully on holes
function isMaHalfHole(hand: NormalizedLandmark[]): boolean {
  const idxCurl = curlRatio(hand, 8,  7,  6,  5);
  const midCurl = curlRatio(hand, 12, 11, 10, 9);
  const rngCurl = curlRatio(hand, 16, 15, 14, 13);
  return (
    idxCurl >= HALF_OPEN_THRESH && idxCurl < CLOSED_THRESH &&
    midCurl < HALF_OPEN_THRESH &&
    rngCurl < HALF_OPEN_THRESH
  );
}

// ─── Public: hole states ──────────────────────────────────────────────────────
export function detectHoleStates(landmarks: NormalizedLandmark[][]): HoleState[] {
  if (landmarks.length === 0) {
    return ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
  }

  if (landmarks.length === 1) {
    const hand = landmarks[0];
    if (isMaHalfHole(hand)) {
      return ['HALF_OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
    }
    const [h1, h2, h3] = getThreeFingerStates(hand);
    // One hand in frame = left hand (holes 1-3), right hand holes 4-6 open
    return [h1, h2, h3, 'OPEN', 'OPEN', 'OPEN'];
  }

  // Two hands: in mirrored webcam, left hand wrist has higher X value
  const [handA, handB] = landmarks;
  const leftHand  = handA[0].x > handB[0].x ? handA : handB;
  const rightHand = handA[0].x > handB[0].x ? handB : handA;

  if (isMaHalfHole(leftHand)) {
    return ['HALF_OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
  }

  const [h1, h2, h3] = getThreeFingerStates(leftHand);
  const [h4, h5, h6] = getThreeFingerStates(rightHand);
  return [h1, h2, h3, h4, h5, h6];
}

// ─── Start / Stop gestures ────────────────────────────────────────────────────
// 👍 Thumbs UP  = START  (thumb tip far from index MCP, other fingers curled)
// 👎 Thumbs DOWN = STOP  (thumb tip close to pinky side, pointing down)
//
// Uses 3D distances — fully rotation-invariant, works for any hand orientation.

let thumbsUpStart:   number | null = null;
let thumbsDownStart: number | null = null;
const GESTURE_HOLD_MS = 700;

function isThumbsUp(hand: NormalizedLandmark[]): boolean {
  // Thumb tip (4) must be far from the index finger MCP (5) — thumb is extended upward
  const thumbExtended = dist3(hand[4], hand[5]) > dist3(hand[3], hand[5]) * 1.4;

  // Other 4 fingers must be curled — tip closer to wrist than MCP
  const idxCurl = curlRatio(hand, 8,  7,  6,  5);
  const midCurl = curlRatio(hand, 12, 11, 10, 9);
  const rngCurl = curlRatio(hand, 16, 15, 14, 13);
  const pnkCurl = curlRatio(hand, 20, 19, 18, 17);
  const fingersCurled = idxCurl > 0.35 && midCurl > 0.35 && rngCurl > 0.35 && pnkCurl > 0.35;

  // Thumb tip must be above the wrist in Y (pointing up in screen space)
  const thumbPointingUp = hand[4].y < hand[0].y;

  return thumbExtended && fingersCurled && thumbPointingUp;
}

function isThumbsDown(hand: NormalizedLandmark[]): boolean {
  // Same as thumbs up but thumb tip is BELOW the wrist
  const thumbExtended = dist3(hand[4], hand[5]) > dist3(hand[3], hand[5]) * 1.4;

  const idxCurl = curlRatio(hand, 8,  7,  6,  5);
  const midCurl = curlRatio(hand, 12, 11, 10, 9);
  const rngCurl = curlRatio(hand, 16, 15, 14, 13);
  const pnkCurl = curlRatio(hand, 20, 19, 18, 17);
  const fingersCurled = idxCurl > 0.35 && midCurl > 0.35 && rngCurl > 0.35 && pnkCurl > 0.35;

  const thumbPointingDown = hand[4].y > hand[0].y;

  return thumbExtended && fingersCurled && thumbPointingDown;
}

export function detectGesture(landmarks: NormalizedLandmark[][]): GestureType {
  const now = Date.now();

  if (landmarks.length === 0) {
    thumbsUpStart = thumbsDownStart = null;
    return 'NONE';
  }

  const hand = landmarks[0];

  if (isThumbsUp(hand)) {
    if (!thumbsUpStart) thumbsUpStart = now;
    else if (now - thumbsUpStart >= GESTURE_HOLD_MS) {
      thumbsUpStart = null;
      return 'START';
    }
  } else {
    thumbsUpStart = null;
  }

  if (isThumbsDown(hand)) {
    if (!thumbsDownStart) thumbsDownStart = now;
    else if (now - thumbsDownStart >= GESTURE_HOLD_MS) {
      thumbsDownStart = null;
      return 'STOP';
    }
  } else {
    thumbsDownStart = null;
  }

  return 'NONE';
}
