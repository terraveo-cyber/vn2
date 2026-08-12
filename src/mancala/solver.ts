// Iterative-deepening minimax solver with alpha-beta pruning for the Mancala engine.
//
// Suggestion priority for the side to move (mirrors the product requirement):
//   1. A move that provably WINS (ends with more stones in your store than the opponent's).
//   2. Failing that, a move that provably DRAWS (equal final store counts).
//   3. Failing that, the move with the best proven-or-estimated store differential.
//
// "Provable" means the search reached actual game-over states on every explored
// line without ever falling back to the heuristic depth cutoff — tracked via
// `cutoffHit`. If cutoffHit stays false for a completed depth iteration, the
// resulting value is the true game-theoretic outcome, not an estimate.

import {
  MancalaState,
  Side,
  applyMove,
  cloneState,
  isGameOver,
  legalMoves,
  pitLabel,
} from './engine';

export interface MoveEvaluation {
  pit: number;
  pitLabel: string;
  diff: number; // projected storeT - storeO
  exact: boolean;
  depthSearched: number;
  projectedStoreT: number;
  projectedStoreO: number;
  outcome: 'WIN' | 'DRAW' | 'LOSS' | 'UNKNOWN';
}

export interface SolveResult {
  turn: Side;
  moves: MoveEvaluation[]; // sorted best-first for `turn`
  bestMove: MoveEvaluation | null;
  depthSearched: number;
  exact: boolean;
  timedOut: boolean;
}

export interface SolveOptions {
  timeBudgetMs?: number;
  nodeBudget?: number;
  minDepth?: number;
  maxDepth?: number;
  depthStep?: number;
}

interface SearchResult {
  diff: number;
  exact: boolean;
  finalStoreT: number;
  finalStoreO: number;
}

interface Budget {
  deadline: number;
  nodeLimit: number;
  nodes: number;
  cutoffHit: boolean;
  aborted: boolean;
}

function heuristic(state: MancalaState): number {
  const tPits = state.pits[0] + state.pits[1] + state.pits[2] + state.pits[3] + state.pits[4] + state.pits[5];
  const oPits = state.pits[6] + state.pits[7] + state.pits[8] + state.pits[9] + state.pits[10] + state.pits[11];
  return (state.storeT - state.storeO) + 0.1 * (tPits - oPits);
}

function search(state: MancalaState, depth: number, alpha: number, beta: number, budget: Budget): SearchResult {
  budget.nodes++;
  if (budget.aborted || budget.nodes > budget.nodeLimit || Date.now() > budget.deadline) {
    budget.aborted = true;
    return { diff: heuristic(state), exact: false, finalStoreT: state.storeT, finalStoreO: state.storeO };
  }

  if (isGameOver(state)) {
    return { diff: state.storeT - state.storeO, exact: true, finalStoreT: state.storeT, finalStoreO: state.storeO };
  }

  if (depth <= 0) {
    budget.cutoffHit = true;
    return { diff: heuristic(state), exact: false, finalStoreT: state.storeT, finalStoreO: state.storeO };
  }

  const moves = legalMoves(state);
  const maximizing = state.turn === 'TERRANOVA';
  let best: SearchResult | null = null;

  for (const m of moves) {
    const { state: next } = applyMove(state, m);
    const result = search(next, depth - 1, alpha, beta, budget);

    if (
      best === null ||
      (maximizing && result.diff > best.diff) ||
      (!maximizing && result.diff < best.diff)
    ) {
      best = result;
    }

    if (maximizing) alpha = Math.max(alpha, best.diff);
    else beta = Math.min(beta, best.diff);

    if (alpha >= beta || budget.aborted) break;
  }

  if (best === null) {
    best = { diff: state.storeT - state.storeO, exact: true, finalStoreT: state.storeT, finalStoreO: state.storeO };
  }

  return best;
}

function outcomeFor(diffFinal: number, exact: boolean): MoveEvaluation['outcome'] {
  if (!exact) return 'UNKNOWN';
  if (diffFinal > 0) return 'WIN';
  if (diffFinal < 0) return 'LOSS';
  return 'DRAW';
}

