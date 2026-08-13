function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BASE_STYLE = `
  html, body { margin: 0; padding: 0; background: #111111; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; }
  .card { max-width: 400px; width: 100%; background: #181818; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; }
  h1 { color: #d4af37; font-size: 20px; margin: 0 0 8px; }
  p { color: #aaa; font-size: 14px; line-height: 1.5; }
  input[type=email], input[type=text] { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 6px; border: 1px solid #333; background: #111; color: #e0e0e0; font-size: 14px; margin: 8px 0 16px; }
  button { width: 100%; padding: 10px 12px; border-radius: 6px; border: none; background: #d4af37; color: #111; font-weight: bold; font-size: 14px; cursor: pointer; }
  button:hover { filter: brightness(1.08); }
  a { color: #d4af37; }
  .error { color: #f87171; font-size: 13px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #2a2a2a; }
  th { color: #888; font-weight: normal; }
  .revoke { background: #3a1a1a; color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 12px; width: auto; }
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
  approved: { email: string; approved_at: string; approved_by: string }[];
  users: { email: string; created_at: string; last_login_at: string | null }[];
  message?: string;
}): string {
  const approvedRows = opts.approved
    .map(
      (a) => `<tr>
        <td>${escapeHtml(a.email)}</td>
        <td>${new Date(a.approved_at).toLocaleString()}</td>
        <td>${escapeHtml(a.approved_by)}</td>
        <td>
          <form method="POST" action="/admin/revoke" style="margin:0;">
            <input type="hidden" name="email" value="${escapeHtml(a.email)}" />
            <button type="submit" class="revoke" onclick="return confirm('Revoke access for ${escapeHtml(a.email)}?')">Revoke</button>
          </form>
        </td>
      </tr>`
    )
    .join("");

  const userRows = opts.users
    .map(
      (u) => `<tr>
        <td>${escapeHtml(u.email)}</td>
        <td>${new Date(u.created_at).toLocaleString()}</td>
        <td>${u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "—"}</td>
      </tr>`
    )
    .join("");

  const body = `
    <div class="wrap"><div class="card" style="max-width: 640px;">
      <h1>Admin — Mancala Solver</h1>
      <p>Signed in as ${escapeHtml(opts.adminEmail)}. <a href="/">Back to app</a> · <form method="POST" action="/auth/logout" style="display:inline;"><button type="submit" style="width:auto; background:none; color:#d4af37; text-decoration:underline; padding:0;">Sign out</button></form></p>
      ${opts.message ? `<div style="color:#4ade80; font-size:13px; margin-bottom:12px;">${escapeHtml(opts.message)}</div>` : ""}

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Approve a new email</h2>
      <form method="POST" action="/admin/approve">
        <input type="email" name="email" placeholder="newperson@example.com" required />
        <button type="submit">Approve</button>
      </form>

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Approved emails (${opts.approved.length})</h2>
      <table>
        <tr><th>Email</th><th>Approved</th><th>By</th><th></th></tr>
        ${approvedRows || `<tr><td colspan="4" style="color:#666;">None yet</td></tr>`}
      </table>

      <h2 style="color:#e0e0e0; font-size:15px; margin-top:24px;">Registered users (${opts.users.length})</h2>
      <table>
        <tr><th>Email</th><th>Joined</th><th>Last login</th></tr>
        ${userRows || `<tr><td colspan="3" style="color:#666;">None yet</td></tr>`}
      </table>
    </div></div>
  `;
  return shell("Admin — Mancala Solver", body);
}
