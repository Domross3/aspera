// Chrome extension POSTs daily browsing data here. Stored in Supabase
// `browsing_sessions` (one row per user per date — `user_id` nullable until
// extension has a user-link flow). Auth is a shared secret in the
// `X-Aspera-Extension-Secret` header, validated against `EXTENSION_SHARED_SECRET`.
//
// In dev, if EXTENSION_SHARED_SECRET is unset the route accepts unauthenticated
// POSTs so the extension can talk to a localhost Next.js without setup.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../src/lib/supabase/admin";

export async function POST(req: Request) {
  // 1. Verify Extension Secret
  const secret = req.headers.get("X-Aspera-Extension-Secret");
  if (secret !== process.env.EXTENSION_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const today = new Date().toISOString().split("T")[0];

    // 2. Insert into Supabase instead of /tmp
    // Note: user_id stays null until DOM-12 auth is finished
    const { error } = await supabaseAdmin.from("browsing_sessions").insert([
      {
        date: today,
        data: payload, // Adjust this if your schema expects a different column name
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
