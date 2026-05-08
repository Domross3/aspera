"use client";

// Magic-link login page. Sends a one-time link to the user's email via
// Supabase Auth. Click the link → hits /auth/callback → exchanges the code
// for a session cookie → redirects to /log.

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // Handle implicit-flow magic links: tokens arrive in the URL fragment
  // (#access_token=...&refresh_token=...) when the link was minted via
  // auth.admin.generateLink, or when the project's flow type defaults to
  // implicit. The /auth/callback route handler can't see fragments, so it
  // redirects here with ?error=missing_code and the fragment passes through.
  // Pick the tokens up here, write the session, bounce to the dashboard.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) return;

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return;

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          setError(error.message);
          setStatus("error");
          return;
        }
        window.location.replace("/log");
      });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Supabase appends `?code=...` to this URL after the user clicks
        // the magic link. The callback route exchanges it for a session.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-md">
      <div className="w-full max-w-sm bg-gradient-card border border-border rounded-xl p-xl shadow-card">
        <div className="mb-lg">
          <h1 className="text-2xl font-bold text-text">Sign in to Aspera</h1>
          <p className="text-sm text-text-secondary mt-xs">
            We&apos;ll email you a magic link. No password needed.
          </p>
        </div>

        {status === "sent" ? (
          <div className="text-center py-lg">
            <div className="text-4xl mb-md">📬</div>
            <p className="text-text font-semibold mb-xs">Check your inbox</p>
            <p className="text-sm text-text-secondary">
              We sent a magic link to <strong>{email}</strong>. Click it to
              finish signing in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-sm text-text-secondary">Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-elevated border border-border rounded-md px-md py-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </label>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-md py-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={status === "sending"}
              disabled={!email || status === "sending"}
            >
              Send magic link
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
