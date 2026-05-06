// Auth helpers shared by /api/* routes.
//
// `requireBrowserAuth` — Supabase session cookie. Used by routes the dashboard
//   calls. Returns null on success, or a NextResponse.json(401) to short-circuit.
//
// `requireMobileAuth` — `Authorization: Bearer ${MOBILE_API_SECRET}`. Used by
//   /api/mobile/* routes that the React Native app talks to. The mobile app
//   reads the secret from EXPO_PUBLIC_MOBILE_API_SECRET (baked into the bundle
//   at build time). This is a stopgap until DOM-12 wires real Supabase mobile
//   auth — see DOM-24.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireBrowserAuth(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireMobileAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.MOBILE_API_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "MOBILE_API_SECRET not configured on server" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
