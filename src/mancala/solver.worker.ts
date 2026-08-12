/// <reference lib="webworker" />
import { MancalaState } from './engine';
import { solveBestMoves, SolveOptions, SolveResult } from './solver';

export interface SolverRequest {
  requestId: number;
  state: MancalaState;
  options?: SolveOptions;
}

export interface SolverResponse {
  requestId: number;
  result?: SolveResult;
  error?: string;
}

self.onmessage = (event: MessageEvent<SolverRequest>) => {
  const { requestId, state, options } = event.data;
  try {
    const result = solveBestMoves(state, options);
    const response: SolverResponse = { requestId, result };
    (self as unknown as Worker).postMessage(response);
  } catch (err: any) {
    const response: SolverResponse = { requestId, error: err?.message || 'Solver failed' };
    (self as unknown as Worker).postMessage(response);
  }
};
