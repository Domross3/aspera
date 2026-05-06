// Mobile search endpoint. The React Native app calls this with
// `Authorization: Bearer ${MOBILE_API_SECRET}` instead of a Supabase session
// (mobile auth lands in DOM-12). Otherwise identical to /api/search.

import { NextRequest, NextResponse } from "next/server";
import { DailyLog } from "@/types";
import { requireMobileAuth } from "@/lib/api/auth";
import { runSearch } from "@/lib/api/search";

export async function POST(req: NextRequest) {
  const denied = requireMobileAuth(req);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { query: string; logs: DailyLog[] };
    const result = await runSearch(body.query, body.logs);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch (err: unknown) {
    console.error("[/api/mobile/search] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
