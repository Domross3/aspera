import { composeWeeklyRecap } from "../recap";
import type { SweepFinding } from "../runSweep";

function finding(id: string, pValue: number): SweepFinding {
  return {
    leverId: id,
    leverLabel: id,
    outcomeId: "mood",
    outcomeLabel: "mood",
    result: {
      effect: -1,
      range: { low: -2, high: 0 },
      confidenceLabel: "high",
      probabilityPositive: 0.02,
      sampleSize: 10,
      computedAt: 0,
    },
    pValue,
    headline: `headline ${id}`,
  };
}

const WEEK = { weekStart: "2026-01-01", weekEnd: "2026-01-07" };

describe("composeWeeklyRecap", () => {
  it("is quiet when nothing cleared the bar", () => {
    const r = composeWeeklyRecap({ ...WEEK, sameDayFindings: [], lagFindings: [] });
    expect(r.isQuiet).toBe(true);
    expect(r.items).toEqual([]);
    expect(r.summary.toLowerCase()).toContain("quiet");
  });

  it("orders by strength, caps at 3, and labels same-day vs next-day", () => {
    const r = composeWeeklyRecap({
      ...WEEK,
      sameDayFindings: [finding("a", 0.2), finding("b", 0.01)],
      lagFindings: [finding("c", 0.05), finding("d", 0.5)],
    });
    expect(r.isQuiet).toBe(false);
    expect(r.items).toHaveLength(3); // 4 findings capped to 3
    expect(r.items[0].text).toContain("b"); // smallest p ⇒ strongest first
    expect(r.items.map((i) => i.kind)).toContain("next-day");
  });

  it("appends a substitution note when there is room", () => {
    const r = composeWeeklyRecap({
      ...WEEK,
      sameDayFindings: [finding("a", 0.01)],
      lagFindings: [],
      substitutionNote: "When you cut social, video tends to absorb the time.",
    });
    expect(r.items).toHaveLength(2);
    expect(r.items.some((i) => i.text.includes("video"))).toBe(true);
  });

  it("never exceeds the cap, dropping the substitution note when full", () => {
    const r = composeWeeklyRecap({
      ...WEEK,
      sameDayFindings: [finding("a", 0.01), finding("b", 0.02), finding("c", 0.03)],
      lagFindings: [],
      substitutionNote: "note",
    });
    expect(r.items).toHaveLength(3);
    expect(r.items.some((i) => i.text === "note")).toBe(false);
  });
});
