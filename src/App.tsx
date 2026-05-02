import React, { useState } from 'react';
import WebcamView from './components/WebcamView';
import FluteViz from './components/FluteViz';
import { useBansuriStore } from './store/useBansuriStore';
import { audioEngine } from './systems/audioEngine';
import { SWARA_FREQUENCIES } from './systems/audioMapping';

const CYAN = '#00d9ff';
const BG = '#0a0e1a';
const PANEL = '#0d1117';
const BORDER = 'rgba(0,217,255,0.15)';

const App: React.FC = () => {
  const { holeStates, isPlaying, webcamReady, error, currentSwara, detectionLatency } = useBansuriStore();
  const [activeNav, setActiveNav] = useState('Studio');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closedCount = holeStates.filter(s => s === 'CLOSED').length;
  const freq = currentSwara ? SWARA_FREQUENCIES[currentSwara] : 0;
  const showSplash = !webcamReady || !isPlaying;

  const handleStart = () => {
    if (webcamReady) {
      useBansuriStore.getState().setPlaying(true);
      audioEngine.initialize();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: BG, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ height: 48, minHeight: 48, background: '#080c16', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 50, flexShrink: 0 }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: CYAN, fontSize: 18, cursor: 'pointer', padding: 4, display: 'none' }}
          className="hamburger"
        >☰</button>

        <span className="logo-desktop" style={{ color: CYAN, fontWeight: 700, fontSize: 16, letterSpacing: 2, whiteSpace: 'nowrap' }}>VisMu</span>
        <span className="logo-mobile" style={{ display: 'none', color: CYAN, fontWeight: 700, fontSize: 15, letterSpacing: 3, whiteSpace: 'nowrap', flex: 1, textAlign: 'center' }}>VISMU STUDIO</span>

        <nav style={{ display: 'flex', gap: 2, flex: 1 }} className="desktop-nav">
          {['Studio', 'Library', 'Live', 'Nodes'].map(tab => (
            <button key={tab} onClick={() => setActiveNav(tab)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeNav === tab ? CYAN : 'rgba(255,255,255,0.45)',
              fontSize: 13, padding: '4px 10px',
              borderBottom: activeNav === tab ? `2px solid ${CYAN}` : '2px solid transparent',
            }}>{tab}</button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer' }}>⚙</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer' }}>👤</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: webcamReady ? CYAN : '#444', boxShadow: webcamReady ? `0 0 6px ${CYAN}` : 'none', display: 'inline-block' }} />
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar" style={{
          width: 220, minWidth: 220, background: '#080c16', borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0,
          transition: 'transform 0.3s',
        }}>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ color: CYAN, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>Control Deck</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>Active Sync: 120 BPM</div>
          </div>

          {[
            { icon: '▦', label: 'PERFORMANCE', active: true },
            { icon: '♪', label: 'NOTE MAPPING', active: false },
            { icon: '◈', label: 'VISUALIZER', active: false },
            { icon: '◉', label: 'AUDIO IO', active: false },
            { icon: '⊞', label: 'MIDI', active: false },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              borderLeft: item.active ? `3px solid ${CYAN}` : '3px solid transparent',
              background: item.active ? 'rgba(0,217,255,0.06)' : 'transparent',
              color: item.active ? CYAN : 'rgba(255,255,255,0.45)',
              fontSize: 12, letterSpacing: 1, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleStart} disabled={!webcamReady} style={{
              background: webcamReady ? CYAN : '#1a2030', color: webcamReady ? '#000' : '#444',
              border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 12, fontWeight: 700,
              letterSpacing: 1, cursor: webcamReady ? 'pointer' : 'not-allowed', width: '100%',
            }}>⚙ Calibrate Sensor</button>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', cursor: 'pointer' }}>ⓘ SUPPORT</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', cursor: 'pointer', marginBottom: 8 }}>📋 LOGS</div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="grid-bg" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Top row: webcam + pitch + config */}
          <div className="top-row" style={{ display: 'flex', flex: '0 0 auto', borderBottom: `1px solid ${BORDER}` }}>

            {/* Webcam panel */}
            <div style={{ flex: '1 1 55%', position: 'relative', background: '#060a12', borderRight: `1px solid ${BORDER}` }}>
              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#fff', backdropFilter: 'blur(4px)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPlaying ? CYAN : '#666', boxShadow: isPlaying ? `0 0 6px ${CYAN}` : 'none' }} />
                HAND TRACKING {isPlaying ? 'ACTIVE' : 'INACTIVE'}
              </div>

              <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, textAlign: 'right', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 1 }}>CONFIDENCE SCORE</div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 300 }}>{isPlaying ? '0.992' : '—'}</div>
              </div>

              <div style={{ width: '100%', aspectRatio: '4/3', maxHeight: 320, overflow: 'hidden' }}>
                <WebcamView />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.4)', borderTop: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 1 }}>INPUT DEVICE</div>
                  <div style={{ color: '#fff', fontSize: 11 }}>Built-in Webcam</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 1 }}>LATENCY</div>
                  <div style={{ color: CYAN, fontSize: 13, fontWeight: 600 }}>{detectionLatency > 0 ? `${detectionLatency.toFixed(1)}ms` : '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, padding: '6px 12px', borderTop: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4466', display: 'inline-block' }} />
                  PRESSURE: {isPlaying ? '45%' : '0%'}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, display: 'inline-block' }} />
                  RESONANCE: {isPlaying ? '88%' : '0%'}
                </span>
              </div>
            </div>

            {/* Right column: pitch + config */}
            <div className="right-col" style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
              {/* Current Pitch */}
              <div style={{ flex: 1, background: PANEL, padding: '16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>CURRENT PITCH</div>
                <div style={{ fontSize: 72, fontWeight: 200, color: '#fff', lineHeight: 1, marginBottom: 12, minHeight: 80, display: 'flex', alignItems: 'center' }}>
                  {currentSwara || '—'}
                </div>
                <div style={{ width: '100%' }}>
                  <div style={{ height: 3, background: '#1a2030', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: isPlaying ? '70%' : '0%', background: `linear-gradient(90deg, #6644ff, ${CYAN})`, transition: 'width 0.3s', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                    <span>{freq > 0 ? `${freq.toFixed(0)}Hz` : '—'}</span>
                    <span>TARGET: {freq > 0 ? `${freq.toFixed(0)}Hz` : '—'}</span>
                    <span style={{ color: CYAN }}>+2 cents</span>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div style={{ background: PANEL, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>⊙</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2 }}>CONFIGURATION</span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                  {holeStates.map((state, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: state === 'CLOSED' ? CYAN : state === 'HALF_OPEN' ? 'rgba(0,217,255,0.35)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${state !== 'OPEN' ? CYAN : 'rgba(255,255,255,0.15)'}`,
                        boxShadow: state === 'CLOSED' ? `0 0 10px ${CYAN}66` : 'none',
                        transition: 'all 0.15s',
                      }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>H{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Total Holes Closed</span>
                  <span style={{ fontSize: 12, color: '#fff', background: '#1a2030', padding: '2px 10px', borderRadius: 4 }}>{closedCount} / 6</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile note section (hidden on desktop) */}
          <div className="mobile-note" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', padding: '16px', borderBottom: `1px solid ${BORDER}`, background: PANEL }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>CURRENT FREQUENCY: {freq > 0 ? `${freq.toFixed(2)} HZ` : '—'}</div>
            <div style={{ fontSize: 56, fontWeight: 200, color: '#fff', lineHeight: 1, marginBottom: 12 }}>{currentSwara || '—'}</div>
            {/* Mobile bar chart */}
            {(() => {
              const NOTES = ['Sa','Re','Ga','Ma','Pa','Dha','Ni'];
              const HEIGHTS = [18, 28, 14, 36, 22, 32, 16];
              return (
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48, marginBottom: 12 }}>
                  {NOTES.map((s, i) => (
                    <div key={s} style={{
                      width: 20, borderRadius: 2,
                      background: s === currentSwara ? CYAN : 'rgba(255,255,255,0.12)',
                      height: s === currentSwara ? 44 : HEIGHTS[i],
                      transition: 'height 0.2s, background 0.2s',
                    }} />
                  ))}
                </div>
              );
            })()}
            {/* Mobile hole indicators */}
            <div style={{ display: 'flex', gap: 8 }}>
              {holeStates.map((state, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: state === 'CLOSED' ? 'rgba(0,217,255,0.15)' : 'transparent',
                    border: `2px solid ${state !== 'OPEN' ? CYAN : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: state !== 'OPEN' ? CYAN : 'rgba(255,255,255,0.3)',
                    fontSize: 12, fontWeight: 700,
                    boxShadow: state === 'CLOSED' ? `0 0 8px ${CYAN}44` : 'none',
                    transition: 'all 0.15s',
                  }}>H{i + 1}</div>
                  <span style={{ fontSize: 8, color: state !== 'OPEN' ? CYAN : 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
                    {state === 'CLOSED' ? 'ACTIVE' : state === 'HALF_OPEN' ? 'HALF' : 'OPEN'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flute visualization */}
          <div style={{ flex: '0 0 auto', background: '#060a12', borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', position: 'relative' }}>
            <FluteViz holeStates={holeStates} />
            <div style={{ position: 'absolute', bottom: 6, right: 16, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
              MODEL ENGINE &nbsp;|&nbsp; <span style={{ color: 'rgba(255,255,255,0.45)' }}>[ V-WOOD-X1 ]</span>
            </div>
          </div>

          {/* Control buttons (desktop) */}
          <div className="desktop-controls" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', gap: 20, padding: '12px 16px', background: '#080c16' }}>
            {[
              { icon: '⊙', label: 'RECORD', panic: false, action: () => {} },
              { icon: '⊡', label: 'SNAPSHOT', panic: false, action: () => {} },
              { icon: '↺', label: 'RESET', panic: false, action: () => useBansuriStore.getState().setPlaying(false) },
              { icon: '⚠', label: 'PANIC', panic: true, action: () => { useBansuriStore.getState().setPlaying(false); audioEngine.stop(); } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} style={{
                background: btn.panic ? 'rgba(255,34,85,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${btn.panic ? 'rgba(255,34,85,0.5)' : BORDER}`,
                borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                color: btn.panic ? '#ff2255' : 'rgba(255,255,255,0.6)',
                fontSize: 18, minWidth: 68,
              }}>
                <span>{btn.icon}</span>
                <span style={{ fontSize: 9, letterSpacing: 1 }}>{btn.label}</span>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{ display: 'none', background: '#080c16', borderTop: `1px solid ${BORDER}`, padding: '8px 0' }}>
        {[
          { icon: '⊙', label: 'RECORD', active: false, action: () => {} },
          { icon: '⊡', label: 'SNAPSHOT', active: false, action: () => {} },
          { icon: '↺', label: 'PANIC', active: true, action: () => { useBansuriStore.getState().setPlaying(false); audioEngine.stop(); } },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: btn.active ? CYAN : 'rgba(255,255,255,0.5)', fontSize: 20, padding: '6px 0',
          }}>
            <span>{btn.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 1, color: btn.active ? CYAN : 'rgba(255,255,255,0.4)' }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ── SPLASH OVERLAY ── */}
      {showSplash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(6,10,18,0.93)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: '36px 40px', maxWidth: 420, width: '90%', textAlign: 'center',
            boxShadow: `0 0 40px rgba(0,217,255,0.08)`,
          }}>
            <div style={{ color: CYAN, fontSize: 22, fontWeight: 700, letterSpacing: 3, marginBottom: 4 }}>VISMU STUDIO</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 1, marginBottom: 24 }}>Bansuri Gesture Controller</div>

            {error ? (
              <div style={{ color: '#ff4466', background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>{error}</div>
            ) : !webcamReady ? (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 14 }}>Initializing AI Hand Tracking...</p>
                <div style={{ height: 2, background: '#1a2030', borderRadius: 1, overflow: 'hidden' }}>
                  <div className="loading-bar" style={{ height: '100%', background: CYAN }} />
                </div>
              </div>
            ) : (
              <div style={{ color: '#4dffaa', fontSize: 13, marginBottom: 20 }}>✓ Camera & AI Ready</div>
            )}

            <button onClick={handleStart} disabled={!webcamReady} style={{
              background: webcamReady ? CYAN : '#1a2030', color: webcamReady ? '#000' : '#444',
              border: 'none', borderRadius: 6, padding: '11px 32px', fontSize: 13,
              fontWeight: 700, letterSpacing: 1, cursor: webcamReady ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
            }}>
              {webcamReady ? 'Start Session' : 'Loading...'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontSize: 11, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
              <strong style={{ color: 'rgba(255,255,255,0.5)' }}>HOW TO PLAY</strong>
              <ul style={{ paddingLeft: 16, marginTop: 6, lineHeight: 1.8 }}>
                <li>Allow camera access when prompted</li>
                <li>Show <strong style={{ color: CYAN }}>👍 Thumbs Up</strong> to start playing</li>
                <li>Show <strong style={{ color: CYAN }}>👎 Thumbs Down</strong> to stop</li>
                <li>Curl fingers to cover holes and play notes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      <style>{`
        @media (max-width: 900px) {
          .right-col { flex: 0 0 240px !important; }
        }
        @media (max-width: 700px) {
          .sidebar { position: fixed !important; left: 0; top: 48px; bottom: 0; z-index: 45;
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-220px)'}; }
          .hamburger { display: flex !important; }
          .desktop-nav { display: none !important; }
          .logo-desktop { display: none !important; }
          .logo-mobile { display: block !important; }
          .right-col { display: none !important; }
          .mobile-note { display: flex !important; }
          .desktop-controls { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .top-row { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
