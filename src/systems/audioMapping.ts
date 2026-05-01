import type { HoleState, Swara } from '../store/useBansuriStore';

type SwaraFrequencyMap = {
  [K in Exclude<Swara, null>]: number;
} & { null: number };

// Bansuri C-major scale — standard concert pitch
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
 * Bansuri fingering chart — holes[0..5] = holes 1–6 (top = blow hole end)
 *
 *  Hole:   1(idx0)  2(idx1)  3(idx2)  4(idx3)  5(idx4)  6(idx5)
 *  Finger: L.index  L.mid    L.ring   R.index  R.mid    R.ring
 *
 *  Pa  — ●  ●  ●  ●  ●  ●   (all 6 closed)
 *  Dha — ●  ●  ●  ●  ●  ○   (top 5 closed, hole 6 open)
 *  Ni  — ●  ●  ●  ●  ○  ○   (top 4 closed, holes 5-6 open)
 *  Sa  — ●  ●  ●  ○  ○  ○   (top 3 closed, holes 4-6 open)
 *  Re  — ●  ●  ○  ○  ○  ○   (top 2 closed, holes 3-6 open)
 *  Ga  — ●  ○  ○  ○  ○  ○   (top 1 closed, holes 2-6 open)
 *  Ma  — ◐  ○  ○  ○  ○  ○   (hole 1 half-covered, rest open)
 *
 *  ● = CLOSED  ◐ = HALF_OPEN  ○ = OPEN
 */

const C = 'CLOSED' as HoleState;
const H = 'HALF_OPEN' as HoleState;
const O = 'OPEN' as HoleState;

const FINGERING_TABLE: { pattern: HoleState[]; swara: Swara }[] = [
  { pattern: [H, O, O, O, O, O], swara: 'Ma'  }, // hole 1 half-covered
  { pattern: [C, C, C, C, C, C], swara: 'Pa'  }, // all 6 closed
  { pattern: [C, C, C, C, C, O], swara: 'Dha' }, // top 5 closed
  { pattern: [C, C, C, C, O, O], swara: 'Ni'  }, // top 4 closed
  { pattern: [C, C, C, O, O, O], swara: 'Sa'  }, // top 3 closed
  { pattern: [C, C, O, O, O, O], swara: 'Re'  }, // top 2 closed
  { pattern: [C, O, O, O, O, O], swara: 'Ga'  }, // top 1 closed
];

/**
 * Score how well a detected hole state matches a fingering pattern.
 * CLOSED/OPEN mismatches cost more than HALF_OPEN ambiguity.
 */
function matchScore(detected: HoleState[], pattern: HoleState[]): number {
  let score = 0;
  for (let i = 0; i < 6; i++) {
    if (detected[i] === pattern[i]) {
      score += 2; // exact match
    } else if (detected[i] === 'HALF_OPEN' || pattern[i] === 'HALF_OPEN') {
      score += 1; // partial credit for half-open ambiguity
    }
    // mismatch = 0
  }
  return score;
}

export function mapHolesToSwara(holeStates: HoleState[]): Swara {
  // Ma is unambiguous — half-hole on index finger
  if (holeStates[0] === 'HALF_OPEN') return 'Ma';

  let bestSwara: Swara = 'Sa';
  let bestScore = -1;

  for (const { pattern, swara } of FINGERING_TABLE) {
    if (swara === 'Ma') continue; // already handled above
    const score = matchScore(holeStates, pattern);
    if (score > bestScore) {
      bestScore = score;
      bestSwara = swara;
    }
  }

  return bestSwara;
}
