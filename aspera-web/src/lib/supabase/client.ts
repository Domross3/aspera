// Supabase client for browser components.
// Usage: `const supabase = createClient()` inside "use client" components.
// Auth wiring lives in `src/lib/supabase/middleware.ts` (DOM-11).

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
