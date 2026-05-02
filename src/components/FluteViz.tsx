import React from 'react';
import type { HoleState } from '../store/useBansuriStore';

interface FluteVizProps {
  holeStates: HoleState[];
}

const CYAN = '#00d9ff';
const HOLE_XS = [0.12, 0.24, 0.36, 0.52, 0.64, 0.76]; // fractional positions along flute

const FluteViz: React.FC<FluteVizProps> = ({ holeStates }) => {
  const W = 800, H = 80;
  const fluteY = H / 2;
  const fluteH = 28;
  const r = 9;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 80, display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Flute body */}
      <defs>
        <linearGradient id="fluteGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a1a" />
          <stop offset="50%" stopColor="#2a1a0a" />
          <stop offset="100%" stopColor="#1a0e06" />
        </linearGradient>
        <filter id="holeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Main body */}
      <rect x={20} y={fluteY - fluteH / 2} width={W - 40} height={fluteH} rx={fluteH / 2} fill="url(#fluteGrad)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* Bamboo node rings */}
      {[0.08, 0.3, 0.45, 0.6, 0.88].map((frac, i) => (
        <rect key={i} x={20 + frac * (W - 40) - 3} y={fluteY - fluteH / 2 - 2} width={6} height={fluteH + 4} rx={3} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}

      {/* Blow hole (left end) */}
      <ellipse cx={38} cy={fluteY} rx={5} ry={7} fill="#111" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

      {/* Finger holes */}
      {holeStates.map((state, i) => {
        const cx = 20 + HOLE_XS[i] * (W - 40);
        const closed = state === 'CLOSED';
        const half = state === 'HALF_OPEN';
        return (
          <g key={i}>
            {/* Glow ring when closed */}
            {(closed || half) && (
              <circle cx={cx} cy={fluteY} r={r + 5} fill="none" stroke={CYAN} strokeWidth={1} opacity={closed ? 0.35 : 0.2} filter="url(#holeGlow)" />
            )}
            {/* Hole circle */}
            <circle
              cx={cx} cy={fluteY} r={r}
              fill={closed ? CYAN : half ? `${CYAN}66` : '#0a0e1a'}
              stroke={closed || half ? CYAN : 'rgba(255,255,255,0.2)'}
              strokeWidth={1.5}
              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
            />
            {/* Inner dot when open */}
            {!closed && !half && (
              <circle cx={cx} cy={fluteY} r={3} fill="rgba(255,255,255,0.15)" />
            )}
          </g>
        );
      })}

      {/* Active label above first closed hole */}
      {holeStates.findIndex(s => s === 'CLOSED') !== -1 && (() => {
        const firstClosed = holeStates.findIndex(s => s === 'CLOSED');
        const cx = 20 + HOLE_XS[firstClosed] * (W - 40);
        return (
          <g>
            <line x1={cx} y1={fluteY - fluteH / 2 - 4} x2={cx} y2={fluteY - fluteH / 2 - 14} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
            <rect x={cx - 22} y={fluteY - fluteH / 2 - 26} width={44} height={14} rx={7} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <text x={cx} y={fluteY - fluteH / 2 - 16} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={8} letterSpacing={1}>ACTIVE</text>
          </g>
        );
      })()}
    </svg>
  );
};

export default FluteViz;
