# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page app that solves Mancala (Kalah, 6 pits/4 stones per side) for a two-player match
between "TERRANOVA" and "OPPONENT": given the current board, it suggests a move that provably
wins, else one that provably draws, else the best available move. The entire app sits behind a
custom auth gate (magic-link email + Duo MFA + admin-approved allowlist) — there is no anonymous
access to anything except the login/register pages.

The repo name/history references an earlier "Verba Nova II" ebook-translator project; that was
scrapped and only the Mancala Solver remains (see git history if archaeology is ever needed).

## Commands

Package manager is Bun (`bun.lock` present) even though `package.json` scripts invoke
`tsx`/`vite`/`esbuild` directly.

- `bun install` — install dependencies
- `bun run dev` — start the dev server (`tsx server.ts`); Express runs Vite in middleware mode,
  so this single command serves both the API/auth routes and the React app with HMR
- `bun run build` — production build: `vite build` (client → `dist/`) then bundles `server.ts`
  into `dist/server.cjs` via esbuild
- `bun run start` — run the production build (`node dist/server.cjs`)
- `bun run lint` — type-check only (`tsc --noEmit`); there is no separate lint tool configured
- `bun run clean` — remove `dist/` and `server.js`

There is no test suite/runner in this repo. There's also no build-vs-source mismatch to worry
about for the solver logic itself — `src/mancala/*` is pure TypeScript with no external deps.

## Architecture

### Two runtimes in one process

`server.ts` is the single entry point for both dev and prod. It boots an Express app that:

1. Always exposes `/api/health` unauthenticated.
2. In production, serves PWA assets (service worker, manifest, icons) unauthenticated via an
   explicit path allowlist (`PUBLIC_ASSET_PATTERN`) *before* any auth check — this must stay
   unauthenticated because browsers refuse to register a service worker that gets redirected.
3. Handles all `/login`, `/register`, `/auth/*` routes unauthenticated (see Auth flow below).
4. Applies `requireAuth` to everything else, then hands off to Vite middleware (dev) or serves
   `dist/` + SPA fallback (prod).

The React SPA (`src/`) is a completely separate concern from the server-rendered HTML pages
(`server/pages.ts`) — the SPA only exists behind `requireAuth`; login/register/admin pages are
hand-written HTML strings, not React.

### Auth flow (server/*)

Sign-in is a three-step chain, each step required:

1. **Magic link** (`server/email.ts`, `createLoginToken`/`consumeLoginToken` in `server/auth.ts`):
   user submits email at `/login` → if approved (or is `ADMIN_EMAIL`), a single-use token is
   emailed. `GET /auth/verify?token=` only *peeks* at the token (doesn't consume it) and shows a
   confirm page — this exists specifically so mail-provider link-prescanning can't burn the token
   before a human clicks; the token is only consumed on the subsequent `POST /auth/verify`.
2. **Duo MFA** (`server/duoClient.ts`): after consuming the token, the server signs a short-lived
   HMAC cookie (`duo_pending`, via `signPendingDuo`/`verifyPendingDuo` — not DB-backed) carrying
   `{email, state}` and redirects into Duo's hosted flow. `/auth/duo/callback` verifies the
   returned code against that signed cookie before creating a real session.
3. **Session**: a random token is hashed (SHA-256) and stored in the `sessions` table; the raw
   token goes in an httpOnly cookie. Sessions are looked up by `getSessionUser` and attached to
   `req.sessionUser` by middleware that runs on every request.

Access control is a Postgres allowlist (`approved_emails`), separate from Duo/session identity.
`ADMIN_EMAIL` (env var) is *implicitly* always approved and always an admin — it's never inserted
into `approved_emails`, so admin-status checks (`isAdminUser`) always check both the env var and
the table. Users can self-request access via `/register`, landing in `access_requests`, which an
admin approves or dismisses from `/admin` (`server/pages.ts` → `adminPage`).

`server/db.ts` owns the schema (`initSchema`, run once at startup — idempotent `CREATE TABLE IF
NOT EXISTS` plus ad hoc `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations for older
deployments). There is no separate migration tool; schema changes are made directly in
`initSchema`.

All server config is required env vars that fail closed — see `.env.example` for the full list
and rationale (`APP_BASE_URL`, `ADMIN_EMAIL`, `SESSION_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`,
`DUO_CLIENT_ID`/`DUO_CLIENT_SECRET`/`DUO_API_HOST`). Each accessor (`requireEnv`, `appBaseUrl()`,
etc.) throws immediately rather than falling back to a default.

### Mancala engine + solver (src/mancala/*)

- `engine.ts` is the pure rules engine: board = flat 12-slot `pits[]` array (indices 0-5 =
  TERRANOVA T1-T6, 6-11 = OPPONENT O1-O6) plus separate `storeT`/`storeO` counters. Sowing walks a
  circular 14-slot sequence (12 pits + 2 stores) via `toSlot`/`fromSlot` helpers, skipping the
  opponent's store. Captures, extra turns, game-over sweep-in, and the "opening c can't be
  immediately followed by f" house rule (`isFirstMove`/`restrictedPit`) all live here. This file
  has no dependency on React or the solver — treat it as the single source of truth for legality.
- `solver.ts` is an iterative-deepening minimax with alpha-beta pruning
  (`solveBestMoves`/`search`). Moves are ranked WIN > DRAW > best-heuristic-diff > LOSS from the
  perspective of whoever's turn it is (`rankScore`); `exact: true` on a result means the search
  reached actual terminal states on every line (a proven game-theoretic result), not a heuristic
  estimate — `cutoffHit` tracks whether the depth cutoff was ever hit. Deepening stops as soon as
  a fully-proven (no-cutoff) result is found, or the time/node budget runs out.
- `solver.worker.ts` runs `solveBestMoves` in a Web Worker so the minimax search never blocks the
  UI thread. `MancalaSolver.tsx` posts a `SolverRequest` with an incrementing `requestId` and
  ignores any response whose `requestId` doesn't match the most recently sent one (guards against
  stale responses from a superseded search).

Suggestions are computed **only** for TERRANOVA's turn — never for OPPONENT — enforced both in
`runSolve`'s early return and again via a `useEffect` that clears any stale suggestion whenever
`state.turn` flips away from TERRANOVA. Don't loosen this without confirming it's intentional;
the product framing is "assist TERRANOVA," not "solve for either side."

### Component structure

`App.tsx` is a thin shell (fetches `/api/whoami` to conditionally show an Admin link) wrapping
`components/MancalaSolver.tsx`, which owns essentially all UI state: board state, undo history
(a plain stack of prior `MancalaState` snapshots), edit mode (free-form pit/store editing that
bypasses move legality), and the worker lifecycle. There's no state management library — it's
local `useState`/`useEffect` only.

Server-rendered pages (`server/pages.ts`) are template-string HTML with a shared inline
`<style>` block and a shared `escapeHtml` helper — always escape any user- or DB-derived value
interpolated into these templates (emails, especially, since they're user-submitted).
