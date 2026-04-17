import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import Expo from "expo-server-sdk";

const TOKENS_FILE = "/tmp/aspera-push-tokens.json";

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
  // Verify Vercel cron secret
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

  let tokens: string[] = [];
  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf8");
    tokens = JSON.parse(raw) as string[];
  } catch {
    // no tokens registered yet
  }

  if (tokens.length === 0) {
    return NextResponse.json({ sent: 0, message: "No tokens registered" });
  }

  const expo = new Expo();
  const messages = tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
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
