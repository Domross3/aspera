import { describe, it, expect } from "vitest";
import { validateWaitlistInput } from "./waitlist";

describe("validateWaitlistInput", () => {
  it("accepts a well-formed email", () => {
    expect(validateWaitlistInput({ email: "a@b.com" })).toEqual({
      ok: true,
      email: "a@b.com",
    });
  });

  it("trims surrounding whitespace and lowercases", () => {
    expect(validateWaitlistInput({ email: "  A@B.Com " })).toEqual({
      ok: true,
      email: "a@b.com",
    });
  });

  it("rejects malformed emails", () => {
    for (const email of ["nope", "a@b", "a b@c.com", "@b.com", "a@.com"]) {
      expect(validateWaitlistInput({ email })).toEqual({
        ok: false,
        reason: "invalid_email",
      });
    }
  });

  it("rejects missing or empty email", () => {
    expect(validateWaitlistInput({})).toEqual({
      ok: false,
      reason: "invalid_email",
    });
    expect(validateWaitlistInput({ email: "" })).toEqual({
      ok: false,
      reason: "invalid_email",
    });
  });

  it("rejects a non-string email without throwing", () => {
    for (const email of [123, null, {}, []] as unknown[]) {
      expect(validateWaitlistInput({ email })).toEqual({
        ok: false,
        reason: "invalid_email",
      });
    }
  });

  it("trips the honeypot when company is filled", () => {
    expect(
      validateWaitlistInput({ email: "a@b.com", company: "bot" }),
    ).toEqual({ ok: false, reason: "honeypot" });
  });

  it("ignores an empty or whitespace-only honeypot", () => {
    expect(validateWaitlistInput({ email: "a@b.com", company: "" })).toEqual({
      ok: true,
      email: "a@b.com",
    });
    expect(
      validateWaitlistInput({ email: "a@b.com", company: "   " }),
    ).toEqual({ ok: true, email: "a@b.com" });
  });

  it("rejects emails longer than 320 chars", () => {
    const huge = "x".repeat(320) + "@e.com";
    expect(validateWaitlistInput({ email: huge })).toEqual({
      ok: false,
      reason: "invalid_email",
    });
  });

  it("normalizes case so duplicates collapse to one value", () => {
    expect(validateWaitlistInput({ email: "A@b.com" })).toEqual(
      validateWaitlistInput({ email: "a@b.com" }),
    );
  });
});
