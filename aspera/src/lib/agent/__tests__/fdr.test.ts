import type { ComparisonResult } from "../../../types";
import {
  benjaminiHochberg,
  passesEffectFloor,
  pseudoPValue,
  type FdrInput,
} from "../fdr";

function mkResult(probabilityPositive: number, effect: number): ComparisonResult {
  return {
    effect,
    range: { low: 0, high: 0 },
    confidenceLabel: "low",
    probabilityPositive,
    sampleSize: 10,
    computedAt: 0,
  };
}

describe("pseudoPValue", () => {
  it("maps directional probability to a two-sided tail", () => {
    expect(pseudoPValue(mkResult(0.95, 1))).toBeCloseTo(0.1, 6);
    expect(pseudoPValue(mkResult(0.05, -1))).toBeCloseTo(0.1, 6); // strong negative
    expect(pseudoPValue(mkResult(0.5, 0))).toBeCloseTo(1.0, 6);
    expect(pseudoPValue(mkResult(1, 1))).toBeCloseTo(0, 6);
  });
});

describe("benjaminiHochberg", () => {
  it("returns [] for empty input", () => {
    expect(benjaminiHochberg([], 0.1)).toEqual([]);
  });

  it("passes only findings under the step-up threshold", () => {
    // m=4, q=0.25 → thresholds .0625/.125/.1875/.25
    const inputs: FdrInput<string>[] = [
      { item: "a", pValue: 0.01 },
      { item: "b", pValue: 0.04 },
      { item: "c", pValue: 0.2 },
      { item: "d", pValue: 0.5 },
    ];
    const passed = benjaminiHochberg(inputs, 0.25)
      .filter((r) => r.passed)
      .map((r) => r.item)
      .sort();
    // p(1)=.01≤.0625, p(2)=.04≤.125, p(3)=.2>.1875, p(4)=.5>.25 → maxRank=2
    expect(passed).toEqual(["a", "b"]);
  });

  it("step-up rescues a mid-ranked item that exceeds its own threshold", () => {
    // m=3, q=0.05. sorted: .001(≤.0167), .04(>.0333), .045(≤.05).
    // largest k with p(k)≤(k/3)·.05 is k=3 → ranks 1..3 all pass, including
    // p=.04 whose own rank-2 threshold (.0333) it exceeded.
    const inputs: FdrInput<string>[] = [
      { item: "x", pValue: 0.001 },
      { item: "y", pValue: 0.04 },
      { item: "z", pValue: 0.045 },
    ];
    expect(benjaminiHochberg(inputs, 0.05).every((r) => r.passed)).toBe(true);
  });

  it("preserves original input order", () => {
    const inputs: FdrInput<number>[] = [
      { item: 0, pValue: 0.5 },
      { item: 1, pValue: 0.01 },
    ];
    expect(benjaminiHochberg(inputs, 0.1).map((r) => r.item)).toEqual([0, 1]);
  });
});

describe("passesEffectFloor", () => {
  it("requires |effect| >= floor", () => {
    expect(passesEffectFloor(mkResult(1, 0.6), 0.5)).toBe(true);
    expect(passesEffectFloor(mkResult(1, -0.6), 0.5)).toBe(true);
    expect(passesEffectFloor(mkResult(1, 0.4), 0.5)).toBe(false);
  });
});
