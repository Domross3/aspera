import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import TodayBigRocks from "../TodayBigRocks";
import type { DailyLog } from "../../../types";

function log(id: string, bigRocks: string[]): DailyLog {
  return { id, bigRocks } as unknown as DailyLog;
}

describe("TodayBigRocks — carry-forward", () => {
  it("auto-fills today's focus from the most recent prior day when empty", async () => {
    const onChange = jest.fn();
    render(
      <TodayBigRocks
        todayRocks={[]}
        recentLogs={[log("2026-06-01", ["Ship deck", "Call Sam"])]}
        onChange={onChange}
      />,
    );
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(["Ship deck", "Call Sam"]),
    );
  });

  it("does NOT carry forward once the user has touched today's focus", async () => {
    const onChange = jest.fn();
    render(
      <TodayBigRocks
        todayRocks={[]}
        recentLogs={[log("2026-06-01", ["Yesterday"])]}
        onChange={onChange}
        todayFocusTouched
      />,
    );
    // Give the effect a tick; it must stay silent.
    await new Promise((r) => setTimeout(r, 50));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("TodayBigRocks — still these?", () => {
  it("shows the re-affirm prompt after the focus has ridden unchanged", () => {
    const same = ["A", "B"];
    const recent = Array.from({ length: 6 }, (_, i) => log(`d${i}`, same));
    render(
      <TodayBigRocks todayRocks={same} recentLogs={recent} onChange={() => {}} />,
    );
    expect(screen.getByText("Still these?")).toBeTruthy();
  });

  it("does not show the prompt for a fresh focus", () => {
    render(
      <TodayBigRocks
        todayRocks={["A"]}
        recentLogs={[log("d0", ["A"])]}
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText("Still these?")).toBeNull();
  });
});
