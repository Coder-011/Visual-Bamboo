import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface HandTrackingResult {
  landmarks: NormalizedLandmark[][];
  timestamp: number;
}

class HandTrackingSystem {
  private handLandmarker: HandLandmarker | null = null;
  private running = false;
  private videoElement: HTMLVideoElement | null = null;
  private onResults: ((result: HandTrackingResult) => void) | null = null;
  private lastVideoTime = -1;

  async initialize(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  startDetection(onResults: (result: HandTrackingResult) => void) {
    this.onResults = onResults;
    this.running = true;
    this.detect();
  }

  stopDetection() {
    this.running = false;
    this.onResults = null;
  }

  private detect = () => {
    if (!this.running || !this.handLandmarker || !this.videoElement) return;

    const startTimeMs = performance.now();
    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      const results = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);

      if (this.onResults) {
        this.onResults({
          landmarks: results.landmarks || [],
          timestamp: startTimeMs,
        });
      }
    }

    requestAnimationFrame(this.detect);
  };

  dispose() {
    this.stopDetection();
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}

export const handTrackingSystem = new HandTrackingSystem();