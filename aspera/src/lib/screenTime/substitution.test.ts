import { SCREEN_TIME_CATEGORIES } from "./constants";
import {
  analyzeSubstitution,
  fillerScores,
  pearson,
  substitutionMatrix,
} from "./substitution";
import type { ScreenTimeDayTotals } from "./types";

const cats = SCREEN_TIME_CATEGORIES;

function day(
  date: string,
  mins: Partial<Record<string, number>>,
): ScreenTimeDayTotals {
  const byCategory = cats.reduce(
    (acc, c) => {
      acc[c] = mins[c] ?? 0;
      return acc;
    },
    {} as Record<string, number>,
  ) as ScreenTimeDayTotals["byCategory"];
  const totalMinutes = cats.reduce((s, c) => s + (mins[c] ?? 0), 0);
  return { date, byCategory, totalMinutes };
}

describe("pearson", () => {
  it("is 1 / -1 / 0 for correlated / anti-correlated / constant", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 6);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBe(0);
    expect(pearson([5], [5])).toBe(0); // too few points
  });
});

describe("substitution analysis", () => {
  // cats[0] and cats[1] swap places day to day (one high ⇒ other low); the
  // rest are flat. The pair should read as the strongest substitution.
  function swappingHistory(numDays: number): ScreenTimeDayTotals[] {
    const days: ScreenTimeDayTotals[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = `2026-01-${String(i + 1).padStart(2, "0")}`;
      const swing = i % 2 === 0 ? 60 : 0;
      days.push(
        day(date, {
          [cats[0]]: swing,
          [cats[1]]: 60 - swing,
          [cats[2]]: 30,
        }),
      );
    }
    return days;
  }

  it("ranks the anti-correlated pair as the top substitution", () => {
    const matrix = substitutionMatrix(swappingHistory(14));
    const top = matrix[0];
    const pair = new Set([top.a, top.b]);
    expect(pair.has(cats[0]) && pair.has(cats[1])).toBe(true);
    expect(top.correlation).toBeLessThan(0);
  });

  it("flags one of the swapping categories as a filler", () => {
    const fillers = fillerScores(swappingHistory(14));
    expect(fillers[0].score).toBeLessThan(0);
    expect([cats[0], cats[1]]).toContain(fillers[0].category);
  });

  it("surfaces a topSubstitution above the floor with enough days", () => {
    const a = analyzeSubstitution(swappingHistory(14));
    expect(a.topSubstitution).not.toBeNull();
    expect(a.daysAnalyzed).toBe(14);
  });

  it("returns an empty analysis below the 7-day warmup floor", () => {
    const a = analyzeSubstitution([day("2026-01-01", { [cats[0]]: 10 })]);
    expect(a.topSubstitution).toBeNull();
    expect(a.matrix).toEqual([]);
    expect(a.daysAnalyzed).toBe(1);
  });
});
