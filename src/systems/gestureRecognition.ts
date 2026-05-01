import type { HoleState } from '../store/useBansuriStore';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'START' | 'STOP' | 'NONE';

// MediaPipe hand landmark indices
// Finger tips:  4=thumb, 8=index, 12=middle, 16=ring, 20=pinky
// Finger PIPs:  6=index, 10=middle, 14=ring, 18=pinky
// Finger MCPs:  5=index,  9=middle, 13=ring,  17=pinky
// Thumb IP:     3

// Bansuri fingering (right hand below, left hand above):
// Hole 0 = Left index   (landmark 8)
// Hole 1 = Left middle  (landmark 12)
// Hole 2 = Left ring    (landmark 16)
// Hole 3 = Right index  (landmark 8 of second hand, or right-hand index)
// Hole 4 = Right middle (landmark 12 of second hand)
// Hole 5 = Right ring   (landmark 16 of second hand)
//
// With one hand visible we map the 3 main fingers (index/middle/ring) to holes 0-2
// and treat holes 3-5 as always closed (lower octave assumption).
// With two hands we map both sets.

function fingerCurlRatio(landmarks: NormalizedLandmark[], tip: number, pip: number, mcp: number): number {
  // Returns 0 = fully extended, 1 = fully curled
  // We measure how much the tip has dropped below the MCP in Y (screen coords, Y increases downward)
  const tipY = landmarks[tip].y;
  const pipY = landmarks[pip].y;
  const mcpY = landmarks[mcp].y;

  // Extended: tip.y < pip.y (tip is above pip)
  // Curled:   tip.y > mcp.y (tip is below mcp)
  const range = mcpY - pipY; // positive when hand is upright
  if (range <= 0) return 0;
  const curl = tipY - pipY;
  return Math.max(0, Math.min(1, curl / range));
}

function getFingerStates(hand: NormalizedLandmark[]): HoleState[] {
  // Index finger: tip=8, pip=6, mcp=5
  // Middle finger: tip=12, pip=10, mcp=9
  // Ring finger: tip=16, pip=14, mcp=13

  const fingers = [
    { tip: 8, pip: 6, mcp: 5 },   // index
    { tip: 12, pip: 10, mcp: 9 },  // middle
    { tip: 16, pip: 14, mcp: 13 }, // ring
  ];

  return fingers.map(({ tip, pip, mcp }) => {
    const curl = fingerCurlRatio(hand, tip, pip, mcp);
    if (curl > 0.55) return 'CLOSED';
    if (curl > 0.25) return 'HALF_OPEN';
    return 'OPEN';
  });
}

// Detect Ma: index finger is tilted/partially curled (HALF_OPEN) while others are closed
// This matches the real bansuri technique of half-holing with the index finger
function detectMaHalfHole(hand: NormalizedLandmark[]): boolean {
  const indexCurl = fingerCurlRatio(hand, 8, 6, 5);
  const middleCurl = fingerCurlRatio(hand, 12, 10, 9);
  const ringCurl = fingerCurlRatio(hand, 16, 14, 13);

  // Ma = index half-curled (0.2–0.5), middle and ring closed
  return indexCurl >= 0.2 && indexCurl <= 0.52 && middleCurl > 0.5 && ringCurl > 0.5;
}

export function detectHoleStates(landmarks: NormalizedLandmark[][]): HoleState[] {
  if (landmarks.length === 0) {
    return ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];
  }

  if (landmarks.length === 1) {
    const hand = landmarks[0];

    // Check for Ma half-hole gesture first
    if (detectMaHalfHole(hand)) {
      // Hole 0 = HALF_OPEN (index), rest closed — triggers Ma in audioMapping
      return ['HALF_OPEN', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED'];
    }

    const [s0, s1, s2] = getFingerStates(hand);
    // Map left hand (holes 0-2), assume right hand holes 3-5 closed
    return [s0, s1, s2, 'CLOSED', 'CLOSED', 'CLOSED'];
  }

  // Two hands detected — left hand = holes 0-2, right hand = holes 3-5
  // Determine which hand is left/right by X position (lower X = more to the right in mirrored webcam)
  const [handA, handB] = landmarks;
  const leftHand = handA[0].x < handB[0].x ? handA : handB;
  const rightHand = handA[0].x < handB[0].x ? handB : handA;

  if (detectMaHalfHole(leftHand)) {
    return ['HALF_OPEN', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED'];
  }

  const [s0, s1, s2] = getFingerStates(leftHand);
  const [s3, s4, s5] = getFingerStates(rightHand);
  return [s0, s1, s2, s3, s4, s5];
}

// Simple start/stop: open palm = start, fist = stop
let openPalmStart: number | null = null;
let fistStart: number | null = null;
const GESTURE_DURATION = 800;

export function detectGesture(landmarks: NormalizedLandmark[][]): GestureType {
  const now = Date.now();

  if (landmarks.length === 0) {
    openPalmStart = null;
    fistStart = null;
    return 'NONE';
  }

  const hand = landmarks[0];
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  let extended = 0;
  let curled = 0;
  for (let i = 0; i < tips.length; i++) {
    if (hand[tips[i]].y < hand[pips[i]].y) extended++;
    else curled++;
  }

  if (extended >= 3) {
    if (openPalmStart === null) openPalmStart = now;
    else if (now - openPalmStart >= GESTURE_DURATION) {
      openPalmStart = null;
      return 'START';
    }
  } else {
    openPalmStart = null;
  }

  if (curled >= 3) {
    if (fistStart === null) fistStart = now;
    else if (now - fistStart >= GESTURE_DURATION) {
      fistStart = null;
      return 'STOP';
    }
  } else {
    fistStart = null;
  }

  return 'NONE';
}
