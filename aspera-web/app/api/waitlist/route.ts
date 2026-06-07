// Beta waitlist capture for the public landing page. Unauthenticated POST;
// writes via the service-role client (bypasses RLS — the table has none).
// Validation lives in src/lib/waitlist.ts so it can be unit-tested in isolation.

import { NextResponse } from "next/server";
import { createServiceClient } from "../../../src/lib/supabase/server";
import { validateWaitlistInput } from "../../../src/lib/waitlist";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = validateWaitlistInput(
    body as { email?: unknown; company?: unknown },
  );
  if (!result.ok) {
    // Honeypot tripped → pretend success so bots don't learn they were caught.
    if (result.reason === "honeypot") return NextResponse.json({ ok: true });
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("waitlist")
    .upsert({ email: result.email, source: "landing" }, { onConflict: "email" });

  if (error) {
    console.error("waitlist upsert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
