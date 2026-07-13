import {
  windowStartMinuteOfDay,
  morningLogMinuteOfDay,
  selectStaleToDismiss,
  MORNING_LOG_LEAD_MIN,
  MORNING_LOG_MAX_SHIFT_MIN,
  MAX_UNANSWERED,
} from "./quickMoodLimits";
import type { ParsedWindow } from "./notificationHelpers";

// wake 07:00 → sleep 22:00
const W: ParsedWindow = { startHour: 7, startMinute: 0, endHour: 22, endMinute: 0 };
const wakeMin = 7 * 60; // 420

describe("windowStartMinuteOfDay", () => {
  it("uses wake-time when there's no morning log today", () => {
    expect(windowStartMinuteOfDay(W, null)).toBe(wakeMin);
  });

  it("starts ~1h after a normal morning log", () => {
    const log = 8 * 60; // logged 08:00
    expect(windowStartMinuteOfDay(W, log)).toBe(log + MORNING_LOG_LEAD_MIN); // 09:00
  });

  it("never starts earlier than wake-time (very early log)", () => {
    const log = 5 * 60; // 05:00 + 60 = 06:00, but wake is 07:00
    expect(windowStartMinuteOfDay(W, log)).toBe(wakeMin);
  });

  it("caps the shift for a late log (don't shove the window to the afternoon)", () => {
    const log = 15 * 60; // 3pm log → +60 = 16:00, but cap = wake + 180 = 10:00
    expect(windowStartMinuteOfDay(W, log)).toBe(wakeMin + MORNING_LOG_MAX_SHIFT_MIN);
  });

  it("honors a log right at the cap boundary", () => {
    // wake 420 + lead 60 = 480 anchor; cap = 420 + 180 = 600. A 9:00 log → 600.
    const log = 9 * 60; // 540 + 60 = 600 == cap
    expect(windowStartMinuteOfDay(W, log)).toBe(600);
  });
});

describe("morningLogMinuteOfDay", () => {
  const now = new Date("2026-06-07T20:00:00");
  it("returns null when no timestamp", () => {
    expect(morningLogMinuteOfDay(null, now)).toBeNull();
  });
  it("returns minute-of-day for a same-day log", () => {
    const logged = new Date("2026-06-07T08:30:00").getTime();
    expect(morningLogMinuteOfDay(logged, now)).toBe(8 * 60 + 30);
  });
  it("returns null for a log from a previous day", () => {
    const logged = new Date("2026-06-06T08:30:00").getTime();
    expect(morningLogMinuteOfDay(logged, now)).toBeNull();
  });
});

describe("selectStaleToDismiss", () => {
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `n${i}`, when: i }));

  it("keeps everything when at or under the cap", () => {
    expect(selectStaleToDismiss(mk(MAX_UNANSWERED))).toEqual([]);
    expect(selectStaleToDismiss(mk(1))).toEqual([]);
  });

  it("dismisses the oldest, keeping the 2 most recent", () => {
    // when: 0..5, newest = 5,4 kept; dismiss 0,1,2,3
    const ids = selectStaleToDismiss(mk(6));
    expect(ids.sort()).toEqual(["n0", "n1", "n2", "n3"]);
  });
});
