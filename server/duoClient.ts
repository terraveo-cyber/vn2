import { Client as DuoClient } from "@duosecurity/duo_universal";

let client: DuoClient | null = null;

export function getDuoClient(): DuoClient {
  if (!client) {
    const clientId = process.env.DUO_CLIENT_ID;
    const clientSecret = process.env.DUO_CLIENT_SECRET;
    const apiHost = process.env.DUO_API_HOST;
    const appBaseUrl = process.env.APP_BASE_URL;
    if (!clientId || !clientSecret || !apiHost || !appBaseUrl) {
      throw new Error(
        "Missing required Duo environment variables: DUO_CLIENT_ID, DUO_CLIENT_SECRET, DUO_API_HOST, APP_BASE_URL"
      );
    }
    client = new DuoClient({
      clientId,
      clientSecret,
      apiHost,
      redirectUrl: `${appBaseUrl}/auth/duo/callback`,
    });
  }
  return client;
}
