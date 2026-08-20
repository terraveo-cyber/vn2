import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { parse as parseCookies, serialize as serializeCookie } from "cookie";
import { createServer as createViteServer } from "vite";
import { initSchema } from "./server/db";
import {
  approveEmail,
  consumeLoginToken,
  createLoginToken,
  createSession,
  destroySession,
  dismissAccessRequest,
  getSessionUser,
  isApprovedAdmin,
  isEmailApproved,
  isRateLimited,
  isValidEmail,
  normalizeEmail,
  peekLoginToken,
  requestAccess,
  revokeApprovedEmail,
  setApprovedEmailAdmin,
  signPendingDuo,
  upsertUser,
  verifyPendingDuo,
  type SessionUser,
} from "./server/auth";
import { sendLoginLinkEmail } from "./server/email";
import { getDuoClient } from "./server/duoClient";
import { adminPage, confirmSignInPage, errorPage, loginPage, registerPage } from "./server/pages";
import { pool } from "./server/db";

const SESSION_COOKIE = "session";
const PENDING_DUO_COOKIE = "duo_pending";
const isProd = process.env.NODE_ENV === "production";

function appBaseUrl(): string {
  const url = process.env.APP_BASE_URL;
  if (!url) throw new Error("Missing required environment variable: APP_BASE_URL");
  return url;
}

function adminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("Missing required environment variable: ADMIN_EMAIL");
  return normalizeEmail(email);
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

declare module "express-serve-static-core" {
  interface Request {
    sessionUser?: SessionUser;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // PWA plumbing (service worker, its precache manifest chunk, the web
  // manifest, icons) must stay reachable regardless of auth state. None of
  // it is sensitive - it's just caching/install metadata - and browsers
  // flatly refuse to register a service worker whose script response is a
  // redirect, which is exactly what gating this behind requireAuth would
  // produce for every signed-out visitor.
  if (isProd) {
    const distPath = path.join(process.cwd(), "dist");
    const PUBLIC_ASSET_PATTERN = /^\/(sw\.js|workbox-[\w-]+\.js|registerSW\.js|manifest\.webmanifest|icon-[\w.-]+\.png|apple-touch-icon\.png)$/;
    app.use((req, res, next) => {
      if (PUBLIC_ASSET_PATTERN.test(req.path)) {
        express.static(distPath)(req, res, next);
        return;
      }
      next();
    });
  }

  app.use((req, _res, next) => {
    (req as unknown as { cookies: Record<string, string> }).cookies = parseCookies(req.headers.cookie || "");
    next();
  });
  app.use(express.urlencoded({ extended: false }));

  // --- Public auth routes --------------------------------------------------

  app.get("/login", (req, res) => {
    res.type("html").send(loginPage({ sent: req.query.sent === "1" }));
  });

  app.post(
    "/login",
    asyncHandler(async (req, res) => {
      const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
      const email = normalizeEmail(rawEmail);

      if (!isValidEmail(email)) {
        res.type("html").send(loginPage({ error: "Enter a valid email address." }));
        return;
      }

      if (isRateLimited(email)) {
        res.type("html").send(loginPage({ error: "Too many requests for that email. Try again later." }));
        return;
      }

      // Always show the same response whether or not the email is approved,
      // so this endpoint can't be used to enumerate approved accounts.
      // The admin is implicitly always approved - never needs a separate
      // approved_emails row, which would otherwise be a chicken-and-egg
      // problem for bootstrapping the very first account.
      const approved = email === adminEmail() || (await isEmailApproved(email));
      if (approved) {
        const rawToken = await createLoginToken(email);
        const loginUrl = `${appBaseUrl()}/auth/verify?token=${rawToken}`;
        try {
          await sendLoginLinkEmail(email, loginUrl);
        } catch (err) {
          console.error("[auth] Failed to send login email:", err);
        }
      }

      res.redirect("/login?sent=1");
    })
  );

  app.get("/register", (req, res) => {
    res.type("html").send(registerPage({ sent: req.query.sent === "1" }));
  });

