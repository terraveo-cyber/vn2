import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crown,
  Equal,
  Frown,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Undo2,
  Users,
} from 'lucide-react';
import {
  MancalaState,
  Side,
  applyMove,
  cloneState,
  createInitialState,
  isGameOver,
  legalMoves,
  pitLetter,
  totalStones,
  STANDARD_TOTAL_STONES,
} from '../mancala/engine';
import { MoveEvaluation, SolveResult } from '../mancala/solver';
import type { SolverRequest, SolverResponse } from '../mancala/solver.worker';

const WIN_THRESHOLD = 25; // majority of the standard 48-stone game
const DRAW_TOTAL_PER_SIDE = 24;

const TOP_ROW_VISUAL = [11, 10, 9, 8, 7, 6]; // O6..O1, left to right
const BOTTOM_ROW_VISUAL = [0, 1, 2, 3, 4, 5]; // T1..T6, left to right

let requestCounter = 0;

export const MancalaSolver: React.FC = () => {
  const [firstMove, setFirstMove] = useState<Side>('TERRANOVA');
  const [state, setState] = useState<MancalaState>(() => createInitialState('TERRANOVA'));
  const [history, setHistory] = useState<MancalaState[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [lastMoveNote, setLastMoveNote] = useState<string | null>(null);

  const [solving, setSolving] = useState<boolean>(false);
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const pendingRequestId = useRef<number>(0);

  useEffect(() => {
    const worker = new Worker(new URL('../mancala/solver.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<SolverResponse>) => {
      const { requestId, result, error } = event.data;
      if (requestId !== pendingRequestId.current) return; // stale response
      setSolving(false);
      if (error) {
        setSolveError(error);
        setSolveResult(null);
      } else if (result) {
        setSolveError(null);
        setSolveResult(result);
      }
    };
    worker.onerror = (err) => {
      setSolving(false);
      setSolveError(err.message || 'Solver worker crashed');
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const runSolve = (targetState: MancalaState) => {
    if (isGameOver(targetState) || !workerRef.current) return;
    const requestId = ++requestCounter;
    pendingRequestId.current = requestId;
    setSolving(true);
    setSolveError(null);
    const req: SolverRequest = { requestId, state: cloneState(targetState) };
    workerRef.current.postMessage(req);
  };

  const gameOver = isGameOver(state);
  const stonesTotal = totalStones(state);
  const stonesMismatch = stonesTotal !== STANDARD_TOTAL_STONES;

  const playMove = (pit: number) => {
    if (editMode || gameOver) return;
    const moves = legalMoves(state);
    if (!moves.includes(pit)) return;

    setHistory((h) => [...h, cloneState(state)]);
    const { state: next, extraTurn, captured, gameOver: over } = applyMove(state, pit);
    setState(next);
    setSolveResult(null);

    const who = state.turn;
    if (over) {
      setLastMoveNote(`${who} sowed from ${pitDisplayLabel(pit)} — the game has ended.`);
    } else if (extraTurn) {
      setLastMoveNote(`${who} sowed from ${pitDisplayLabel(pit)} and landed in their store — free extra turn.`);
    } else if (captured > 0) {
      setLastMoveNote(`${who} sowed from ${pitDisplayLabel(pit)} and captured ${captured} stones.`);
    } else {
      setLastMoveNote(`${who} sowed from ${pitDisplayLabel(pit)}.`);
    }

    if (!over) runSolve(next);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setState(prev);
      setSolveResult(null);
      setLastMoveNote(null);
      return h.slice(0, -1);
    });
  };

  const resetBoard = () => {
    const fresh = createInitialState(firstMove);
    setState(fresh);
    setHistory([]);
    setSolveResult(null);
    setSolveError(null);
    setLastMoveNote(null);
    if (fresh.turn === 'TERRANOVA') runSolve(fresh);
  };

  const setTurn = (side: Side) => {
    setState((s) => ({ ...s, turn: side }));
    setSolveResult(null);
  };

  const editPit = (idx: number, value: number) => {
    const v = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    setState((s) => {
      const pits = s.pits.slice();
      pits[idx] = v;
      return { ...s, pits, isFirstMove: false, restrictedPit: null };
    });
  };

  const editStore = (side: 'T' | 'O', value: number) => {
    const v = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    setState((s) =>
      side === 'T'
        ? { ...s, storeT: v, isFirstMove: false, restrictedPit: null }
        : { ...s, storeO: v, isFirstMove: false, restrictedPit: null }
    );
  };

  const finishEditing = () => {
    setEditMode(false);
    setSolveResult(null);
    setLastMoveNote(null);
    setHistory([]);
    if (!isGameOver(state) && state.turn === 'TERRANOVA') runSolve(state);
  };

  const bestMove = solveResult?.bestMove ?? null;
  const bestPit = bestMove?.pit;
  const currentLegalMoves = !editMode && !gameOver ? legalMoves(state) : [];
  const openingRestrictedPit = !editMode && !gameOver ? state.restrictedPit : null;

  const winnerText = useMemo(() => {
    if (!gameOver) return null;
    if (state.storeT > state.storeO) return `TERRANOVA wins, ${state.storeT} – ${state.storeO}.`;
    if (state.storeO > state.storeT) return `OPPONENT wins, ${state.storeO} – ${state.storeT}.`;
    return `Draw, ${state.storeT} – ${state.storeO}.`;
  }, [gameOver, state.storeT, state.storeO]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#d4af37] flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Mancala Solver
          </h2>
          <p className="text-xs text-[#888] mt-1 max-w-xl">
            Set up the current board, choose who moves next, and the solver searches for a
            TERRANOVA move that wins outright ({WIN_THRESHOLD}+ stones). If no win is provable,
            it falls back to the best move that can still force a draw ({DRAW_TOTAL_PER_SIDE}–{DRAW_TOTAL_PER_SIDE}),
            or otherwise the strongest available move.
          </p>
          <p className="text-[11px] text-[#888]/80 mt-1 max-w-xl">
            House rule: <span className="text-[#e0e0e0] font-semibold">c</span> and{' '}
            <span className="text-[#e0e0e0] font-semibold">f</span> are each fine as the opening
            move on their own — opening with c just can't be immediately followed by f.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-[11px] text-[#aaa] bg-[#181818] border border-[#333] rounded px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-[#d4af37]" />
            Moves first:
            <select
              value={firstMove}
              onChange={(e) => setFirstMove(e.target.value as Side)}
              className="bg-[#111] border border-[#333] rounded px-1.5 py-0.5 text-[#e0e0e0] text-[11px] font-semibold focus:outline-none focus:border-[#d4af37]"
            >
              <option value="TERRANOVA">TERRANOVA</option>
              <option value="OPPONENT">OPPONENT</option>
            </select>
          </label>

          <button
            onClick={resetBoard}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] text-xs font-semibold transition"
            title="Reset to the standard 4-4-4-4-4-4 starting position"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
            New Game
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="rounded-2xl bg-gradient-to-b from-[#3a2a17] to-[#2a1d10] border border-[#4a3620] p-5 sm:p-8 shadow-xl">
        {/* OPPONENT label bar */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded ${state.turn === 'OPPONENT' && !gameOver ? 'bg-[#d4af37] text-black' : 'bg-black/30 text-[#e8c874]'}`}>
            OPPONENT
          </span>
          <span className="text-[11px] text-[#e8c874]/80 font-mono">Store: {state.storeO}</span>
        </div>

        <div className="flex items-stretch gap-2 sm:gap-3">
          <StoreCapsule label="OPPONENT" value={state.storeO} editable={editMode} onChange={(v) => editStore('O', v)} accent="amber" />

          <div className="flex-1 grid grid-rows-2 gap-5 sm:gap-7">
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {TOP_ROW_VISUAL.map((idx) => (
                <Pit
                  key={idx}
                  idx={idx}
                  value={state.pits[idx]}
                  editable={editMode}
                  playable={currentLegalMoves.includes(idx)}
                  openingForbidden={openingRestrictedPit === idx}
                  highlighted={!editMode && bestPit === idx}
                  labelPosition="above"
                  onChange={(v) => editPit(idx, v)}
                  onPlay={() => playMove(idx)}
                />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {BOTTOM_ROW_VISUAL.map((idx) => (
                <Pit
                  key={idx}
                  idx={idx}
                  value={state.pits[idx]}
                  editable={editMode}
                  playable={currentLegalMoves.includes(idx)}
                  openingForbidden={openingRestrictedPit === idx}
                  highlighted={!editMode && bestPit === idx}
                  labelPosition="below"
                  onChange={(v) => editPit(idx, v)}
                  onPlay={() => playMove(idx)}
                />
              ))}
            </div>
          </div>

          <StoreCapsule label="TERRANOVA" value={state.storeT} editable={editMode} onChange={(v) => editStore('T', v)} accent="gold" />
        </div>

        {/* TERRANOVA label bar */}
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded ${state.turn === 'TERRANOVA' && !gameOver ? 'bg-[#d4af37] text-black' : 'bg-black/30 text-[#e8c874]'}`}>
            TERRANOVA
          </span>
          <span className="text-[11px] text-[#e8c874]/80 font-mono">Store: {state.storeT}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => (editMode ? finishEditing() : setEditMode(true))}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition ${
            editMode
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              : 'bg-[#222] hover:bg-[#2a2a2a] text-[#e0e0e0] border-[#3a3a3a]'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          {editMode ? 'Done Editing Board' : 'Edit Board State'}
        </button>

        {!editMode && (
          <>
            <button
              onClick={() => setTurn('TERRANOVA')}
              disabled={gameOver}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition disabled:opacity-40 ${
                state.turn === 'TERRANOVA' ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-[#222] text-[#e0e0e0] border-[#3a3a3a] hover:bg-[#2a2a2a]'
              }`}
            >
              TERRANOVA to move
            </button>
            <button
              onClick={() => setTurn('OPPONENT')}
              disabled={gameOver}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition disabled:opacity-40 ${
                state.turn === 'OPPONENT' ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-[#222] text-[#e0e0e0] border-[#3a3a3a] hover:bg-[#2a2a2a]'
              }`}
            >
              OPPONENT to move
            </button>

            <button
              onClick={undo}
              disabled={history.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#222] hover:bg-[#2a2a2a] text-[#e0e0e0] border border-[#3a3a3a] transition disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5 text-[#d4af37]" />
              Undo
            </button>

            <button
              onClick={() => runSolve(state)}
              disabled={gameOver || solving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#4a90e2] hover:bg-[#3b82f6] text-white transition disabled:opacity-40"
            >
              {solving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {solving ? 'Solving…' : 'Solve Current Position'}
            </button>
          </>
        )}
      </div>

      {stonesMismatch && (
        <p className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-900/50 rounded px-3 py-1.5">
          Board currently holds {stonesTotal} stones (standard Kalah uses {STANDARD_TOTAL_STONES}). Win/draw
          thresholds below assume a {STANDARD_TOTAL_STONES}-stone game — edit pits/stores so the total matches
          if you want those exact thresholds to apply.
        </p>
      )}

      {lastMoveNote && !gameOver && (
        <p className="text-[11px] text-[#aaa] italic">{lastMoveNote}</p>
      )}

      {gameOver && winnerText && (
        <div className="rounded-lg border border-[#d4af37]/50 bg-[#1a1610] px-4 py-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span className="text-sm font-semibold text-[#e0e0e0]">{winnerText}</span>
        </div>
      )}

      {solveError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          Solver error: {solveError}
        </div>
      )}

      {/* Suggestion panel */}
      {!gameOver && solveResult && (
        <SuggestionPanel
          result={solveResult}
          onPlay={(pit) => playMove(pit)}
          playableSide={state.turn}
        />
      )}
    </div>
  );
};

function pitDisplayLabel(idx: number): string {
  return idx <= 5 ? `T${idx + 1}` : `O${idx - 6 + 1}`;
}

// Side-grouped label colors: warm gold family for TERRANOVA (T), cool blue
// family for OPPONENT (O). Prefix (T/O) uses the more saturated shade;
// the a-f position letter uses the lighter shade of the same family.
const LABEL_COLORS = {
  TERRANOVA: { prefix: '#d4af37', letter: '#f3e2b5' },
  OPPONENT: { prefix: '#6fb1e8', letter: '#bfe0fb' },
} as const;

const PitLabel: React.FC<{ idx: number }> = ({ idx }) => {
  const side: Side = idx <= 5 ? 'TERRANOVA' : 'OPPONENT';
  const colors = LABEL_COLORS[side];
  return (
    <span className="text-[10px] font-bold leading-none tracking-wide select-none whitespace-nowrap">
      <span style={{ color: colors.prefix }}>{side === 'TERRANOVA' ? 'T' : 'O'}</span>
      <span style={{ color: colors.letter, fontSize: '0.8em', verticalAlign: 'sub' }}>{pitLetter(idx)}</span>
    </span>
  );
};

const Pit: React.FC<{
  idx: number;
  value: number;
  editable: boolean;
  playable: boolean;
  openingForbidden: boolean;
  highlighted: boolean;
  labelPosition: 'above' | 'below';
  onChange: (v: number) => void;
  onPlay: () => void;
}> = ({ idx, value, editable, playable, openingForbidden, highlighted, labelPosition, onChange, onPlay }) => {
  const label = <PitLabel idx={idx} />;

  const circle = editable ? (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="w-full h-full rounded-full bg-[#e6c98a] text-black text-center font-bold text-sm sm:text-base border-2 border-[#8a6a3a] focus:outline-none focus:border-[#d4af37]"
    />
  ) : (
    <button
      onClick={onPlay}
      disabled={!playable}
      className={`relative w-full h-full rounded-full flex items-center justify-center font-bold text-sm sm:text-lg transition border-2 ${
        highlighted
          ? 'bg-emerald-400 text-black border-emerald-200 shadow-[0_0_0_3px_rgba(74,222,128,0.4)]'
          : 'bg-[#e6c98a] text-[#3a2a17] border-[#8a6a3a]'
      } ${playable ? 'cursor-pointer hover:brightness-110 hover:scale-[1.04]' : 'cursor-default opacity-90'}`}
      title={playable ? 'Play this pit' : openingForbidden ? "Opening rule: c can't be immediately followed by f" : undefined}
    >
      {value}
      {highlighted && (
        <span className="absolute -top-2 -right-1 text-[9px] font-bold bg-emerald-500 text-white rounded-full px-1.5 py-0.5 shadow">
          BEST
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {labelPosition === 'above' && label}
      <div className="w-[90%] aspect-square">{circle}</div>
      {labelPosition === 'below' && label}
    </div>
  );
};

const StoreCapsule: React.FC<{
  label: string;
  value: number;
  editable: boolean;
  onChange: (v: number) => void;
  accent: 'gold' | 'amber';
}> = ({ value, editable, onChange, accent }) => (
  <div
    className={`w-12 sm:w-16 rounded-2xl flex items-center justify-center border-2 ${
      accent === 'gold' ? 'bg-[#f0da9e] border-[#8a6a3a]' : 'bg-[#e6c98a] border-[#8a6a3a]'
    }`}
  >
    {editable ? (
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-10 sm:w-12 bg-transparent text-black text-center font-bold text-base focus:outline-none"
      />
    ) : (
      <span className="text-black font-bold text-lg sm:text-2xl">{value}</span>
    )}
  </div>
);

const outcomeIcon = (m: MoveEvaluation) => {
  if (m.outcome === 'WIN') return <Crown className="w-3.5 h-3.5 text-emerald-400" />;
  if (m.outcome === 'DRAW') return <Equal className="w-3.5 h-3.5 text-blue-400" />;
  if (m.outcome === 'LOSS') return <Frown className="w-3.5 h-3.5 text-red-400" />;
  return <Sparkles className="w-3.5 h-3.5 text-[#888]" />;
};

const outcomeLabel = (m: MoveEvaluation, side: Side) => {
  const forSideDiff = side === 'TERRANOVA' ? m.diff : -m.diff;
  if (m.outcome === 'WIN') return side === 'TERRANOVA' ? 'Forces a win' : 'Forces a win for OPPONENT';
  if (m.outcome === 'DRAW') return 'Forces a draw';
  if (m.outcome === 'LOSS') return side === 'TERRANOVA' ? 'Loses with best play' : 'Loses for OPPONENT with best play';
  return forSideDiff >= 0 ? 'Estimated ahead (search horizon reached)' : 'Estimated behind (search horizon reached)';
};

const SuggestionPanel: React.FC<{
  result: SolveResult;
  onPlay: (pit: number) => void;
  playableSide: Side;
}> = ({ result, onPlay, playableSide }) => {
  const best = result.bestMove;
  return (
    <div className="rounded-xl border border-[#333] bg-[#161616] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          Suggested move for {result.turn}
        </h3>
        <span className="text-[10px] text-[#888] font-mono">
          searched {result.depthSearched} ply
          {result.exact ? ' · proven exact' : result.timedOut ? ' · time/node budget reached' : ' · heuristic estimate'}
        </span>
      </div>

      {best && (
        <div className="px-4 py-3 flex items-center justify-between gap-3 bg-[#1a1a10] border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            {outcomeIcon(best)}
            <div>
              <div className="text-sm font-semibold text-[#e0e0e0]">
                Play {best.pitLabel} — {outcomeLabel(best, result.turn)}
              </div>
              <div className="text-[11px] text-[#888]">
                {best.exact
                  ? `Projected final score — TERRANOVA ${best.projectedStoreT}, OPPONENT ${best.projectedStoreO}`
                  : `Estimated store differential: ${best.diff > 0 ? '+' : ''}${best.diff.toFixed(1)} (TERRANOVA − OPPONENT)`}
              </div>
            </div>
          </div>
          <button
            onClick={() => onPlay(best.pit)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
          >
            <Play className="w-3.5 h-3.5" />
            Play {best.pitLabel}
          </button>
        </div>
      )}

      <ul className="divide-y divide-[#242424]">
        {result.moves.map((m) => (
          <li key={m.pit} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-[#1d1d1d]">
            <div className="flex items-center gap-2">
              {outcomeIcon(m)}
              <span className="font-mono font-bold text-[#e0e0e0] w-8">{m.pitLabel}</span>
              <span className="text-[#aaa]">{outcomeLabel(m, result.turn)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#888] font-mono">
                {m.exact ? `${m.projectedStoreT}–${m.projectedStoreO}` : `Δ ${m.diff > 0 ? '+' : ''}${m.diff.toFixed(1)}`}
              </span>
              <button
                onClick={() => onPlay(m.pit)}
                className="px-2 py-0.5 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] font-semibold"
              >
                Play
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MancalaSolver;
