// Magic-link callback — Supabase redirects here with `?code=xxx` after the
// user clicks the email link. Exchange the code for a session and attach the
// resulting auth cookies directly to the redirect response.
//
// We build the redirect response first and pass it as the cookie sink to
// `createServerClient`. Writing through `cookies()` from `next/headers` is
// flaky in route handlers — cookies set there don't always make it onto a
// freshly-created NextResponse.redirect(). This pattern is the one Supabase's
// own examples use for Next.js 15.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/log";

  // Behind Vercel's proxy, request.url's origin is normalized to the public
  // URL — but rely on x-forwarded-host as a belt-and-suspenders fallback.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isProd = process.env.NODE_ENV === "production";
  const targetOrigin =
    isProd && forwardedHost ? `https://${forwardedHost}` : url.origin;

  if (!code) {
    return NextResponse.redirect(`${targetOrigin}/login?error=missing_code`);
  }

  const response = NextResponse.redirect(`${targetOrigin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${targetOrigin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  return response;
}
