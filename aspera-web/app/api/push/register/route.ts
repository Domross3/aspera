// Mobile app POSTs its Expo push token here on app open. Stored in Supabase
// `push_tokens` (unique on expo_token). Once mobile auth lands (DOM-12), we'll
// stamp `user_id` from the session; for now `user_id` is null and tokens are
// associated with whoever physically holds the phone.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Expo tokens are either ExponentPushToken[xxx] or ExpoPushToken[xxx].
const EXPO_TOKEN_RE = /^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]+\]$/;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: string; platform?: string };
    const { token, platform } = body;

    if (!token || typeof token !== "string" || !EXPO_TOKEN_RE.test(token)) {
      return NextResponse.json(
        { error: "Missing or malformed Expo push token" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from("push_tokens").upsert(
      {
        expo_token: token,
        platform: typeof platform === "string" ? platform : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "expo_token" },
    );

    if (error) {
      console.error("[/api/push/register] supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      "[/api/push/register] Registered token:",
      token.slice(0, 20) + "...",
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[/api/push/register] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
