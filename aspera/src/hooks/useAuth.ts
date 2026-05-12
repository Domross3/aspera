// Auth state hook — single source of truth for "am I signed in?"
//
// Reads the persisted session from AsyncStorage on mount, then listens for
// auth state changes from Supabase (token refresh, sign-in, sign-out). Any
// component can subscribe to know whether to render the app or the login
// screen.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  clearAllLogs,
  clearAllMoodCheckIns,
  clearInsights,
} from "../storage/storage";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Initial session load from AsyncStorage.
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    // Subscribe to future state changes (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Wipe the local cache before clearing the session. Otherwise the next
    // user to sign in on this device would briefly see the previous user's
    // cached logs/mood while the cloud fetch is in flight.
    await Promise.all([
      clearAllLogs(),
      clearAllMoodCheckIns(),
      clearInsights(),
    ]);
    await supabase.auth.signOut();
    // The onAuthStateChange listener above will null out the session.
  };

  return { session, loading, signOut };
}
