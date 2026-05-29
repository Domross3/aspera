import type { DailyLog, MoodCheckIn } from "../../../types";
import { dailyFocus, dailyMoodEnergy, localDateKey } from "../aggregate";

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
