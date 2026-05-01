import React, { useRef, useEffect, useCallback } from 'react';
import { handTrackingSystem } from '../systems/handTracking';
import { useBansuriStore } from '../store/useBansuriStore';
import { detectGesture, detectHoleStates } from '../systems/gestureRecognition';
import { mapHolesToSwara } from '../systems/audioMapping';
import { audioEngine } from '../systems/audioEngine';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// MediaPipe hand connections for skeleton drawing
const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17],          // palm
];

// Finger tip indices that correspond to bansuri holes
const HOLE_TIPS = [8, 12, 16]; // index, middle, ring

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
  holeStates: string[]
) {
  const toX = (lm: NormalizedLandmark) => (1 - lm.x) * w; // mirror
  const toY = (lm: NormalizedLandmark) => lm.y * h;

  // Draw connections
  ctx.strokeStyle = 'rgba(218,165,32,0.7)';
  ctx.lineWidth = 2;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(toX(landmarks[a]), toY(landmarks[a]));
    ctx.lineTo(toX(landmarks[b]), toY(landmarks[b]));
    ctx.stroke();
  }

  // Draw all landmarks
  for (let i = 0; i < landmarks.length; i++) {
    const x = toX(landmarks[i]);
    const y = toY(landmarks[i]);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }

  // Highlight hole-covering fingertips
  HOLE_TIPS.forEach((tipIdx, holeIdx) => {
    const state = holeStates[holeIdx];
    const x = toX(landmarks[tipIdx]);
    const y = toY(landmarks[tipIdx]);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    if (state === 'CLOSED') {
      ctx.fillStyle = 'rgba(139,69,19,0.9)';
    } else if (state === 'HALF_OPEN') {
      ctx.fillStyle = 'rgba(218,165,32,0.9)';
    } else {
      ctx.fillStyle = 'rgba(100,200,100,0.7)';
    }
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

const WebcamView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestLandmarks = useRef<NormalizedLandmark[][]>([]);
  const latestHoleStates = useRef<string[]>(['OPEN','OPEN','OPEN','OPEN','OPEN','OPEN']);
  const animFrameRef = useRef<number>(0);

  const { setWebcamReady, setPlaying, setCurrentSwara, setHoleStates, setGestureActive } = useBansuriStore();

  // Render loop: draw video + skeleton on canvas
  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { animFrameRef.current = requestAnimationFrame(renderLoop); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { animFrameRef.current = requestAnimationFrame(renderLoop); return; }

    const w = canvas.width;
    const h = canvas.height;

    // Always fill black so canvas is never blank
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    // Only draw video once it has actual dimensions
    if (video.readyState >= 2 && video.videoWidth > 0) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Camera loading...', w / 2, h / 2);
    }

    for (const hand of latestLandmarks.current) {
      drawHand(ctx, hand, w, h, latestHoleStates.current);
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const handleResults = useCallback((result: any) => {
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
  }, [setPlaying, setCurrentSwara, setHoleStates, setGestureActive]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          animFrameRef.current = requestAnimationFrame(renderLoop);

          try {
            await handTrackingSystem.initialize(videoRef.current);
            handTrackingSystem.startDetection(handleResults);
            setWebcamReady(true);
          } catch (aiErr) {
            console.error('AI Initialization failed:', aiErr);
            useBansuriStore.getState().setError(
              `AI Hand Tracking failed: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`
            );
          }
        }
      } catch (err: any) {
        console.error('Camera error:', err);
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
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        style={{
          borderRadius: '12px',
          border: '2px solid rgba(218,165,32,0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 6, left: 6,
        display: 'flex', gap: 6, fontSize: 10, color: '#fff',
      }}>
        {[['#8B4513','Closed'],['#DAA520','Half'],['#64C864','Open']].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WebcamView;
