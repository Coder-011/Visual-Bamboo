import type { HoleState } from '../store/useBansuriStore';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'START' | 'STOP' | 'NONE';

interface GestureState {
  openPalmStart: number | null;
  fistStart: number | null;
}

const gestureState: GestureState = {
  openPalmStart: null,
  fistStart: null,
};

const GESTURE_DURATION = 1000; // 1 second

function isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
  // Check if all fingers are extended
  const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
  const fingerPips = [6, 10, 14, 18]; // PIP joints

  let extendedCount = 0;
  for (let i = 0; i < fingerTips.length; i++) {
    if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
      extendedCount++;
    }
  }

  // Thumb extended horizontally
  const thumbExtended = Math.abs(landmarks[4].x - landmarks[2].x) > 0.1;

  return extendedCount >= 3 && thumbExtended;
}

function isClosedFist(landmarks: NormalizedLandmark[]): boolean {
  const fingerTips = [8, 12, 16, 20];
  const fingerMCPs = [5, 9, 13, 17];

  let closedCount = 0;
  for (let i = 0; i < fingerTips.length; i++) {
    if (landmarks[fingerTips[i]].y > landmarks[fingerMCPs[i]].y) {
      closedCount++;
    }
  }

  return closedCount >= 3;
}

export function detectGesture(landmarks: NormalizedLandmark[][]): GestureType {
  const now = Date.now();

  if (landmarks.length === 0) {
    gestureState.openPalmStart = null;
    gestureState.fistStart = null;
    return 'NONE';
  }

  // Use first detected hand
  const hand = landmarks[0];

  // Detect start gesture (open palm held for 1 second)
  if (isOpenPalm(hand)) {
    if (gestureState.openPalmStart === null) {
      gestureState.openPalmStart = now;
    } else if (now - gestureState.openPalmStart >= GESTURE_DURATION) {
      gestureState.openPalmStart = null;
      return 'START';
    }
  } else {
    gestureState.openPalmStart = null;
  }

  // Detect stop gesture (closed fist)
  if (isClosedFist(hand)) {
    if (gestureState.fistStart === null) {
      gestureState.fistStart = now;
    } else if (now - gestureState.fistStart >= GESTURE_DURATION) {
      gestureState.fistStart = null;
      return 'STOP';
    }
  } else {
    gestureState.fistStart = null;
  }

  return 'NONE';
}

export function detectHoleStates(landmarks: NormalizedLandmark[][]): HoleState[] {
  // Simplified hole detection based on finger positions
  // In a real implementation, this would map finger positions to flute hole coordinates
  const defaultStates: HoleState[] = ['OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN'];

  if (landmarks.length === 0) return defaultStates;

  const hand = landmarks[0];
  const fingerTips = [8, 12, 16, 20, 4]; // Index, Middle, Ring, Pinky, Thumb

  // Simplified: if finger tip is close to palm, consider it closed
  const palmBase = hand[0];
  const newStates: HoleState[] = [];

  for (let i = 0; i < 6; i++) {
    const fingerIndex = fingerTips[Math.min(i, fingerTips.length - 1)];
    const distance = Math.sqrt(
      Math.pow(hand[fingerIndex].x - palmBase.x, 2) +
      Math.pow(hand[fingerIndex].y - palmBase.y, 2)
    );

    if (distance < 0.05) {
      newStates.push('CLOSED');
    } else if (distance < 0.08) {
      newStates.push('HALF_OPEN');
    } else {
      newStates.push('OPEN');
    }
  }

  return newStates;
}