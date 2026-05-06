// Mobile-side helper that mirrors Anthropic.messages.create but routes
// through the aspera-web `/api/mobile/claude` proxy. The Claude API key
// stays on the server; the mobile app only ships a bearer secret
// (MOBILE_API_SECRET) which is rotatable independently.
//
// The two env vars come from `aspera/.env` (or `eas.json` env block at build
// time). Both are EXPO_PUBLIC_* so they're available in the JS bundle:
//   - EXPO_PUBLIC_API_URL          → the deployed aspera-web origin
//   - EXPO_PUBLIC_MOBILE_API_SECRET → bearer token shared with the server

type Block = { type: string; text?: string };

export type ClaudeProxyResponse = {
  content: Block[];
  stop_reason: string | null;
  usage?: Record<string, number | null | undefined>;
};

// We intentionally accept a loosely-typed `params` so callers can keep
// passing the same shape they used with the SDK (system, messages,
// max_tokens, temperature, model, etc.) without drift.
export type ClaudeProxyParams = {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: unknown;
  messages: unknown[];
};

function getEnv(
  name: "EXPO_PUBLIC_API_URL" | "EXPO_PUBLIC_MOBILE_API_SECRET",
): string | null {
  // process.env is replaced at build time by Expo for EXPO_PUBLIC_* keys.
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function callClaudeViaProxy(
  params: ClaudeProxyParams,
): Promise<ClaudeProxyResponse> {
  const baseUrl = getEnv("EXPO_PUBLIC_API_URL");
  const secret = getEnv("EXPO_PUBLIC_MOBILE_API_SECRET");
  if (!baseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not configured. Set it in aspera/.env or eas.json before building.",
    );
  }
  if (!secret) {
    throw new Error(
      "EXPO_PUBLIC_MOBILE_API_SECRET is not configured. Set it in aspera/.env or eas.json before building.",
    );
  }

  const res = await fetch(`${baseUrl}/api/mobile/claude`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let message = `Claude proxy returned ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // body wasn't JSON — keep the status-code message
    }
    throw new Error(message);
  }

  return (await res.json()) as ClaudeProxyResponse;
}
