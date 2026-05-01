import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WebcamView from './components/WebcamView';
import Flute3D from './components/Flute3D';
import SwaraDisplay from './components/SwaraDisplay';
import { useBansuriStore } from './store/useBansuriStore';

const App: React.FC = () => {
  const { holeStates, isPlaying, webcamReady } = useBansuriStore();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)',
        zIndex: 0,
      }} />

      {/* 3D Flute Scene */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} color="#FFD700" />
            <directionalLight position={[-5, -5, -5]} intensity={0.2} color="#C19A6B" />
            <Flute3D holeStates={holeStates} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Swara Display Overlay */}
      <SwaraDisplay />

      {/* Webcam Preview - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 20,
        width: '200px',
        maxWidth: '30vw',
      }}>
        <WebcamView />
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <h1 style={{
          color: '#DAA520',
          fontSize: '24px',
          fontWeight: '300',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          margin: 0,
          textShadow: '0 0 10px rgba(218, 165, 32, 0.5)',
        }}>
          Bansuri
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          letterSpacing: '2px',
          marginTop: '5px',
        }}>
          Gesture Controlled
        </p>
      </div>

      {/* Instructions / Splash Screen */}
      {(!webcamReady || !isPlaying) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(218, 165, 32, 0.5)',
          textAlign: 'center',
          maxWidth: '450px',
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{ color: '#DAA520', marginBottom: '20px', fontSize: '28px', fontWeight: '300', letterSpacing: '2px' }}>
            Welcome to Bansuri
          </h2>
          
          {useBansuriStore.getState().error ? (
            <div style={{ color: '#ff4d4d', marginBottom: '20px', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '4px' }}>
              {useBansuriStore.getState().error}
            </div>
          ) : !webcamReady ? (
            <div style={{ color: '#fff', marginBottom: '25px' }}>
              <p style={{ marginBottom: '15px' }}>Initializing AI Hand Tracking...</p>
              <div style={{ width: '100%', height: '2px', background: '#333', overflow: 'hidden' }}>
                <div className="loading-bar" style={{ height: '100%', background: '#DAA520' }} />
              </div>
            </div>
          ) : (
            <div style={{ color: '#fff', marginBottom: '25px' }}>
              <p style={{ marginBottom: '15px', color: '#90EE90' }}>✓ Camera & AI Ready</p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
                Click the button below to enable audio and start the gesture recognition.
              </p>
            </div>
          )}

          <button 
            onClick={() => {
              if (webcamReady) {
                useBansuriStore.getState().setPlaying(true);
                import('./systems/audioEngine').then(m => m.audioEngine.initialize());
              }
            }}
            disabled={!webcamReady}
            style={{
              backgroundColor: webcamReady ? '#DAA520' : '#333',
              color: '#000',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: webcamReady ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {webcamReady ? 'Start Playing' : 'Loading...'}
          </button>

          <div style={{ marginTop: '25px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <strong>HOW TO PLAY:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
              <li>Allow Camera Access when prompted.</li>
              <li>Show your <strong>Open Palm</strong> to start the sound.</li>
              <li>Close your <strong>Fist</strong> to stop the sound.</li>
              <li>Move fingers to change notes (Swara).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isPlaying ? '#90EE90' : '#666',
          boxShadow: isPlaying ? '0 0 10px #90EE90' : 'none',
        }} />
        <span style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          letterSpacing: '1px',
        }}>
          {webcamReady ? 'READY' : 'LOADING...'}
        </span>
      </div>
    </div>
  );
};

export default App;