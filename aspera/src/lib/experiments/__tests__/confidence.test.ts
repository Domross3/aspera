import {
  computeConfidenceLabel,
  MIN_INTERVENTION_DAYS_FOR_NON_LOW,
} from "../confidence";

describe("computeConfidenceLabel — sample-size floor", () => {
  it("force-caps to 'low' below the 7-day minimum, even with extreme probability", () => {
    expect(computeConfidenceLabel(0.99, 6)).toBe("low");
    expect(computeConfidenceLabel(0.01, 5)).toBe("low");
    expect(computeConfidenceLabel(1.0, 1)).toBe("low");
    expect(computeConfidenceLabel(0.0, 1)).toBe("low");
  });

  it("releases the floor at exactly 7 days", () => {
    expect(computeConfidenceLabel(0.99, 7)).toBe("strong");
    expect(computeConfidenceLabel(0.5, 7)).toBe("low");
  });

  it("MIN_INTERVENTION_DAYS_FOR_NON_LOW is 7", () => {
    expect(MIN_INTERVENTION_DAYS_FOR_NON_LOW).toBe(7);
  });
});

describe("computeConfidenceLabel — directional probability mapping (sample size 14)", () => {
  // Sample of (probabilityPositive, expected label) pairs across the
  // directional-probability bands. 14 days is well past the floor.
  const cases: [number, "low" | "moderate" | "high" | "strong"][] = [
    // Coin-flip neighborhood → low
    [0.5, "low"],
    [0.45, "low"],
    [0.65, "low"],
    [0.69, "low"],
    // Just over moderate floor (0.70)
    [0.7, "moderate"],
    [0.75, "moderate"],
    [0.84, "moderate"],
    // High band (≥0.85)
    [0.85, "high"],
    [0.9, "high"],
    [0.94, "high"],
    // Strong band (≥0.95)
    [0.95, "strong"],
    [0.99, "strong"],
    [1.0, "strong"],
    // Negative direction — directional probability mirrors positive.
    // P(positive)=0.4 → max(0.4, 0.6) = 0.6 → low
    [0.4, "low"],
    // P(positive)=0.3 → max(0.3, 0.7) = 0.7 → moderate
    [0.3, "moderate"],
    // P(positive)=0.15 → max(0.15, 0.85) = 0.85 → high
    [0.15, "high"],
    // P(positive)=0.05 → max(0.05, 0.95) = 0.95 → strong
    [0.05, "strong"],
    [0.0, "strong"],
  ];

  it.each(cases)(
    "probabilityPositive=%p with sample=14 → %s",
    (p, expected) => {
      expect(computeConfidenceLabel(p, 14)).toBe(expected);
    },
  );
});

describe("computeConfidenceLabel — boundary precision", () => {
  // Make sure the >= comparisons land on the right side of each threshold.
  it("treats 0.70 directional as the moderate floor", () => {
    expect(computeConfidenceLabel(0.7, 14)).toBe("moderate");
    expect(computeConfidenceLabel(0.6999, 14)).toBe("low");
  });

  it("treats 0.85 directional as the high floor", () => {
    expect(computeConfidenceLabel(0.85, 14)).toBe("high");
    expect(computeConfidenceLabel(0.8499, 14)).toBe("moderate");
  });

  it("treats 0.95 directional as the strong floor", () => {
    expect(computeConfidenceLabel(0.95, 14)).toBe("strong");
    expect(computeConfidenceLabel(0.9499, 14)).toBe("high");
  });
});
