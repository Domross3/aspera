import {
  formatMinutesLabel,
  normalizeScreenTimeDayTotals,
  summarizeScreenTimeCollection,
} from "./storage";

describe("screen time storage helpers", () => {
  it("normalizes native category totals and folds unknowns into other", () => {
    expect(
      normalizeScreenTimeDayTotals([
        {
          date: "2026-05-20",
          byCategory: {
            social: 42.4,
            entertainment: 10.2,
            mystery: 7,
          },
        },
        {
          date: "2026-05-20",
          byCategory: {
            productivity: 18,
            other: 2,
          },
          totalMinutes: 20,
        },
        {
          date: "not-a-date",
          byCategory: { social: 999 },
        },
      ]),
    ).toEqual([
      {
        date: "2026-05-20",
        byCategory: {
          social: 42,
          entertainment: 10,
          productivity: 18,
          communication: 0,
          other: 9,
        },
        totalMinutes: 79,
      },
    ]);
  });

  it("summarizes seven non-empty days as warm", () => {
    const totals = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-05-${String(20 + index).padStart(2, "0")}`,
      byCategory: {
        social: index + 1,
        entertainment: 0,
        productivity: 0,
        communication: 0,
        other: 0,
      },
      totalMinutes: index + 1,
    }));

    expect(summarizeScreenTimeCollection(totals)).toEqual({
      daysCollected: 7,
      latestDay: totals[6],
      hasWarmup: true,
    });
  });

  it("formats minute labels compactly", () => {
    expect(formatMinutesLabel(45)).toBe("45m");
    expect(formatMinutesLabel(120)).toBe("2h");
    expect(formatMinutesLabel(135)).toBe("2h 15m");
  });
});
