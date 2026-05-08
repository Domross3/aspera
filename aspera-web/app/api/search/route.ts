// Browser-auth search route. Dashboard calls this with the Supabase session
// cookie. Mobile uses /api/mobile/search instead (bearer auth).

import { NextRequest, NextResponse } from "next/server";
import { DailyLog } from "@/types";
import type { SearchResult, SearchResponse } from "@/types/search";
import { requireBrowserAuth } from "@/lib/api/auth";
import { runSearch } from "@/lib/api/search";

// Keep the historical re-exports so existing client code (`import { SearchResponse } from ".../search/route"`) keeps working.
export type { SearchResult, SearchResponse };
import { createClient } from "../../../src/lib/supabase/server";

export async function POST(req: Request) {
  // --- ADD THIS AUTH CHECK TO THE TOP ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: No Supabase session" },
      { status: 401 },
    );
  }
  // --------------------------------------

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
    console.error("[/api/search] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
