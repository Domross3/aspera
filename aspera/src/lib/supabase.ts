// Mobile Supabase client.
//
// Mirrors the SAME project as the web dashboard (aspera-web), so an account
// created on either platform sees the same user record. Sessions persist
// through AsyncStorage; auto-refresh keeps the access token fresh in the
// background.
//
// Env vars (must be present at build time — EAS bakes EXPO_PUBLIC_* into
// the JS bundle):
//   EXPO_PUBLIC_SUPABASE_URL              — project URL (https://<ref>.supabase.co)
//   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY  — anon/publishable key (safe to ship)
//
// Auth flow: Apple Sign In returns an identity token from
// expo-apple-authentication. We hand it to Supabase via
// supabase.auth.signInWithIdToken({ provider: "apple", token }). Supabase
// validates with Apple, creates/links a user, returns a session.

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL is not configured. Set it in aspera/.env (dev) or eas.json (production builds).",
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured. Set it in aspera/.env (dev) or eas.json (production builds).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-fragment session detection on React Native — no browser URL.
    detectSessionInUrl: false,
  },
});
