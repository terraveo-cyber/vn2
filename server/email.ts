import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Missing required environment variable: RESEND_API_KEY");
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendLoginLinkEmail(toEmail: string, loginUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Mancala Solver <onboarding@resend.dev>";

  const { error } = await getClient().emails.send({
    from,
    to: [toEmail],
    subject: "Your Mancala Solver sign-in link",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #a8842a;">Mancala Solver</h2>
        <p>Click the button below to sign in. This link expires in 15 minutes and can only be used once.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}" style="background: #d4af37; color: #111; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Sign in
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <span style="word-break: break-all;">${loginUrl}</span>
        </p>
        <p style="color: #888; font-size: 13px;">
          You'll also need to complete Duo two-factor authentication to finish signing in.
        </p>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
          Didn't request this? You can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