  app.post(
    "/register",
    asyncHandler(async (req, res) => {
      const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";
      const email = normalizeEmail(rawEmail);

      if (!isValidEmail(email)) {
        res.type("html").send(registerPage({ error: "Enter a valid email address." }));
        return;
      }

      if (isRateLimited(email)) {
        res.type("html").send(registerPage({ error: "Too many requests for that email. Try again later." }));
        return;
      }

      if (email === adminEmail() || (await isEmailApproved(email))) {
        res.type("html").send(registerPage({ alreadyApproved: true }));
        return;
      }

      await requestAccess(email);
      res.redirect("/register?sent=1");
    })
  );

  // Visiting the emailed link only *peeks* at the token and shows a plain
  // one-tap confirm page - it does not spend it. Some mail providers
  // prefetch/scan links in emails automatically, which would silently burn
  // a single-use token before the human ever opens the message; requiring
  // an explicit form submit (peekLoginToken never marks anything used)
  // means only a real tap can move the flow forward.
  app.get(
    "/auth/verify",
    asyncHandler(async (req, res) => {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      const email = token ? await peekLoginToken(token) : null;

      if (!email) {
        res.status(400).type("html").send(errorPage("That sign-in link is invalid or has expired. Request a new one."));
        return;
      }

      res.type("html").send(confirmSignInPage({ token }));
    })
  );

  app.post(
    "/auth/verify",
    asyncHandler(async (req, res) => {
      const token = typeof req.body?.token === "string" ? req.body.token : "";
      const email = token ? await consumeLoginToken(token) : null;

      if (!email) {
        res.status(400).type("html").send(errorPage("That sign-in link is invalid or has expired. Request a new one."));
        return;
      }

      const duo = getDuoClient();
      const state = duo.generateState();
      const authUrl = await duo.createAuthUrl(email, state);

      res.setHeader(
        "Set-Cookie",
        serializeCookie(PENDING_DUO_COOKIE, signPendingDuo(email, state), {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        })
      );
      res.redirect(authUrl);
    })
  );

  app.get(
    "/auth/duo/callback",
    asyncHandler(async (req, res) => {
      const cookieVal = req.cookies[PENDING_DUO_COOKIE];
      const pending = cookieVal ? verifyPendingDuo(cookieVal) : null;
      const duoCode = typeof req.query.duo_code === "string" ? req.query.duo_code : "";
      const state = typeof req.query.state === "string" ? req.query.state : "";

      const clearPending = serializeCookie(PENDING_DUO_COOKIE, "", { path: "/", maxAge: 0 });

      if (!pending || !duoCode || !state || pending.state !== state) {
        res.setHeader("Set-Cookie", clearPending);
        res.status(400).type("html").send(errorPage("Your sign-in attempt expired or was invalid. Please try again."));
        return;
      }

      try {
        await getDuoClient().exchangeAuthorizationCodeFor2FAResult(duoCode, pending.email);
      } catch (err) {
        console.error("[auth] Duo verification failed:", err);
        res.setHeader("Set-Cookie", clearPending);
        res.status(401).type("html").send(errorPage("Two-factor verification failed. Please try signing in again."));
        return;
      }

      const userId = await upsertUser(pending.email);
      const sessionToken = await createSession(userId);

      res.setHeader("Set-Cookie", [
        clearPending,
        serializeCookie(SESSION_COOKIE, sessionToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: 14 * 24 * 60 * 60,
        }),
      ]);
      res.redirect("/");
    })
  );