const rankScore = (m: MoveEvaluation, forSide: Side) => {
  // Rank from the perspective of `forSide`: WIN > DRAW > (best diff) > LOSS,
  // matching "win, else draw, else best available" priority.
  const signedDiff = forSide === 'TERRANOVA' ? m.diff : -m.diff;
  const outcomeForSide: MoveEvaluation['outcome'] =
    m.outcome === 'UNKNOWN' ? 'UNKNOWN' : m.outcome === 'DRAW' ? 'DRAW' : (signedDiff > 0 ? 'WIN' : 'LOSS');

  let bucket = 0;
  if (m.exact && outcomeForSide === 'WIN') bucket = 3;
  else if (m.exact && outcomeForSide === 'DRAW') bucket = 2;
  else if (!m.exact) bucket = 1;
  else bucket = 0; // exact loss

  return bucket * 1000 + signedDiff;
};

export function solveBestMoves(rootState: MancalaState, options: SolveOptions = {}): SolveResult {
  const {
    timeBudgetMs = 4000,
    nodeBudget = 600000,
    minDepth = 4,
    maxDepth = 26,
    depthStep = 2,
  } = options;

  const deadline = Date.now() + timeBudgetMs;
  const rootMoves = legalMoves(rootState);

  if (rootMoves.length === 0 || isGameOver(rootState)) {
    return { turn: rootState.turn, moves: [], bestMove: null, depthSearched: 0, exact: true, timedOut: false };
  }

  let lastGood: SolveResult | null = null;
  let nodesUsed = 0;

  for (let depth = minDepth; depth <= maxDepth; depth += depthStep) {
    const budget: Budget = {
      deadline,
      nodeLimit: nodeBudget - nodesUsed,
      nodes: 0,
      cutoffHit: false,
      aborted: false,
    };

    const evaluations: MoveEvaluation[] = [];

    for (const pit of rootMoves) {
      const { state: child } = applyMove(cloneState(rootState), pit);
      const result = search(child, depth - 1, -Infinity, Infinity, budget);

      evaluations.push({
        pit,
        pitLabel: pitLabel(pit),
        diff: result.diff,
        exact: result.exact && !budget.aborted,
        depthSearched: depth,
        projectedStoreT: result.finalStoreT,
        projectedStoreO: result.finalStoreO,
        outcome: outcomeFor(result.diff, result.exact && !budget.aborted),
      });

      if (budget.aborted) break;
    }

    nodesUsed += budget.nodes;

    const timedOut = budget.aborted || Date.now() > deadline;

    if (evaluations.length === rootMoves.length && !timedOut) {
      evaluations.sort((a, b) => rankScore(b, rootState.turn) - rankScore(a, rootState.turn));
      lastGood = {
        turn: rootState.turn,
        moves: evaluations,
        bestMove: evaluations[0] ?? null,
        depthSearched: depth,
        exact: !budget.cutoffHit,
        timedOut: false,
      };

      // Fully proven (no heuristic cutoff anywhere) - deeper search can't change the truth.
      if (!budget.cutoffHit) break;
    } else {
      // This depth iteration didn't finish within budget; keep the previous
      // complete result (if any) and stop deepening further.
      if (lastGood) lastGood = { ...lastGood, timedOut: true };
      break;
    }

    if (Date.now() > deadline || nodesUsed > nodeBudget) break;
  }

  if (!lastGood) {
    // Even the shallowest depth couldn't complete (extreme edge case) - fall back
    // to a depth-1 heuristic pass so the UI always has something to show.
    const budget: Budget = { deadline: Date.now() + 500, nodeLimit: 50000, nodes: 0, cutoffHit: false, aborted: false };
    const evaluations: MoveEvaluation[] = rootMoves.map((pit) => {
      const { state: child } = applyMove(cloneState(rootState), pit);
      const result = search(child, 1, -Infinity, Infinity, budget);
      return {
        pit,
        pitLabel: pitLabel(pit),
        diff: result.diff,
        exact: result.exact,
        depthSearched: 1,
        projectedStoreT: result.finalStoreT,
        projectedStoreO: result.finalStoreO,
        outcome: outcomeFor(result.diff, result.exact),
      };
    });
    evaluations.sort((a, b) => rankScore(b, rootState.turn) - rankScore(a, rootState.turn));
    lastGood = {
      turn: rootState.turn,
      moves: evaluations,
      bestMove: evaluations[0] ?? null,
      depthSearched: 1,
      exact: false,
      timedOut: true,
    };
  }

  return lastGood;
}
