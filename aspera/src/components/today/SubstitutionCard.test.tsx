// Tests for SubstitutionCard — verifies the confidence gate (silent below
// 7-day warmup) and that credible patterns render the expected label copy.

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "../../theme/ThemeProvider";
import type { ScreenTimeDayTotals } from "../../lib/screenTime/types";

// ── Mock the native screen-time module that useScreenTime depends on ──────
// The modules/screen-time path contains native code unavailable in Jest.
jest.mock("../../../modules/screen-time/src", () => ({
  getAuthorizationStatus: () => "notDetermined",
  requestAuthorization: jest.fn(),
  isScreenTimeAvailable: () => false,
}));

// ── Mock the bridge / storage helpers that useScreenTime calls ────────────
jest.mock("../../lib/screenTime/bridge", () => ({
  readScreenTimeTotals: jest.fn().mockResolvedValue([]),
  refreshScreenTimeTotals: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../lib/screenTime/storage", () => ({
  summarizeScreenTimeCollection: jest.fn().mockReturnValue({
    daysCollected: 0,
    latestDay: null,
    hasWarmup: false,
  }),
}));

// ── Mock useScreenTime itself so we can inject synthetic dailyTotals ──────
const mockDailyTotals: { current: ScreenTimeDayTotals[] } = { current: [] };

jest.mock("../../hooks/useScreenTime", () => ({
  useScreenTime: () => ({
    available: false,
    authStatus: "notDetermined",
    requesting: false,
    dailyTotals: mockDailyTotals.current,
    daysCollected: 0,
    latestDay: null,
    hasWarmup: false,
    loadingTotals: false,
    totalsError: null,
    connect: jest.fn(),
    refresh: jest.fn(),
    refreshTotals: jest.fn(),
  }),
}));

// ── Import subject after mocks ────────────────────────────────────────────
import SubstitutionCard from "./SubstitutionCard";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDay(
  date: string,
  social: number,
  entertainment: number,
  productivity = 30,
  communication = 20,
  other = 10,
): ScreenTimeDayTotals {
  const totalMinutes =
    social + entertainment + productivity + communication + other;
  return {
    date,
    byCategory: { social, entertainment, productivity, communication, other },
    totalMinutes,
  };
}

/** 14 days where social and entertainment swap each day — strong anti-correlation. */
function strongSwappingHistory(): ScreenTimeDayTotals[] {
  const days: ScreenTimeDayTotals[] = [];
  for (let i = 0; i < 14; i++) {
    const date = `2026-01-${String(i + 1).padStart(2, "0")}`;
    const high = i % 2 === 0 ? 90 : 10;
    const low = 100 - high;
    days.push(makeDay(date, high, low));
  }
  return days;
}

/** Only 3 usable days — below the 7-day warmup floor. */
function sparseHistory(): ScreenTimeDayTotals[] {
  return [
    makeDay("2026-01-01", 30, 30),
    makeDay("2026-01-02", 40, 20),
    makeDay("2026-01-03", 25, 35),
  ];
}

function wrap(element: React.ReactElement) {
  return render(<ThemeProvider>{element}</ThemeProvider>);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("SubstitutionCard", () => {
  afterEach(() => {
    mockDailyTotals.current = [];
  });

  it("renders nothing when fewer than 7 usable days are available", () => {
    mockDailyTotals.current = sparseHistory();
    const { toJSON } = wrap(<SubstitutionCard />);
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when there are zero days", () => {
    mockDailyTotals.current = [];
    const { toJSON } = wrap(<SubstitutionCard />);
    expect(toJSON()).toBeNull();
  });

  it("renders a pattern panel with filler copy when ≥7 days have a strong signal", () => {
    mockDailyTotals.current = strongSwappingHistory();
    wrap(<SubstitutionCard />);

    // The panel header should appear.
    expect(screen.getByText("Pattern")).toBeTruthy();
    expect(screen.getByText("tentative")).toBeTruthy();
  });

  it("renders filler or substitution label text for a strong signal", () => {
    mockDailyTotals.current = strongSwappingHistory();
    wrap(<SubstitutionCard />);

    // At least one of the two body-text variants should appear.
    const bodyTexts = screen.queryAllByText(/tends to/i);
    expect(bodyTexts.length).toBeGreaterThan(0);
  });

  it("always renders the tentative footnote when the panel is shown", () => {
    mockDailyTotals.current = strongSwappingHistory();
    wrap(<SubstitutionCard />);

    expect(
      screen.getByText(/from your own screen-time history/i),
    ).toBeTruthy();
  });
});
