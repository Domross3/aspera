import React from "react";
import { render, screen } from "@testing-library/react-native";
import WeeklyRecapCard from "../WeeklyRecapCard";
import type { WeeklyRecap } from "../../../lib/agent/recap";

// The card's visibility/content comes entirely from useWeeklyRecap; mock it so
// we can assert the earned-presence contract without storage/sweep I/O.
const mockHook = jest.fn();
jest.mock("../../../hooks/useWeeklyRecap", () => ({
  useWeeklyRecap: () => mockHook(),
}));

const recap = (over: Partial<WeeklyRecap> = {}): WeeklyRecap => ({
  weekStart: "2026-06-01",
  weekEnd: "2026-06-07",
  isQuiet: false,
  summary: "One pattern worth a quiet glance this week.",
  items: [{ kind: "same-day", text: "Coffee tracks with worse sleep.", strength: 0.9 }],
  context: {},
  ...over,
});

describe("WeeklyRecapCard — earned presence", () => {
  it("renders nothing when not visible", () => {
    mockHook.mockReturnValue({ recap: recap(), visible: false, dismiss: jest.fn() });
    const { toJSON } = render(<WeeklyRecapCard />);
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when there is no recap", () => {
    mockHook.mockReturnValue({ recap: null, visible: true, dismiss: jest.fn() });
    const { toJSON } = render(<WeeklyRecapCard />);
    expect(toJSON()).toBeNull();
  });

  it("renders the summary + items when visible", () => {
    mockHook.mockReturnValue({ recap: recap(), visible: true, dismiss: jest.fn() });
    render(<WeeklyRecapCard />);
    expect(screen.getByText("One pattern worth a quiet glance this week.")).toBeTruthy();
    expect(screen.getByText("Coffee tracks with worse sleep.")).toBeTruthy();
  });
});
