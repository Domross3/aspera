// Supabase client for server components, route handlers, and server actions.
// Usage: `const supabase = await createClient()`.
//
// The cookie setter is wrapped in try/catch because Next.js 15 forbids writes
// from server components that aren't inside a server action or route handler.
// When called from a server component, cookie refresh silently no-ops; the
// middleware (DOM-11) is responsible for refreshing the session cookie.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // server-component write — middleware handles refresh
          }
        },
      },
    },
  );
}

// Service-role client for admin operations (cron, push, extension relay).
// DO NOT import this in browser code.
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing from env");
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
