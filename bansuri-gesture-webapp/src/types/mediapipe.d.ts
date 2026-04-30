declare module '@mediapipe/tasks-vision' {
  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface HandLandmarkerResult {
    landmarks: NormalizedLandmark[][];
  }

  export class FilesetResolver {
    static forVisionTasks(path: string): Promise<any>;
  }

  export class HandLandmarker {
    static createFromOptions(vision: any, options: any): Promise<HandLandmarker>;
    detectForVideo(video: HTMLVideoElement, timestamp: number): HandLandmarkerResult;
    close(): void;
  }
}