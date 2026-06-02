import {
  weekStartId,
  weekEndId,
  shouldShowRecap,
} from "../weeklyRecap";
import type { WeeklyRecap } from "../recap";

function recap(partial: Partial<WeeklyRecap>): WeeklyRecap {
  return {
    weekStart: "2026-06-01",
    weekEnd: "2026-06-07",
    isQuiet: false,
    summary: "x",
    items: [{ kind: "same-day", text: "t", strength: 0.9 }],
    context: {},
    ...partial,
  };
}

describe("week window", () => {
  it("weekStartId is the Monday of the week (local)", () => {
    // 2026-06-03 is a Wednesday → Monday is 2026-06-01.
    expect(weekStartId(new Date("2026-06-03T12:00:00"))).toBe("2026-06-01");
  });

  it("Sunday maps back to the prior Monday", () => {
    // 2026-06-07 is a Sunday → Monday is 2026-06-01.
    expect(weekStartId(new Date("2026-06-07T12:00:00"))).toBe("2026-06-01");
  });

  it("weekEndId is the Sunday of the week", () => {
    expect(weekEndId(new Date("2026-06-03T12:00:00"))).toBe("2026-06-07");
  });
});

describe("shouldShowRecap", () => {
  it("hides quiet weeks regardless of seen state", () => {
    expect(shouldShowRecap(recap({ isQuiet: true }), null)).toBe(false);
  });

  it("shows a non-quiet, unseen week", () => {
    expect(shouldShowRecap(recap({ weekStart: "2026-06-01" }), null)).toBe(
      true,
    );
    expect(
      shouldShowRecap(recap({ weekStart: "2026-06-01" }), "2026-05-25"),
    ).toBe(true);
  });

  it("hides a week already seen", () => {
    expect(
      shouldShowRecap(recap({ weekStart: "2026-06-01" }), "2026-06-01"),
    ).toBe(false);
  });
});
