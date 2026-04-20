// Session refresh + auth gate for Next.js middleware.
// The real `middleware.ts` at aspera-web/ root imports `updateSession` from
// here and gates `(dashboard)` routes behind authentication.
//
// Not yet wired — see DOM-11. This file is the helper; wiring lives in the
// middleware.ts file that the auth task will create.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie if expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route gating: redirect unauthenticated users away from dashboard routes.
  // /login and /auth/* stay public.
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/browsing") || // extension endpoint uses shared secret, not session
    pathname.startsWith("/api/push/cron"); // Vercel cron uses bearer token

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
