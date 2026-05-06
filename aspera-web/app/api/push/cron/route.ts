// Vercel cron hits this endpoint twice a day (see vercel.json) to send the
// morning and evening push notifications. Tokens come from Supabase
// `push_tokens`; auth is via `Authorization: Bearer ${CRON_SECRET}`.

import { NextRequest, NextResponse } from "next/server";
import Expo from "expo-server-sdk";
import { createServiceClient } from "@/lib/supabase/server";

const MESSAGES = {
  morning: {
    title: "Aspera",
    body: "☀️ Morning check-in — how are you feeling?",
  },
  evening: {
    title: "Aspera",
    body: "📝 Quick — log today before you forget",
  },
} as const;

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret. Required in production; optional in dev so
  // local curls work without setting up the env var.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const type = (req.nextUrl.searchParams.get("type") ?? "evening") as
    | "morning"
    | "evening";
  const message = MESSAGES[type] ?? MESSAGES.evening;

  // Pull all registered Expo tokens from Supabase.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("push_tokens")
    .select("expo_token");

  if (error) {
    console.error("[/api/push/cron] supabase select error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tokens = (data ?? [])
    .map((row) => row.expo_token as string)
    .filter(
      (t): t is string => typeof t === "string" && Expo.isExpoPushToken(t),
    );

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, message: "No tokens registered" });
  }

  const expo = new Expo();
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: message.title,
    body: message.body,
  }));

  let sent = 0;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (err) {
      console.error("[/api/push/cron] Chunk send error:", err);
    }
  }

  console.log(`[/api/push/cron] Sent ${sent} ${type} notifications`);
  return NextResponse.json({ sent });
}
