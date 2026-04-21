// POST /auth/signout — clears the Supabase session cookie and redirects to /login.
// Link from anywhere: <form action="/auth/signout" method="post"><button>Sign out</button></form>

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
