import type { HoleState, Swara } from '../store/useBansuriStore';

type SwaraFrequencyMap = {
  [K in Exclude<Swara, null>]: number;
} & { null: number };

// Bansuri C-major scale frequencies
export const SWARA_FREQUENCIES: SwaraFrequencyMap = {
  'Sa':  261.63, // C4
  'Re':  293.66, // D4
  'Ga':  329.63, // E4
  'Ma':  349.23, // F4
  'Pa':  392.00, // G4
  'Dha': 440.00, // A4
  'Ni':  493.88, // B4
  null: 0,
};

// Real bansuri fingering (6 holes, 0 = topmost near mouth):
//
// Sa  — all 6 holes CLOSED
// Re  — hole 5 OPEN  (bottom pinky open)
// Ga  — holes 4,5 OPEN
// Ma  — hole 0 HALF_OPEN (index finger half-hole), rest closed
// Pa  — holes 3,4,5 OPEN
// Dha — holes 2,3,4,5 OPEN
// Ni  — holes 1,2,3,4,5 OPEN (only top hole closed)

export function mapHolesToSwara(holeStates: HoleState[]): Swara {
  // Ma: top hole is half-open
  if (holeStates[0] === 'HALF_OPEN') return 'Ma';

  const closed = (i: number) => holeStates[i] === 'CLOSED';
  const open   = (i: number) => holeStates[i] === 'OPEN';

  // Sa: all closed
  if ([0,1,2,3,4,5].every(i => closed(i))) return 'Sa';

  // Re: only hole 5 open
  if (closed(0) && closed(1) && closed(2) && closed(3) && closed(4) && open(5)) return 'Re';

  // Ga: holes 4,5 open
  if (closed(0) && closed(1) && closed(2) && closed(3) && open(4) && open(5)) return 'Ga';

  // Pa: holes 3,4,5 open
  if (closed(0) && closed(1) && closed(2) && open(3) && open(4) && open(5)) return 'Pa';

  // Dha: holes 2,3,4,5 open
  if (closed(0) && closed(1) && open(2) && open(3) && open(4) && open(5)) return 'Dha';

  // Ni: holes 1,2,3,4,5 open
  if (closed(0) && open(1) && open(2) && open(3) && open(4) && open(5)) return 'Ni';

  // Fallback: count open holes from bottom for approximate mapping
  const openFromBottom = [5,4,3,2,1,0].filter(i => open(i)).length;
  const map: Swara[] = ['Sa','Re','Ga','Pa','Dha','Ni','Ni'];
  return map[Math.min(openFromBottom, 6)];
}
