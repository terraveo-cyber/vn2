import { Pool } from "pg";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const pool = new Pool({
  connectionString: requireEnv("DATABASE_URL"),
  // Neon (and most managed Postgres hosts) require TLS; this accepts their
  // certs without pinning a specific CA bundle.
  ssl: { rejectUnauthorized: false },
});

export async function initSchema(): Promise<void> {
  // pgcrypto provides gen_random_uuid(), used as a column default below.
  // Must run before the CREATE TABLE that references it.
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`).catch((err) => {
    console.warn("[db] Could not create pgcrypto extension (may already exist, or role lacks privilege):", err.message);
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS approved_emails (
      email TEXT PRIMARY KEY,
      approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      approved_by TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false
    );

    -- Migration for tables that already existed before is_admin was added.
    ALTER TABLE approved_emails ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS login_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_requests (
      email TEXT PRIMARY KEY,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
