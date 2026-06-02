import { asperaDayId, asperaDayIdForTs, DAY_CUTOFF_HOUR } from "./day";

// These dates use no "Z" suffix, so `new Date(...)` parses them in LOCAL time —
// which is what we want to assert (the helper is intentionally local).

describe("asperaDayId — local 4am cutoff", () => {
  it("returns the calendar date for a normal daytime moment", () => {
    expect(asperaDayId(new Date("2026-06-02T14:00:00"))).toBe("2026-06-02");
  });

  it("counts just-before-cutoff (1:30am) as the PREVIOUS day", () => {
    expect(asperaDayId(new Date("2026-06-02T01:30:00"))).toBe("2026-06-01");
  });

  it("rolls to the new day exactly at the cutoff (4:00am)", () => {
    expect(asperaDayId(new Date("2026-06-02T03:59:00"))).toBe("2026-06-01");
    expect(asperaDayId(new Date("2026-06-02T04:00:00"))).toBe("2026-06-02");
  });

  it("late-night (11pm) stays on the same calendar day", () => {
    expect(asperaDayId(new Date("2026-06-02T23:00:00"))).toBe("2026-06-02");
  });

  it("an evening log and a 1am log map to the SAME Aspera day", () => {
    const evening = asperaDayId(new Date("2026-06-02T22:00:00"));
    const lateNight = asperaDayId(new Date("2026-06-03T01:00:00"));
    expect(lateNight).toBe(evening);
  });

  it("handles month/year boundaries under the cutoff shift", () => {
    expect(asperaDayId(new Date("2026-01-01T02:00:00"))).toBe("2025-12-31");
  });
});

describe("asperaDayIdForTs — timestamp bucketing agrees with today", () => {
  it("buckets a ms-epoch timestamp with the same cutoff", () => {
    const ts = new Date("2026-06-02T02:00:00").getTime();
    expect(asperaDayIdForTs(ts)).toBe("2026-06-01");
  });

  it("a 1am event buckets to the same day asperaDayId reports then", () => {
    const at1am = new Date("2026-06-02T01:00:00");
    expect(asperaDayIdForTs(at1am.getTime())).toBe(asperaDayId(at1am));
  });

  it("cutoff constant is 4am", () => {
    expect(DAY_CUTOFF_HOUR).toBe(4);
  });
});
