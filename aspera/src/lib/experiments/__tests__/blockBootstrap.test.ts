import { compareDaysBlocked, defaultBlockLength } from "../blockBootstrap";
import type { DayMetric } from "../types";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function series(vals: number[]): DayMetric[] {
  return vals.map((v, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    value: v,
  }));
}

describe("defaultBlockLength", () => {
  it("is ≈ cube root, at least 1", () => {
    expect(defaultBlockLength(1)).toBe(1);
    expect(defaultBlockLength(8)).toBe(2);
    expect(defaultBlockLength(27)).toBe(3);
  });
});

describe("compareDaysBlocked", () => {
  it("recovers a clear positive effect", () => {
    const control = series([2, 2.2, 1.8, 2.1, 1.9, 2, 2.1, 1.9, 2, 2.2]);
    const treatment = series([4, 4.2, 3.8, 4.1, 3.9, 4, 4.1, 3.9, 4, 4.2]);
    const r = compareDaysBlocked(control, treatment, {
      iterations: 2000,
      random: mulberry32(5),
    });
    expect(r.effect).toBeCloseTo(2, 1);
    expect(r.probabilityPositive).toBeGreaterThan(0.9);
    expect(r.range.low).toBeGreaterThan(0);
  });

  it("handles constant groups via the fast path", () => {
    const r = compareDaysBlocked(
      series([3, 3, 3, 3, 3, 3, 3]),
      series([5, 5, 5, 5, 5, 5, 5]),
      { random: mulberry32(1) },
    );
    expect(r.effect).toBe(2);
    expect(r.probabilityPositive).toBe(1);
    expect(r.range).toEqual({ low: 2, high: 2 });
  });

  it("returns an empty result when a group is empty", () => {
    const r = compareDaysBlocked([], series([1, 2, 3]), {});
    expect(r.effect).toBe(0);
    expect(r.probabilityPositive).toBe(0.5);
  });

  it("preserves resample length (no crash, correct sampleSize)", () => {
    const r = compareDaysBlocked(
      series([1, 2, 1, 2, 1, 2, 1]),
      series([3, 4, 3, 4, 3, 4, 3, 4]),
      { iterations: 500, random: mulberry32(2), blockLength: 3 },
    );
    expect(r.sampleSize).toBe(8); // treatment length
    expect(Number.isFinite(r.range.low)).toBe(true);
    expect(Number.isFinite(r.range.high)).toBe(true);
  });
});
