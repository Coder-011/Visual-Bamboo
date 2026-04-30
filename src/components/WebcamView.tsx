import React, { useRef, useEffect, useCallback } from 'react';
import { handTrackingSystem } from '../systems/handTracking';
import { useBansuriStore } from '../store/useBansuriStore';
import { detectGesture, detectHoleStates } from '../systems/gestureRecognition';
import { mapHolesToSwara } from '../systems/audioMapping';
import { audioEngine } from '../systems/audioEngine';

const WebcamView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setWebcamReady, setPlaying, setCurrentSwara, setHoleStates, setGestureActive } = useBansuriStore();

  const handleResults = useCallback((result: any) => {
    const { landmarks } = result;

    // Detect gestures
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

    // Detect hole states and map to swara
    if (gesture !== 'STOP') {
      const holeStates = detectHoleStates(landmarks);
      setHoleStates(holeStates);
      
      const swara = mapHolesToSwara(holeStates);
      setCurrentSwara(swara);
      
      if (swara) {
        audioEngine.playSwara(swara);
      }
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
          
          await handTrackingSystem.initialize(videoRef.current);
          handTrackingSystem.startDetection(handleResults);
          setWebcamReady(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
      }
    };

    initCamera();

    return () => {
      handTrackingSystem.dispose();
      audioEngine.dispose();
    };
  }, [handleResults, setWebcamReady]);

  return (
    <div className="webcam-container">
      <video
        ref={videoRef}
        className="webcam-video"
        style={{ display: 'none' }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="webcam-canvas"
        width={320}
        height={240}
        style={{
          borderRadius: '12px',
          border: '2px solid rgba(218, 165, 32, 0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
};

export default WebcamView;