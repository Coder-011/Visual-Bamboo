import type { HoleState, Swara } from '../store/useBansuriStore';

type SwaraFrequencyMap = {
  [K in Exclude<Swara, null>]: number;
} & { null: number };

// Note frequencies for bansuri (C-major scale approximate for Indian swaras)
export const SWARA_FREQUENCIES: SwaraFrequencyMap = {
  'Sa': 261.63,  // C4
  'Re': 293.66,  // D4
  'Ga': 329.63,  // E4
  'Ma': 349.23,  // F4
  'Pa': 392.00,  // G4
  'Dha': 440.00, // A4
  'Ni': 493.88,  // B4
  null: 0,
};

// Fingering rules based on hole states (6 holes, index 0 = top/closest to mouth)
// All holes closed = Pa
// Bottom hole open = Dha
// Bottom 2 open = Ni
// Bottom 3 open = Sa
// Bottom 4 open = Re
// Bottom 5 open = Ga
// Half-hole on top hole = Ma
export function mapHolesToSwara(holeStates: HoleState[]): Swara {
  // Special case: Ma - half-open on top hole (index 0)
  if (holeStates[0] === 'HALF_OPEN') {
    return 'Ma';
  }

  // Count from bottom (index 5 is bottom hole)
  const bottomOpen = holeStates.slice().reverse().filter(h => h === 'OPEN').length;

  switch (bottomOpen) {
    case 0: return 'Pa';   // All closed
    case 1: return 'Dha';  // Bottom open
    case 2: return 'Ni';   // Bottom 2 open
    case 3: return 'Sa';   // Bottom 3 open
    case 4: return 'Re';   // Bottom 4 open
    case 5: return 'Ga';   // Bottom 5 open
    default: return 'Sa';
  }
}