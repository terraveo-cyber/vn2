// Core Kalah / Mancala (6 pits, 4 stones) rules engine.
// Board representation: a flat array of 12 pits.
//   indices 0-5  = TERRANOVA's pits 1-6 (left to right)
//   indices 6-11 = OPPONENT's pits 1-6 (left to right)
// Stores are tracked separately (storeT, storeO).

export type Side = 'TERRANOVA' | 'OPPONENT';

export interface MancalaState {
  pits: number[]; // length 12
  storeT: number;
  storeO: number;
  turn: Side;
  // True only for a pristine, never-played starting position. Used solely to
  // detect whether the very first move of the game was the "c" pit, which
  // triggers restrictedPit below. Cleared the instant any move is played or
  // the board is edited.
  isFirstMove: boolean;
  // If set, this exact pit index cannot be played on the immediate next
  // move. The only way this gets set is opening the game with the "c" pit
  // (which forbids following it with "f" on the same side); it's cleared
  // again as soon as that next move is played, whatever it was.
  restrictedPit: number | null;
}

export const PITS_PER_SIDE = 6;
export const STARTING_STONES_PER_PIT = 4;
export const STANDARD_TOTAL_STONES = PITS_PER_SIDE * STARTING_STONES_PER_PIT * 2; // 48

export function createInitialState(firstTurn: Side = 'TERRANOVA'): MancalaState {
  return {
    pits: new Array(PITS_PER_SIDE * 2).fill(STARTING_STONES_PER_PIT),
    storeT: 0,
    storeO: 0,
    turn: firstTurn,
    isFirstMove: true,
    restrictedPit: null,
  };
}

export function cloneState(state: MancalaState): MancalaState {
  return {
    pits: state.pits.slice(),
    storeT: state.storeT,
    storeO: state.storeO,
    turn: state.turn,
    isFirstMove: state.isFirstMove,
    restrictedPit: state.restrictedPit,
  };
}

// Pit letter label (a-f) within its own side, e.g. T3 -> "c", O6 -> "f".
export function pitLetter(idx: number): string {
  const posInSide = idx <= 5 ? idx : idx - 6;
  return String.fromCharCode(97 + posInSide);
}

export function totalStones(state: MancalaState): number {
  return state.pits.reduce((a, b) => a + b, 0) + state.storeT + state.storeO;
}

// Pit i (0-11) sits directly across the board from pit (11 - i).
function oppositeIndex(idx: number): number {
  return 11 - idx;
}

export function sideRange(side: Side): [number, number] {
  return side === 'TERRANOVA' ? [0, 5] : [6, 11];
}

export function pitLabel(idx: number): string {
  return idx <= 5 ? `T${idx + 1}` : `O${idx - 6 + 1}`;
}

export function legalMoves(state: MancalaState): number[] {
  const [start, end] = sideRange(state.turn);
  const moves: number[] = [];
  for (let i = start; i <= end; i++) {
    if (state.pits[i] > 0 && i !== state.restrictedPit) moves.push(i);
  }
  return moves;
}

export function isGameOver(state: MancalaState): boolean {
  const tSum = state.pits[0] + state.pits[1] + state.pits[2] + state.pits[3] + state.pits[4] + state.pits[5];
  const oSum = state.pits[6] + state.pits[7] + state.pits[8] + state.pits[9] + state.pits[10] + state.pits[11];
  return tSum === 0 || oSum === 0;
}

export interface MoveResult {
  state: MancalaState;
  extraTurn: boolean;
  captured: number;
  gameOver: boolean;
}

// Circular sowing order (14 slots): T1..T6, TStore, O1..O6, OStore
const toSlot = (pitIdx: number) => (pitIdx <= 5 ? pitIdx : pitIdx + 1);
const fromSlot = (slot: number) => (slot <= 5 ? slot : slot - 1);
const TSTORE_SLOT = 6;
const OSTORE_SLOT = 13;

/** pitIndex must be an absolute pits[] index (0-11) belonging to state.turn and non-empty. */
export function applyMove(state: MancalaState, pitIndex: number): MoveResult {
  const pits = state.pits.slice();
  let storeT = state.storeT;
  let storeO = state.storeO;
  const player = state.turn;

  let stones = pits[pitIndex];
  pits[pitIndex] = 0;

  let slot = toSlot(pitIndex);
  const skipStoreSlot = player === 'TERRANOVA' ? OSTORE_SLOT : TSTORE_SLOT;
  let lastSlot = -1;

  while (stones > 0) {
    slot = (slot + 1) % 14;
    if (slot === skipStoreSlot) continue;
    if (slot === TSTORE_SLOT) {
      storeT++;
    } else if (slot === OSTORE_SLOT) {
      storeO++;
    } else {
      pits[fromSlot(slot)]++;
    }
    stones--;
    lastSlot = slot;
  }

  let extraTurn = false;
  let captured = 0;

  const landedOwnStore = (player === 'TERRANOVA' && lastSlot === TSTORE_SLOT) ||
    (player === 'OPPONENT' && lastSlot === OSTORE_SLOT);

  if (landedOwnStore) {
    extraTurn = true;
  } else if (lastSlot !== TSTORE_SLOT && lastSlot !== OSTORE_SLOT) {
    const lastPitIdx = fromSlot(lastSlot);
    const onOwnSide = player === 'TERRANOVA' ? lastPitIdx <= 5 : lastPitIdx >= 6;
    if (onOwnSide && pits[lastPitIdx] === 1) {
      const oppIdx = oppositeIndex(lastPitIdx);
      if (pits[oppIdx] > 0) {
        captured = pits[lastPitIdx] + pits[oppIdx];
        if (player === 'TERRANOVA') storeT += captured; else storeO += captured;
        pits[lastPitIdx] = 0;
        pits[oppIdx] = 0;
      }
    }
  }

  const tSum = pits[0] + pits[1] + pits[2] + pits[3] + pits[4] + pits[5];
  const oSum = pits[6] + pits[7] + pits[8] + pits[9] + pits[10] + pits[11];
  let gameOver = false;
  if (tSum === 0 || oSum === 0) {
    storeT += tSum;
    storeO += oSum;
    for (let i = 0; i < 12; i++) pits[i] = 0;
    gameOver = true;
    extraTurn = false;
  }

  const nextTurn: Side = gameOver
    ? state.turn
    : extraTurn
      ? player
      : player === 'TERRANOVA' ? 'OPPONENT' : 'TERRANOVA';

  // Opening rule: c may not be immediately followed by f (on the same side).
  // c and f are each individually fine as the opening move otherwise.
  let nextRestrictedPit: number | null = null;
  if (state.isFirstMove) {
    const [openerStart] = sideRange(player);
    if (pitIndex - openerStart === 2) {
      nextRestrictedPit = openerStart + 5;
    }
  }

  return {
    state: { pits, storeT, storeO, turn: nextTurn, isFirstMove: false, restrictedPit: nextRestrictedPit },
    extraTurn,
    captured,
    gameOver,
  };
}
