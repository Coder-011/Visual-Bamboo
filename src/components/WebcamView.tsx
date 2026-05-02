import React, { useRef, useEffect, useCallback } from 'react';
import { handTrackingSystem } from '../systems/handTracking';
import { useBansuriStore } from '../store/useBansuriStore';
import { detectGesture, detectHoleStates } from '../systems/gestureRecognition';
import { mapHolesToSwara } from '../systems/audioMapping';
import { audioEngine } from '../systems/audioEngine';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

const CYAN = '#00d9ff';

const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const HOLE_TIPS = [8, 12, 16];

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  holeStates: string[]
) {
  const toX = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const toY = (lm: NormalizedLandmark) => lm.y * h;

  // Skeleton lines — cyan
  ctx.strokeStyle = `${CYAN}99`;
  ctx.lineWidth = 1.5;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(toX(landmarks[a]), toY(landmarks[a]));
    ctx.lineTo(toX(landmarks[b]), toY(landmarks[b]));
    ctx.stroke();
  }

  // All joints — small cyan dots
  for (let i = 0; i < landmarks.length; i++) {
    const x = toX(landmarks[i]);
    const y = toY(landmarks[i]);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = CYAN;
    ctx.fill();
  }

  // Fingertip highlights for hole-covering fingers
  HOLE_TIPS.forEach((tipIdx, holeIdx) => {
    const state = holeStates[holeIdx];
    const x = toX(landmarks[tipIdx]);
    const y = toY(landmarks[tipIdx]);

    // Glow ring
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = state === 'CLOSED' ? CYAN : state === 'HALF_OPEN' ? `${CYAN}88` : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Filled dot
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = state === 'CLOSED' ? CYAN : state === 'HALF_OPEN' ? `${CYAN}88` : 'rgba(255,255,255,0.3)';
    ctx.fill();
  });
}

const WebcamView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestLandmarks = useRef<NormalizedLandmark[][]>([]);
  const latestHoleStates = useRef<string[]>(['OPEN','OPEN','OPEN','OPEN','OPEN','OPEN']);
  const animFrameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const { setWebcamReady, setPlaying, setCurrentSwara, setHoleStates, setGestureActive, setDetectionLatency } = useBansuriStore();

  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { animFrameRef.current = requestAnimationFrame(renderLoop); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { animFrameRef.current = requestAnimationFrame(renderLoop); return; }

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    if (video.readyState >= 2 && video.videoWidth > 0) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0,217,255,0.15)';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Camera loading...', w / 2, h / 2);
    }

    for (const hand of latestLandmarks.current) {
      drawHand(ctx, hand, w, h, latestHoleStates.current);
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const handleResults = useCallback((result: any) => {
    const now = performance.now();
    const latency = now - lastFrameTime.current;
    lastFrameTime.current = now;
    setDetectionLatency(Math.min(latency, 99.9));

    const { landmarks } = result;
    latestLandmarks.current = landmarks;

    const gesture = detectGesture(landmarks);
    if (gesture === 'START') {
      setPlaying(true);
      setGestureActive(true);
      audioEngine.initialize();
    } else if (gesture === 'STOP') {
      setPlaying(false);
      setGestureActive(false);
      audioEngine.stop();
    }

    const holeStates = detectHoleStates(landmarks);
    latestHoleStates.current = holeStates;
    setHoleStates(holeStates);

    const swara = mapHolesToSwara(holeStates);
    setCurrentSwara(swara);

    const { isPlaying } = useBansuriStore.getState();
    if (isPlaying && swara) {
      audioEngine.playSwara(swara);
    }
  }, [setPlaying, setCurrentSwara, setHoleStates, setGestureActive, setDetectionLatency]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          lastFrameTime.current = performance.now();
          animFrameRef.current = requestAnimationFrame(renderLoop);

          try {
            await handTrackingSystem.initialize(videoRef.current);
            handTrackingSystem.startDetection(handleResults);
            setWebcamReady(true);
          } catch (aiErr) {
            console.error('AI init failed:', aiErr);
            useBansuriStore.getState().setError(
              `AI Hand Tracking failed: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`
            );
          }
        }
      } catch (err: any) {
        let msg = 'Camera access denied. Please allow camera permissions and refresh.';
        if (err.name === 'NotFoundError') msg = 'No camera found on this device.';
        if (err.name === 'NotReadableError') msg = 'Camera is already in use by another app.';
        useBansuriStore.getState().setError(msg);
      }
    };

    initCamera();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      handTrackingSystem.dispose();
      audioEngine.dispose();
    };
  }, [handleResults, setWebcamReady, renderLoop]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      />
    </div>
  );
};

export default WebcamView;
