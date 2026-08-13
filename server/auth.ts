import crypto from "crypto";
import { pool } from "./db";

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const PENDING_DUO_TTL_S = 10 * 60; // 10 minutes

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing required environment variable: SESSION_SECRET");
  return s;
}

function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isValidEmail(email: string): boolean {
  // Deliberately simple: just enough to reject garbage input before it hits
  // the database/email provider, not a full RFC 5322 validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// --- Login (magic-link) tokens -------------------------------------------

export async function createLoginToken(email: string): Promise<string> {
  const raw = randomToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MS);
  await pool.query(
    `INSERT INTO login_tokens (token_hash, email, expires_at) VALUES ($1, $2, $3)`,
    [tokenHash, email, expiresAt]
  );
  return raw;
}

export async function consumeLoginToken(raw: string): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const { rows } = await pool.query(
    `UPDATE login_tokens
     SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING email`,
    [tokenHash]
  );
  return rows[0]?.email ?? null;
}

// --- Approval + user lookup ------------------------------------------------

export async function isEmailApproved(email: string): Promise<boolean> {
  const { rows } = await pool.query(`SELECT 1 FROM approved_emails WHERE email = $1`, [email]);
  return rows.length > 0;
}

export async function approveEmail(email: string, approvedBy: string, isAdmin: boolean = false): Promise<void> {
  await pool.query(
    `INSERT INTO approved_emails (email, approved_by, is_admin) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET is_admin = EXCLUDED.is_admin OR approved_emails.is_admin`,
    [email, approvedBy, isAdmin]
  );
}

export async function revokeApprovedEmail(email: string): Promise<void> {
  await pool.query(`DELETE FROM approved_emails WHERE email = $1`, [email]);
}

export async function setApprovedEmailAdmin(email: string, isAdmin: boolean): Promise<void> {
  await pool.query(`UPDATE approved_emails SET is_admin = $2 WHERE email = $1`, [email, isAdmin]);
}

// True for the env-configured bootstrap admin OR anyone granted admin via
// the approved_emails table (checked separately by the caller, which
// already knows the bootstrap admin's email from ADMIN_EMAIL).
export async function isApprovedAdmin(email: string): Promise<boolean> {
  const { rows } = await pool.query(`SELECT 1 FROM approved_emails WHERE email = $1 AND is_admin = true`, [email]);
  return rows.length > 0;
}

export async function upsertUser(email: string): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET last_login_at = now()
     RETURNING id`,
    [email]
  );
  return rows[0].id as string;
}

// --- Sessions ---------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
}

export async function createSession(userId: string): Promise<string> {
  const raw = randomToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt]
  );
  return raw;
}

export async function getSessionUser(raw: string): Promise<SessionUser | null> {
  const tokenHash = hashToken(raw);
  const { rows } = await pool.query(
    `SELECT u.id, u.email FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function destroySession(raw: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(raw)]);
}

// --- Signed "pending Duo" cookie -------------------------------------------
// A short-lived, HMAC-signed (not DB-backed) cookie holding {email, state}
// between "magic link verified" and "Duo callback returned". Signed so it
// can't be tampered with client-side, but needs no database round-trip.

interface PendingDuo {
  email: string;
  state: string;
  exp: number;
}

export function signPendingDuo(email: string, state: string): string {
  const payload: PendingDuo = { email, state, exp: Math.floor(Date.now() / 1000) + PENDING_DUO_TTL_S };
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret()).update(json).digest("base64url");
  return `${json}.${sig}`;
}

export function verifyPendingDuo(cookieValue: string): PendingDuo | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [json, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", sessionSecret()).update(json).digest("base64url");
  if (!timingSafeEqual(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8")) as PendingDuo;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.email !== "string" || typeof payload.state !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Lightweight per-email rate limiting -----------------------------------
// In-memory only (resets on restart/redeploy). This is an abuse-prevention
// nicety, not the real security boundary - the approved-email allowlist and
// Duo MFA are. Fine for a single-instance, low-traffic deployment.

const loginAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  attempts.push(now);
  loginAttempts.set(key, attempts);
  return attempts.length > RATE_LIMIT_MAX;
}
