import type { DailyLog, MoodCheckIn } from "../../../types";
import { dailyFocus, dailyMoodEnergy, dailyScreenTime, localDateKey } from "../aggregate";
import type { ScreenTimeDayTotals } from "../../screenTime/types";

function noon(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

describe("localDateKey", () => {
  it("formats a local YYYY-MM-DD key", () => {
    expect(localDateKey(noon("2026-03-09"))).toBe("2026-03-09");
  });
});

describe("dailyMoodEnergy", () => {
  it("averages multiple check-ins per day into per-day means", () => {
    const checkIns: MoodCheckIn[] = [
      { id: "a", timestamp: noon("2026-01-01"), mood: 2, energy: 4, stress: 3 },
      {
        id: "b",
        timestamp: noon("2026-01-01") + 3_600_000,
        mood: 4,
        energy: 2,
        stress: 3,
      },
      { id: "c", timestamp: noon("2026-01-02"), mood: 5, energy: 5, stress: 3 },
    ];
    const { mood, energy } = dailyMoodEnergy(checkIns);
    expect(mood).toEqual([
      { date: "2026-01-01", value: 3 },
      { date: "2026-01-02", value: 5 },
    ]);
    expect(energy).toEqual([
      { date: "2026-01-01", value: 3 },
      { date: "2026-01-02", value: 5 },
    ]);
  });

  it("skips non-finite check-ins and returns date-sorted output", () => {
    const checkIns: MoodCheckIn[] = [
      { id: "b", timestamp: noon("2026-01-02"), mood: 3, energy: 3, stress: 3 },
      {
        id: "a",
        timestamp: noon("2026-01-01"),
        mood: Number.NaN,
        energy: 3,
        stress: 3,
      },
    ];
    expect(dailyMoodEnergy(checkIns).mood).toEqual([
      { date: "2026-01-02", value: 3 },
    ]);
  });

  it("returns empty series for no check-ins", () => {
    expect(dailyMoodEnergy([])).toEqual({ mood: [], energy: [] });
  });
});

describe("dailyScreenTime", () => {
  function makeTotals(
    date: string,
    totalMinutes: number,
    social = 0,
  ): ScreenTimeDayTotals {
    return {
      date,
      totalMinutes,
      byCategory: {
        social,
        entertainment: 0,
        productivity: 0,
        communication: 0,
        other: 0,
      },
    };
  }

  it("drops days where totalMinutes === 0", () => {
    const totals = [
      makeTotals("2026-01-01", 0),
      makeTotals("2026-01-02", 60),
    ];
    const { total } = dailyScreenTime(totals);
    expect(total).toEqual([{ date: "2026-01-02", value: 60 }]);
  });

  it("sorts ascending by date regardless of input order", () => {
    const totals = [
      makeTotals("2026-01-03", 30),
      makeTotals("2026-01-01", 90),
      makeTotals("2026-01-02", 60),
    ];
    const { total } = dailyScreenTime(totals);
    expect(total.map((d) => d.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("maps totalMinutes to total series and byCategory[cat] to each category series", () => {
    const totals = [
      makeTotals("2026-01-01", 120, 45),
      makeTotals("2026-01-02", 80, 20),
    ];
    const { total, byCategory } = dailyScreenTime(totals);
    expect(total).toEqual([
      { date: "2026-01-01", value: 120 },
      { date: "2026-01-02", value: 80 },
    ]);
    expect(byCategory.social).toEqual([
      { date: "2026-01-01", value: 45 },
      { date: "2026-01-02", value: 20 },
    ]);
    // Categories not supplied in the totals default to 0.
    expect(byCategory.entertainment).toEqual([
      { date: "2026-01-01", value: 0 },
      { date: "2026-01-02", value: 0 },
    ]);
  });

  it("returns empty series for an empty input", () => {
    const { total, byCategory } = dailyScreenTime([]);
    expect(total).toEqual([]);
    expect(byCategory.social).toEqual([]);
  });
});

describe("dailyFocus", () => {
  it("includes only explicitly-rated focus days, date-sorted", () => {
    const logs = [
      { date: "2026-01-02", output: { focusRating: 7 }, outputRated: true },
      { date: "2026-01-01", output: { focusRating: 9 } }, // outputRated undefined → included
      { date: "2026-01-03", output: { focusRating: 4 }, outputRated: false }, // excluded
      { date: "2026-01-04", output: {} }, // no focusRating → excluded
    ] as unknown as DailyLog[];
    expect(dailyFocus(logs)).toEqual([
      { date: "2026-01-01", value: 9 },
      { date: "2026-01-02", value: 7 },
    ]);
  });
});
