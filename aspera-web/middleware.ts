// Next.js middleware — runs on every request matched by `config.matcher`.
// Delegates to `updateSession` which refreshes the Supabase session cookie
// and redirects unauthenticated users away from `(dashboard)` routes.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match everything except:
    //   - _next/static, _next/image (static assets)
    //   - favicon.ico and other public files
    // The route gating inside updateSession decides which paths require auth.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
