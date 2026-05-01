import type { HoleState, Swara } from '../store/useBansuriStore';

type SwaraFrequencyMap = {
  [K in Exclude<Swara, null>]: number;
} & { null: number };

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

/**
 * CORRECTED Bansuri fingering chart
 * Holes 1-6: hole 1 = nearest blow hole (left index), hole 6 = far end (right ring)
 *
 *  Finger: L.index  L.mid    L.ring   R.index  R.mid    R.ring
 *  Hole:     1        2        3        4        5        6
 *
 *  Pa  — ●  ●  ●  ●  ●  ●   all 6 closed
 *  Dha — ○  ●  ●  ●  ●  ●   hole 1 open  (left index lifts)
 *  Ni  — ○  ○  ●  ●  ●  ●   holes 1-2 open
 *  Sa  — ○  ○  ○  ●  ●  ●   holes 1-3 open  (entire left hand lifts)
 *  Re  — ○  ○  ○  ○  ●  ●   holes 1-4 open
 *  Ga  — ○  ○  ○  ○  ○  ●   holes 1-5 open  (only right ring stays down)
 *  Ma  — ↑  ○  ○  ○  ○  ○   left index tilted strongly upward (half/full lift + tilt)
 *
 *  ● = CLOSED  ○ = OPEN  ↑ = index tilted up (Ma gesture)
 *
 * Reading the image: for Ga, left index is UP, left middle+ring are DOWN on flute,
 * right hand fingers are all UP. This matches: hole1=OPEN, hole2=CLOSED, hole3=CLOSED,
 * holes4-6=OPEN. But per the sequential pattern above Ga = holes1-5 open, hole6 closed.
 *
 * ACTUAL pattern from image + user confirmation:
 *  Ga  — index UP, middle+ring DOWN on left hand, right hand all UP
 *       = hole1 OPEN, hole2 CLOSED, hole3 CLOSED, holes4-6 OPEN
 *
 * This means the notes are NOT purely sequential by hole number.
 * The real bansuri scale uses this left-hand-only pattern for the lower notes:
 *
 *  Pa  — L:●●●  R:●●●   all closed
 *  Dha — L:●●●  R:●●○   right ring opens
 *  Ni  — L:●●●  R:●○○   right mid+ring open
 *  Sa  — L:●●●  R:○○○   right hand all open
 *  Re  — L:●●○  R:○○○   left ring opens
 *  Ga  — L:●○○  R:○○○   left mid+ring open (only left index stays)  ← IMAGE CONFIRMS
 *  Ma  — L:↑○○  R:○○○   left index tilted up strongly
 */

const C = 'CLOSED' as HoleState;
const H = 'HALF_OPEN' as HoleState;
const O = 'OPEN' as HoleState;

// [hole1, hole2, hole3, hole4, hole5, hole6]
// hole1=L.index, hole2=L.middle, hole3=L.ring, hole4=R.index, hole5=R.middle, hole6=R.ring
const FINGERING_TABLE: { pattern: HoleState[]; swara: Swara }[] = [
  { pattern: [H, O, O, O, O, O], swara: 'Ma'  }, // left index tilted up
  { pattern: [C, C, C, C, C, C], swara: 'Pa'  }, // all closed
  { pattern: [C, C, C, C, C, O], swara: 'Dha' }, // right ring opens
  { pattern: [C, C, C, C, O, O], swara: 'Ni'  }, // right mid+ring open
  { pattern: [C, C, C, O, O, O], swara: 'Sa'  }, // right hand all open
  { pattern: [C, C, O, O, O, O], swara: 'Re'  }, // left ring + right hand open
  { pattern: [C, O, O, O, O, O], swara: 'Ga'  }, // only left index closed
];

function matchScore(detected: HoleState[], pattern: HoleState[]): number {
  let score = 0;
  for (let i = 0; i < 6; i++) {
    if (detected[i] === pattern[i]) score += 2;
    else if (detected[i] === 'HALF_OPEN' || pattern[i] === 'HALF_OPEN') score += 1;
  }
  return score;
}

export function mapHolesToSwara(holeStates: HoleState[]): Swara {
  if (holeStates[0] === 'HALF_OPEN') return 'Ma';

  let bestSwara: Swara = 'Sa';
  let bestScore = -1;

  for (const { pattern, swara } of FINGERING_TABLE) {
    if (swara === 'Ma') continue;
    const score = matchScore(holeStates, pattern);
    if (score > bestScore) {
      bestScore = score;
      bestSwara = swara;
    }
  }

  return bestSwara;
}
