import {
  clampDelaySeconds,
  DELAY_DEFAULT_SECONDS,
  PAUSE_PROMPTS,
  pickPrompt,
  requestDelayChange,
  resolveDelay,
  type DelayChange,
} from "./gratificationDelay";

describe("clampDelaySeconds", () => {
  it("clamps into [10,60], rounds, and defaults on garbage", () => {
    expect(clampDelaySeconds(5)).toBe(10);
    expect(clampDelaySeconds(90)).toBe(60);
    expect(clampDelaySeconds(30.4)).toBe(30);
    expect(clampDelaySeconds(Number.NaN)).toBe(DELAY_DEFAULT_SECONDS);
  });
});

describe("requestDelayChange (commitment device)", () => {
  const now = new Date("2026-03-10T14:00:00").getTime();

  it("applies strengthening immediately and clears any pending", () => {
    const start: DelayChange = { effectiveSeconds: 20 };
    const out = requestDelayChange(start, 45, now);
    expect(out.effectiveSeconds).toBe(45);
    expect(out.pendingSeconds).toBeUndefined();
  });

  it("defers weakening to the next local day", () => {
    const start: DelayChange = { effectiveSeconds: 45 };
    const out = requestDelayChange(start, 15, now);
    expect(out.effectiveSeconds).toBe(45); // still strong now
    expect(out.pendingSeconds).toBe(15);
    expect(out.pendingEffectiveAt).toBe(
      new Date("2026-03-11T00:00:00").getTime(),
    );
  });

  it("resolves a matured pending weaker value", () => {
    const change: DelayChange = {
      effectiveSeconds: 45,
      pendingSeconds: 15,
      pendingEffectiveAt: new Date("2026-03-11T00:00:00").getTime(),
    };
    const before = resolveDelay(change, new Date("2026-03-10T23:00:00").getTime());
    expect(before.effectiveSeconds).toBe(45); // not yet

    const after = resolveDelay(change, new Date("2026-03-11T08:00:00").getTime());
    expect(after.effectiveSeconds).toBe(15);
    expect(after.pendingSeconds).toBeUndefined();
  });

  it("a second weakening before maturity keeps the strongest in force", () => {
    const start: DelayChange = { effectiveSeconds: 60 };
    const once = requestDelayChange(start, 30, now);
    const twice = requestDelayChange(once, 10, now);
    expect(twice.effectiveSeconds).toBe(60);
    expect(twice.pendingSeconds).toBe(10);
  });
});

describe("pickPrompt", () => {
  it("is deterministic by seed and always in-pool", () => {
    expect(pickPrompt(0)).toBe(PAUSE_PROMPTS[0]);
    expect(pickPrompt(PAUSE_PROMPTS.length)).toBe(PAUSE_PROMPTS[0]);
    expect(PAUSE_PROMPTS).toContain(pickPrompt(7));
    expect(pickPrompt(3)).toBe(pickPrompt(3));
  });
});