  app.post(
    "/auth/logout",
    asyncHandler(async (req, res) => {
      const token = req.cookies[SESSION_COOKIE];
      if (token) await destroySession(token);
      res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, "", { path: "/", maxAge: 0 }));
      res.redirect("/login");
    })
  );

  // --- Session resolution ----------------------------------------------------

  app.use(
    asyncHandler(async (req, _res, next) => {
      const token = req.cookies[SESSION_COOKIE];
      if (token) {
        req.sessionUser = (await getSessionUser(token)) ?? undefined;
      }
      next();
    })
  );

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.sessionUser) {
      res.redirect("/login");
      return;
    }
    next();
  }

  // True for the env-configured bootstrap admin (ADMIN_EMAIL) or anyone
  // subsequently granted admin rights via the approved_emails table.
  async function isAdminUser(email: string): Promise<boolean> {
    return email === adminEmail() || (await isApprovedAdmin(email));
  }

  const requireAdmin = asyncHandler(async (req, res, next) => {
    if (!req.sessionUser || !(await isAdminUser(req.sessionUser.email))) {
      res.status(404).type("html").send(errorPage("Not found."));
      return;
    }
    next();
  });

  app.get(
    "/api/whoami",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({
        email: req.sessionUser!.email,
        isAdmin: await isAdminUser(req.sessionUser!.email),
      });
    })
  );

  // --- Admin routes ------------------------------------------------------

  app.get(
    "/admin",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const [requests, approved, users] = await Promise.all([
        pool.query(`SELECT email, requested_at FROM access_requests ORDER BY requested_at DESC`),
        pool.query(`SELECT email, approved_at, approved_by, is_admin FROM approved_emails ORDER BY approved_at DESC`),
        pool.query(`SELECT email, created_at, last_login_at FROM users ORDER BY created_at DESC`),
      ]);
      let message: string | undefined;
      if (req.query.approved) message = `Approved ${req.query.approved} email(s).`;
      else if (req.query.revoked) message = "Access revoked.";
      else if (req.query.adminSet) message = "Admin access updated.";
      else if (req.query.dismissed) message = "Request dismissed.";
      res.type("html").send(
        adminPage({
          adminEmail: req.sessionUser!.email,
          requests: requests.rows,
          approved: approved.rows,
          users: users.rows,
          message,
        })
      );
    })
  );

  app.post(
    "/admin/requests/approve",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
      if (isValidEmail(email)) {
        await approveEmail(email, req.sessionUser!.email, false);
        await dismissAccessRequest(email);
      }
      res.redirect("/admin?approved=1");
    })
  );

  app.post(
    "/admin/requests/dismiss",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
      if (isValidEmail(email)) {
        await dismissAccessRequest(email);
      }
      res.redirect("/admin?dismissed=1");
    })
  );

  app.post(
    "/admin/approve",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      // Accepts one or many emails, separated by semicolons, commas,
      // newlines, or whitespace, so a whole list can be pasted at once.
      const raw: string = typeof req.body?.emails === "string" ? req.body.emails : "";
      const grantAdmin = req.body?.grantAdmin === "on";
      const candidates: string[] = raw
        .split(/[;,\n]+/)
        .map((e) => normalizeEmail(e))
        .filter((e) => e.length > 0);
      const uniqueValid: string[] = Array.from(new Set(candidates)).filter((e) => isValidEmail(e));

      for (const email of uniqueValid) {
        await approveEmail(email, req.sessionUser!.email, grantAdmin);
      }
      res.redirect(`/admin?approved=${uniqueValid.length}`);
    })
  );

  app.post(
    "/admin/revoke",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
      if (isValidEmail(email)) {
        await revokeApprovedEmail(email);
      }
      res.redirect("/admin?revoked=1");
    })
  );

  app.post(
    "/admin/toggle-admin",
    requireAuth,
    requireAdmin,
    asyncHandler(async (req, res) => {
      const email = normalizeEmail(typeof req.body?.email === "string" ? req.body.email : "");
      const makeAdmin = req.body?.makeAdmin === "1";
      if (isValidEmail(email)) {
        await setApprovedEmailAdmin(email, makeAdmin);
      }
      res.redirect("/admin?adminSet=1");
    })
  );

  // --- Everything else requires a valid session ------------------------------

  app.use(requireAuth);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  await initSchema();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mancala Solver server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[startup] Failed to start server:", err);
  process.exit(1);
});
