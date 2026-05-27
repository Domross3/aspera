import { compareDays } from "../compare";
import type { DayMetric, RandomFn } from "../types";

// Mulberry32 — deterministic PRNG for reproducible bootstrap tests. Same
// shape as Math.random (() => number in [0, 1)). Same seed → same stream.
function seededRandom(seed: number): RandomFn {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDays(values: number[]): DayMetric[] {
  return values.map((v, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, "0")}`,
    value: v,
  }));
}

describe("compareDays — degenerate inputs", () => {
  it("returns zero effect + low confidence when control is empty", () => {
    const result = compareDays([], makeDays([5, 6, 7]));
    expect(result.effect).toBe(0);
    expect(result.range).toEqual({ low: 0, high: 0 });
    expect(result.confidenceLabel).toBe("low");
    expect(result.sampleSize).toBe(3);
  });

  it("returns zero effect when treatment is empty", () => {
    const result = compareDays(makeDays([5, 6, 7]), []);
    expect(result.effect).toBe(0);
    expect(result.confidenceLabel).toBe("low");
    expect(result.sampleSize).toBe(0);
  });

  it("filters NaN and Infinity values silently", () => {
    const control = [
      { date: "d1", value: 5 },
      { date: "d2", value: Number.NaN },
      { date: "d3", value: 5 },
    ];
    const treatment = [
      { date: "d4", value: 8 },
      { date: "d5", value: Number.POSITIVE_INFINITY },
      { date: "d6", value: 8 },
    ];
    const result = compareDays(control, treatment, {
      iterations: 500,
      random: seededRandom(42),
    });
    // Filtered to value: [5, 5] vs [8, 8] → effect = 3 exactly.
    expect(result.effect).toBe(3);
    // sampleSize counts only finite values in treatment (2, not 3).
    expect(result.sampleSize).toBe(2);
  });
});

describe("compareDays — zero-variance fast path", () => {
  it("returns the exact effect with a zero-width range when both groups are constant", () => {
    const control = makeDays([5, 5, 5, 5, 5, 5, 5]);
    const treatment = makeDays([8, 8, 8, 8, 8, 8, 8]);
    const result = compareDays(control, treatment);
    expect(result.effect).toBe(3);
    expect(result.range.low).toBe(3);
    expect(result.range.high).toBe(3);
    expect(result.probabilityPositive).toBe(1);
    // 7 days, probability 1.0 → strong (above the floor)
    expect(result.confidenceLabel).toBe("strong");
  });

  it("returns probability 0 when treatment is constantly lower", () => {
    const control = makeDays([8, 8, 8, 8, 8, 8, 8]);
    const treatment = makeDays([5, 5, 5, 5, 5, 5, 5]);
    const result = compareDays(control, treatment);
    expect(result.effect).toBe(-3);
    expect(result.probabilityPositive).toBe(0);
    expect(result.confidenceLabel).toBe("strong");
  });

  it("returns probability 0.5 when both groups are identical constants", () => {
    const control = makeDays([5, 5, 5, 5, 5, 5, 5]);
    const treatment = makeDays([5, 5, 5, 5, 5, 5, 5]);
    const result = compareDays(control, treatment);
    expect(result.effect).toBe(0);
    expect(result.probabilityPositive).toBe(0.5);
  });
});

describe("compareDays — small-sample floor", () => {
  it("force-caps confidence to 'low' below 7 days even with a clean signal", () => {
    // 5 control days, 5 treatment days, clear separation. Effect is real
    // but sample size is too small to claim anything.
    const control = makeDays([3, 3, 4, 3, 4]);
    const treatment = makeDays([8, 9, 8, 9, 8]);
    const result = compareDays(control, treatment, {
      iterations: 1000,
      random: seededRandom(1),
    });
    expect(result.effect).toBeGreaterThan(4);
    expect(result.sampleSize).toBe(5);
    // Hard floor in confidence.ts means we cannot say "strong" here.
    expect(result.confidenceLabel).toBe("low");
    // The underlying probabilityPositive can still be near 1 — only the
    // label is capped.
    expect(result.probabilityPositive).toBeGreaterThan(0.95);
  });

  it("releases the floor at exactly 7 days with the same signal", () => {
    const control = makeDays([3, 3, 4, 3, 4, 3, 4]);
    const treatment = makeDays([8, 9, 8, 9, 8, 9, 8]);
    const result = compareDays(control, treatment, {
      iterations: 1000,
      random: seededRandom(1),
    });
    expect(result.sampleSize).toBe(7);
    expect(result.confidenceLabel).toBe("strong");
  });
});

describe("compareDays — null effect on identical distributions", () => {
  it("converges near zero effect with no clear direction when distributions match", () => {
    // 14 days, both groups sampling from the same {3, 4, 5} distribution.
    const control = makeDays([3, 4, 5, 4, 3, 5, 4, 3, 4, 5, 4, 3, 5, 4]);
    const treatment = makeDays([4, 3, 5, 4, 3, 5, 4, 3, 5, 4, 3, 5, 4, 3]);
    const result = compareDays(control, treatment, {
      iterations: 2000,
      random: seededRandom(7),
    });
    // Means are very close; effect should be near zero.
    expect(Math.abs(result.effect)).toBeLessThan(0.5);
    // Probability of positive should be near 0.5 — no clear direction.
    expect(result.probabilityPositive).toBeGreaterThan(0.2);
    expect(result.probabilityPositive).toBeLessThan(0.8);
    // Range should straddle zero (sign change between low and high).
    expect(result.range.low).toBeLessThan(0);
    expect(result.range.high).toBeGreaterThan(0);
    // Confidence should NOT be strong/high — directional probability is weak.
    expect(["low", "moderate"]).toContain(result.confidenceLabel);
  });
});

describe("compareDays — large clean effect", () => {
  it("produces a tight positive range + high probabilityPositive when the effect is clear", () => {
    // 14 days each, clean +4 separation between groups.
    const control = makeDays([3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4]);
    const treatment = makeDays([7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8, 7, 8]);
    const result = compareDays(control, treatment, {
      iterations: 2000,
      random: seededRandom(42),
    });
    expect(result.effect).toBeCloseTo(4, 1);
    // Range should be tight around 4 and entirely positive.
    expect(result.range.low).toBeGreaterThan(3);
    expect(result.range.high).toBeLessThan(5);
    expect(result.probabilityPositive).toBe(1);
    expect(result.confidenceLabel).toBe("strong");
  });
});

describe("compareDays — asymmetric sample sizes", () => {
  it("uses the treatment length for sampleSize regardless of control length", () => {
    const control = makeDays([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]); // 14 days
    const treatment = makeDays([6, 6, 6, 6, 6, 6, 6, 6]); // 8 days
    const result = compareDays(control, treatment, {
      iterations: 500,
      random: seededRandom(3),
    });
    expect(result.sampleSize).toBe(8);
    expect(result.effect).toBe(2);
    // 8 days is past the 7-day floor and probability is 1 → strong
    expect(result.confidenceLabel).toBe("strong");
  });
});

describe("compareDays — determinism with seeded PRNG", () => {
  it("returns identical results across runs with the same seed", () => {
    const control = makeDays([3, 5, 4, 4, 3, 5, 4, 4, 3, 5]);
    const treatment = makeDays([5, 7, 6, 6, 5, 7, 6, 6, 5, 7]);
    const opts = { iterations: 500, random: seededRandom(99) };
    const r1 = compareDays(control, treatment, opts);
    const r2 = compareDays(control, treatment, {
      iterations: 500,
      random: seededRandom(99),
    });
    expect(r1.effect).toBe(r2.effect);
    expect(r1.range).toEqual(r2.range);
    expect(r1.probabilityPositive).toBe(r2.probabilityPositive);
  });
});

describe("compareDays — result shape", () => {
  it("returns all required ComparisonResult fields with finite values", () => {
    const control = makeDays([3, 4, 5, 4, 3, 5, 4, 3, 4, 5, 4, 3, 5, 4]);
    const treatment = makeDays([5, 6, 7, 6, 5, 7, 6, 5, 6, 7, 6, 5, 7, 6]);
    const result = compareDays(control, treatment, {
      iterations: 500,
      random: seededRandom(100),
    });
    expect(Number.isFinite(result.effect)).toBe(true);
    expect(Number.isFinite(result.range.low)).toBe(true);
    expect(Number.isFinite(result.range.high)).toBe(true);
    expect(result.probabilityPositive).toBeGreaterThanOrEqual(0);
    expect(result.probabilityPositive).toBeLessThanOrEqual(1);
    expect(result.sampleSize).toBe(14);
    expect(["low", "moderate", "high", "strong"]).toContain(
      result.confidenceLabel,
    );
    expect(result.computedAt).toBeGreaterThan(0);
    // Range invariant: low ≤ high
    expect(result.range.low).toBeLessThanOrEqual(result.range.high);
  });
});
