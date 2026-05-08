// Vercel cron hits this endpoint twice a day (see vercel.json) to send the
// morning and evening push notifications. Tokens come from Supabase
// `push_tokens`; auth is via `Authorization: Bearer ${CRON_SECRET}`.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../src/lib/supabase/admin";

export async function GET(req: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // 2. Fetch all tokens from Supabase
  const { data: tokens, error } = await supabaseAdmin
    .from("push_tokens")
    .select("expo_token");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tokens || tokens.length === 0)
    return NextResponse.json({ sent: 0, message: "No tokens found" });

  const expoTokens = tokens.map((t) => t.expo_token);
  const message =
    type === "morning"
      ? "☀️ Morning check-in — how are you feeling?"
      : "🌙 Evening reflection — log your day.";

  // 3. Send to Expo Push API
  const expoPayload = expoTokens.map((token) => ({
    to: token,
    sound: "default",
    body: message,
    data: { type },
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expoPayload),
  });

  return NextResponse.json({
    sent: expoTokens.length,
    status: response.status,
  });
}
