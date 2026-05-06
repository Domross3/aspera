// Chrome extension POSTs daily browsing data here. Stored in Supabase
// `browsing_sessions` (one row per user per date — `user_id` nullable until
// extension has a user-link flow). Auth is a shared secret in the
// `X-Aspera-Extension-Secret` header, validated against `EXTENSION_SHARED_SECRET`.
//
// In dev, if EXTENSION_SHARED_SECRET is unset the route accepts unauthenticated
// POSTs so the extension can talk to a localhost Next.js without setup.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function checkSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.EXTENSION_SHARED_SECRET;
  if (!expected) return null; // dev mode — no secret required
  const got = req.headers.get("x-aspera-extension-secret");
  if (got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = checkSecret(req);
  if (denied) return denied;

  try {
    const payload = (await req.json()) as { date?: string } & Record<
      string,
      unknown
    >;
    const date = payload.date ?? new Date().toISOString().split("T")[0];

    const supabase = createServiceClient();
    // user_id stays null tonight; once the extension links to a user we'll
    // upsert by (user_id, date). For now insert one row per push.
    const { error } = await supabase.from("browsing_sessions").insert({
      date,
      tabs: payload,
      received_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[/api/browsing] supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[/api/browsing] Saved browsing data for:", date);
    return NextResponse.json({ ok: true, date });
  } catch (err: unknown) {
    console.error("[/api/browsing] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const denied = checkSecret(req);
  if (denied) return denied;

  try {
    const supabase = createServiceClient();
    // Return the most recent day's row plus a map of all days for callers
    // that want a snapshot (e.g. /api/insights pulling history).
    const { data, error } = await supabase
      .from("browsing_sessions")
      .select("date, tabs, received_at")
      .order("received_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("[/api/browsing] supabase select error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const latest = rows[0]?.tabs ?? null;
    const all: Record<string, unknown> = {};
    // Most-recent row per date wins (rows are ordered desc).
    for (const row of rows) {
      const key = row.date as string;
      if (!(key in all)) all[key] = row.tabs;
    }
    return NextResponse.json({ latest, all });
  } catch (err: unknown) {
    console.error("[/api/browsing] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
