// Static corporate pages for iaewerx.com, served instead of the Mancala
// Solver app when the request host is iaewerx.com or www.iaewerx.com. These
// pages are plain, unauthenticated, and have no dependency on anything in
// server/auth.ts, server/db.ts, or server/duoClient.ts - they exist entirely
// so this repo can serve a real corporate site on a second domain without
// touching the Mancala Solver's sign-in flow at all.
//
// No logo asset exists anywhere in this repo yet, so the header below uses a
// plain text wordmark rather than an image. Swap in a real logo (e.g.
// public/iaewerx-logo.svg, served the same way the PWA icons already are)
// once one exists.

const SITE_STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #ffffff;
    color: #1a1a1a;
    line-height: 1.6;
  }
  a { color: #2a5db0; }
  a:hover { text-decoration: none; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 0 20px; }
  header.site { border-bottom: 1px solid #e5e5e5; padding: 28px 0; }
  .eyebrow { font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #666; margin: 0 0 6px; }
  .wordmark { font-size: 28px; font-weight: 700; margin: 0; color: #111; }
  main { padding: 48px 0; }
  h1 { font-size: 28px; line-height: 1.4; margin: 0 0 16px; font-weight: 700; }
  h2 { font-size: 20px; margin: 40px 0 16px; }
  p { font-size: 17px; margin: 0 0 16px; }
  ul.brands { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 20px; }
  ul.brands li { font-size: 16px; font-weight: 600; padding: 14px 16px; background: #f5f6f8; border-radius: 8px; }
  dl.contact dt { font-weight: 600; margin-top: 14px; font-size: 15px; color: #444; }
  dl.contact dd { margin: 2px 0 0; font-size: 17px; }
  footer.site { border-top: 1px solid #e5e5e5; padding: 24px 0; margin-top: 48px; font-size: 14px; color: #555; }
  footer.site a { margin-right: 16px; }
  @media (max-width: 480px) {
    h1 { font-size: 24px; }
    .wordmark { font-size: 22px; }
    main { padding: 32px 0; }
  }
`;

function siteShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${SITE_STYLE}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

const SITE_HEADER = `
  <header class="site">
    <div class="wrap">
      <p class="eyebrow">An Illuminated Adaptive E-Works, LLC Studio</p>
      <p class="wordmark">IAeWerx</p>
    </div>
  </header>
`;

const SITE_FOOTER = `
  <footer class="site">
    <div class="wrap">
      <p>&copy; 2026 Illuminated Adaptive E-Works, LLC. All rights reserved. IAeWerx&trade; and Verba Nova&trade; are operating names of Illuminated Adaptive E-Works, LLC.</p>
      <p><a href="/privacy">Privacy</a><a href="/support">Support</a></p>
    </div>
  </footer>
`;

export function corporateHomePage(): string {
  const body = `
    ${SITE_HEADER}
    <main>
      <div class="wrap">
        <h1>IAeWerx and Verba Nova are the software engineering and digital publishing divisions of Illuminated Adaptive E-Works, LLC. We develop specialized mobile applications, field inspection and exam-readiness utilities, and structured electronic publishing systems.</h1>

        <h2>Our Brands</h2>
        <ul class="brands">
          <li>IAeWerx&trade;</li>
          <li>Verba Nova&trade;</li>
          <li>Ambiens Atrium&trade;</li>
          <li>Prosa Prisma&trade;</li>
          <li>LumenLite&trade;</li>
          <li>Polar Ursa AAC Assistant&trade;</li>
          <li>Lumina deLux Worx Engineering Markup Program&trade;</li>
        </ul>

        <h2>Contact</h2>
        <dl class="contact">
          <dt>Legal entity</dt>
          <dd>Illuminated Adaptive E-Works, LLC</dd>
          <dt>Developer inquiries</dt>
          <dd><a href="mailto:dev@iaewerx.com">dev@iaewerx.com</a></dd>
          <dt>App support</dt>
          <dd><a href="mailto:support@iaewerx.com">support@iaewerx.com</a></dd>
        </dl>
      </div>
    </main>
    ${SITE_FOOTER}
  `;
  return siteShell("IAeWerx | Illuminated Adaptive E-Works, LLC", body);
}

export function corporatePrivacyPage(): string {
  const body = `
    <!-- Draft for owner review -->
    ${SITE_HEADER}
    <main>
      <div class="wrap">
        <h1>Privacy Policy</h1>
        <p>This page describes how Illuminated Adaptive E-Works, LLC ("we," "us") handles information on this website, iaewerx.com.</p>

        <h2>What we collect</h2>
        <p>This website does not use cookies, analytics, or tracking scripts, and it does not collect any information automatically. The only information we receive is what you choose to send us directly by emailing dev@iaewerx.com or support@iaewerx.com - for example, your email address, name, and the contents of your message.</p>

        <h2>How we use it</h2>
        <p>We use the information you send us only to respond to your inquiry or support request. We do not sell it or share it with third parties.</p>

        <h2>Our individual apps and products</h2>
        <p>Each app or product developed under the IAeWerx and Verba Nova brands may collect and use information differently, depending on what that app does. Where required, each app provides its own privacy policy describing its specific data practices. This page covers only the iaewerx.com website itself.</p>

        <h2>Contact</h2>
        <p>Questions about this policy can be sent to <a href="mailto:dev@iaewerx.com">dev@iaewerx.com</a>.</p>
      </div>
    </main>
    ${SITE_FOOTER}
  `;
  return siteShell("Privacy Policy | IAeWerx", body);
}

export function corporateSupportPage(): string {
  const body = `
    ${SITE_HEADER}
    <main>
      <div class="wrap">
        <h1>Support</h1>
        <p>For help with any IAeWerx or Verba Nova product, email us at <a href="mailto:support@iaewerx.com">support@iaewerx.com</a>.</p>
        <p>We typically respond within two business days.</p>
      </div>
    </main>
    ${SITE_FOOTER}
  `;
  return siteShell("Support | IAeWerx", body);
}
