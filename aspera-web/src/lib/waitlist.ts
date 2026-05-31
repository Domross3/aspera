// Pure, framework-free validation for the beta waitlist endpoint. Kept separate
// from the route handler so it can be unit-tested without Next or Supabase.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; // mirrors the client gate in AsperaLanding
const MAX_EMAIL = 320; // RFC ceiling; guard the unauthenticated endpoint

export type WaitlistResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid_email" | "honeypot" };

export function validateWaitlistInput(input: {
  email?: unknown;
  company?: unknown;
}): WaitlistResult {
  // `company` is a hidden honeypot field — real users never fill it in.
  if (typeof input.company === "string" && input.company.trim() !== "") {
    return { ok: false, reason: "honeypot" };
  }
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
    return { ok: false, reason: "invalid_email" };
  }
  return { ok: true, email };
}
