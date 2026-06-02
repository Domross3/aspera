import {
  carryForwardFocus,
  consecutiveUnchangedFocusDays,
  shouldReaffirmFocus,
  FOCUS_REAFFIRM_AFTER_DAYS,
} from "./focusCarry";
import type { DailyLog } from "../types";

// Minimal DailyLog factory — only id + bigRocks matter for these helpers.
function log(id: string, bigRocks: string[]): DailyLog {
  return { id, bigRocks } as unknown as DailyLog;
}

describe("carryForwardFocus", () => {
  it("returns the most recent prior day's focus", () => {
    const logs = [
      log("2026-06-02", []), // today, empty
      log("2026-06-01", ["Ship P1", "Call Sam"]),
      log("2026-05-31", ["Older"]),
    ];
    expect(carryForwardFocus(logs, "2026-06-02")).toEqual([
      "Ship P1",
      "Call Sam",
    ]);
  });

  it("skips today even if today has focus, looking only at prior days", () => {
    const logs = [
      log("2026-06-02", ["Today thing"]),
      log("2026-06-01", ["Yesterday thing"]),
    ];
    expect(carryForwardFocus(logs, "2026-06-02")).toEqual(["Yesterday thing"]);
  });

  it("walks past empty prior days to the first non-empty", () => {
    const logs = [
      log("2026-06-02", []),
      log("2026-06-01", []),
      log("2026-05-31", ["Real focus"]),
    ];
    expect(carryForwardFocus(logs, "2026-06-02")).toEqual(["Real focus"]);
  });

  it("returns [] when nothing to carry", () => {
    expect(carryForwardFocus([log("2026-06-02", [])], "2026-06-02")).toEqual(
      [],
    );
    expect(carryForwardFocus([], "2026-06-02")).toEqual([]);
  });

  it("caps at 3 and ignores blank entries", () => {
    const logs = [
      log("2026-06-02", []),
      log("2026-06-01", ["a", "  ", "b", "c", "d"]),
    ];
    expect(carryForwardFocus(logs, "2026-06-02")).toEqual(["a", "b", "c"]);
  });
});

describe("consecutiveUnchangedFocusDays", () => {
  it("counts matching newest-first days, order-insensitive", () => {
    const logs = [
      log("d3", ["B", "A"]),
      log("d2", ["A", "B"]),
      log("d1", ["A", "B"]),
      log("d0", ["different"]),
    ];
    expect(consecutiveUnchangedFocusDays(logs, ["A", "B"])).toBe(3);
  });

  it("stops at the first differing day", () => {
    const logs = [log("d2", ["A"]), log("d1", ["X"]), log("d0", ["A"])];
    expect(consecutiveUnchangedFocusDays(logs, ["A"])).toBe(1);
  });

  it("is 0 for an empty current focus", () => {
    expect(consecutiveUnchangedFocusDays([log("d", ["A"])], [])).toBe(0);
  });
});

describe("shouldReaffirmFocus", () => {
  it("fires only at/after the threshold", () => {
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => log(`d${i}`, ["A"]));
    expect(
      shouldReaffirmFocus(make(FOCUS_REAFFIRM_AFTER_DAYS - 1), ["A"]),
    ).toBe(false);
    expect(shouldReaffirmFocus(make(FOCUS_REAFFIRM_AFTER_DAYS), ["A"])).toBe(
      true,
    );
  });
});
