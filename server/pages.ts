function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BASE_STYLE = `
  * { box-sizing: border-box; min-width: 0; }
  html, body { margin: 0; padding: 0; background: #111111; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-x: hidden; }
  .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .card { max-width: 400px; width: 100%; background: #181818; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; overflow-wrap: anywhere; }
  h1 { color: #d4af37; font-size: 20px; margin: 0 0 8px; }
  p { color: #aaa; font-size: 14px; line-height: 1.5; }
  input[type=email], input[type=text], textarea { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #333; background: #111; color: #e0e0e0; font-size: 14px; margin: 8px 0 16px; font-family: inherit; }
  textarea { min-height: 70px; resize: vertical; }
  button { width: 100%; padding: 10px 12px; border-radius: 6px; border: none; background: #d4af37; color: #111; font-weight: bold; font-size: 14px; cursor: pointer; }
  button:hover { filter: brightness(1.08); }
  a { color: #d4af37; }
  .error { color: #f87171; font-size: 13px; margin-bottom: 12px; }
  .hint { color: #888; font-size: 12px; margin: -12px 0 12px; }
  .checkbox-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 13px; color: #ccc; }
  .checkbox-row input { width: auto; margin: 0; }
  /* Row/cell lists replace <table> so content that can't fit on one line
     wraps to the next and re-centers, instead of overflowing the card. */
  .list { margin-top: 12px; }
  .list-row {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: 4px 12px; padding: 12px 0; border-bottom: 1px solid #2a2a2a;
    text-align: center; font-size: 13px;
  }
  .list-row:last-child { border-bottom: none; }
  .list-cell { overflow-wrap: anywhere; }
  .list-email { font-weight: 600; }
  .list-meta { color: #888; font-size: 12px; }
  .list-empty { color: #666; text-align: center; padding: 12px 0; font-size: 13px; }
  .revoke { background: #3a1a1a; color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 12px; width: auto; }
  .admin-toggle { background: #1a2a3a; color: #7ec8f2; padding: 4px 8px; border-radius: 4px; font-size: 12px; width: auto; }
  .admin-badge { background: #2a2210; color: #d4af37; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 6px; white-space: nowrap; }
  .row-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  @media (min-width: 520px) {
    .wrap { padding: 24px; }
    .card { padding: 32px; }
  }
`;

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>${body}</body>
</html>`;
}

export function loginPage(opts: { error?: string; sent?: boolean } = {}): string {
  const body = `
    <div class="wrap"><div class="card">
      <h1>Mancala Solver</h1>
      <p>Sign in with your approved email. We'll send you a one-time link, followed by Duo verification.</p>
      ${opts.error ? `<div class="error">${escapeHtml(opts.error)}</div>` : ""}
      ${
        opts.sent
          ? `<p>If that email is approved, a sign-in link is on its way. Check your inbox (and spam folder).</p>`
          : `<form method="POST" action="/login">
              <input type="email" name="email" placeholder="you@example.com" required autofocus />
              <button type="submit">Send sign-in link</button>
            </form>`
      }
    </div></div>
  `;
  return shell("Sign in — Mancala Solver", body);
}

export function errorPage(message: string): string {
  const body = `
    <div class="wrap"><div class="card">
      <h1>Something went wrong</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/login">Back to sign-in</a></p>
    </div></div>
  `;
  return shell("Error — Mancala Solver", body);
}

export function adminPage(opts: {
  adminEmail: string;
  approved: { email: string; approved_at: string; approved_by: string; is_admin: boolean }[];
  users: { email: string; created_at: string; last_login_at: string | null }[];
  message?: string;
}): string {
  const approvedRows = opts.approved
    .map(
      (a) => `<div class="list-row">
        <div class="list-cell list-email">${escapeHtml(a.email)}${a.is_admin ? `<span class="admin-badge">ADMIN</span>` : ""}</div>
        <div class="list-cell list-meta">approved ${new Date(a.approved_at).toLocaleString()} by ${escapeHtml(a.approved_by)}</div>
        <div class="row-actions">
          <form method="POST" action="/admin/revoke" style="margin:0;">
            <input type="hidden" name="email" value="${escapeHtml(a.email)}" />
            <button type="submit" class="revoke" onclick="return confirm('Revoke access for ${escapeHtml(a.email)}?')">Revoke</button>
          </form>
          <form method="POST" action="/admin/toggle-admin" style="margin:0;">
            <input type="hidden" name="email" value="${escapeHtml(a.email)}" />
            <input type="hidden" name="makeAdmin" value="${a.is_admin ? "0" : "1"}" />
            <button type="submit" class="admin-toggle">${a.is_admin ? "Remove admin" : "Make admin"}</button>
          </form>
        </div>
      </div>`
    )
    .join("");

  const userRows = opts.users
    .map(
      (u) => `<div class="list-row">
        <div class="list-cell list-email">${escapeHtml(u.email)}</div>
        <div class="list-cell list-meta">joined ${new Date(u.created_at).toLocaleString()}</div>
        <div class="list-cell list-meta">${u.last_login_at ? `last login ${new Date(u.last_login_at).toLocaleString()}` : "never logged in"}</div>
      </div>`
    )
    .join("");

  const body = `
    <div class="wrap"><div class="card" style="max-width: 640px;">
      <h1>Admin — Mancala Solver</h1>
      <p>Signed in as ${escapeHtml(opts.adminEmail)}. <a href="/">Back to app</a> · <form method="POST" action="/auth/logout" style="display:inline;"><button type="submit" style="width:auto; background:none; color:#d4af37; text-decoration:underline; padding:0;">Sign out</button></form></p>
      ${opts.message ? `<div style="color:#4ade80; font-size:13px; margin-bottom:12px;">${escapeHtml(opts.message)}</div>` : ""}

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Approve emails</h2>
      <form method="POST" action="/admin/approve">
        <textarea name="emails" placeholder="email1@example.com; email2@example.com" required></textarea>
        <div class="hint">Separate multiple emails with semicolons, commas, or new lines.</div>
        <label class="checkbox-row">
          <input type="checkbox" name="grantAdmin" />
          Also grant admin access to these email(s)
        </label>
        <button type="submit">Approve</button>
      </form>

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Approved emails (${opts.approved.length})</h2>
      <div class="list">
        ${approvedRows || `<div class="list-empty">None yet</div>`}
      </div>

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Registered users (${opts.users.length})</h2>
      <div class="list">
        ${userRows || `<div class="list-empty">None yet</div>`}
      </div>
    </div></div>
  `;
  return shell("Admin — Mancala Solver", body);
}
