import React from 'react';
import { useBansuriStore } from '../store/useBansuriStore';
import type { Swara } from '../store/useBansuriStore';

const SwaraDisplay: React.FC = () => {
  const { currentSwara, isPlaying, holeStates } = useBansuriStore();

  const getHoleLabel = (_index: number, state: string) => {
    if (state === 'CLOSED') return '●';
    if (state === 'HALF_OPEN') return '◐';
    return '○';
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      {/* Main Swara Display */}
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#DAA520',
        textShadow: '0 0 20px rgba(218, 165, 32, 0.8), 0 0 40px rgba(218, 165, 32, 0.4)',
        fontFamily: "'Arial Unicode MS', 'Noto Sans Devanagari', sans-serif",
        marginBottom: '20px',
        opacity: isPlaying ? 1 : 0.3,
        transition: 'opacity 0.3s ease',
      }}>
        {currentSwara || '—'}
      </div>

      {/* Hole States Visualization */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        {holeStates.map((state, index) => (
          <div
            key={index}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              backgroundColor: state === 'CLOSED' 
                ? 'rgba(139, 69, 19, 0.8)' 
                : state === 'HALF_OPEN'
                ? 'rgba(218, 165, 32, 0.6)'
                : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${
                state === 'CLOSED' 
                  ? '#8B4513' 
                  : state === 'HALF_OPEN'
                  ? '#DAA520'
                  : 'rgba(255, 255, 255, 0.3)'
              }`,
              color: '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            {getHoleLabel(index, state)}
          </div>
        ))}
      </div>

      {/* Playing Status */}
      <div style={{
        fontSize: '14px',
        color: isPlaying ? '#90EE90' : '#666',
        letterSpacing: '2px',
        textTransform: 'uppercase',
      }}>
        {isPlaying ? '● Playing' : '○ Stopped'}
      </div>
    </div>
  );
};

export default SwaraDisplay;