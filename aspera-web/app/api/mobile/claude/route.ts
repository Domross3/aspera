// Raw Claude passthrough for the mobile app. Accepts the same shape as
// `Anthropic.messages.create` and returns `{ content, stop_reason, usage }`.
//
// Auth: bearer header against MOBILE_API_SECRET.
//
// This exists so the mobile app can keep its prompt-engineering code in-tree
// (claude.ts, searchOrchestrator.ts) without bundling the Anthropic SDK or
// the user's Claude key into the IPA. The thin pass-through trades a tiny bit
// of server work (proxying one HTTP call) for a critical security win:
// `EXPO_PUBLIC_*` values end up extractable from the iOS binary, so the API
// key cannot ride along.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireMobileAuth } from "@/lib/api/auth";

// Non-streaming message creation. We intentionally don't allow stream: true
// here — mobile clients fetch the full JSON response.
type AnthropicMessageCreateParams = Omit<
  Anthropic.Messages.MessageCreateParamsNonStreaming,
  "stream"
>;

export async function POST(req: NextRequest) {
  const denied = requireMobileAuth(req);
  if (denied) return denied;

  const apiKey = process.env.CLAUDE_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CLAUDE_KEY not configured on server" },
      { status: 500 },
    );
  }

  let body: AnthropicMessageCreateParams;
  try {
    body = (await req.json()) as AnthropicMessageCreateParams;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Defensive default — caller must specify the model explicitly anyway.
  if (!("model" in body) || typeof body.model !== "string") {
    return NextResponse.json({ error: "model is required" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(body);
    return NextResponse.json({
      content: message.content,
      stop_reason: message.stop_reason,
      usage: message.usage,
    });
  } catch (err: unknown) {
    console.error("[/api/mobile/claude] error:", err);
    const status =
      err instanceof Anthropic.APIError ? (err.status ?? 500) : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Anthropic call failed" },
      { status },
    );
  }
}
