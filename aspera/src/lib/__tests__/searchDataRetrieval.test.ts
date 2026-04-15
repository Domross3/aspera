import AsyncStorage from "@react-native-async-storage/async-storage";
import { DailyLog, STORAGE_KEYS } from "../../types";
import { SearchDateRange } from "../../types/search";

// The function under test — not yet implemented
import { getLogsForQuery } from "../searchDataRetrieval";

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a minimal valid DailyLog, overriding any fields. */
function makeLog(date: string, over: Partial<DailyLog> = {}): DailyLog {
  return {
    id: date,
    date,
    createdAt: new Date(date).getTime(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
    output: { tasksCompleted: 0, focusRating: 5, energyRating: 5 },
    tags: [],
    bigRocks: [],
    ...over,
  };
}

/** Seed a DailyLog into the mock AsyncStorage. */
async function seedLog(log: DailyLog): Promise<void> {
  const key = `${STORAGE_KEYS.LOGS_PREFIX}${log.id}`;
  await AsyncStorage.setItem(key, JSON.stringify(log));
}

/** Generate an ISO date string offset from a base date. */
function offsetDate(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  AsyncStorage.clear();
});

describe("getLogsForQuery", () => {
  // ── Basic retrieval ──────────────────────────────────────────────────

  it("returns logs within the specified date range", async () => {
    const logs = [
      makeLog("2026-03-01"),
      makeLog("2026-03-02"),
      makeLog("2026-03-03"),
    ];
    for (const log of logs) await seedLog(log);

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-03",
    });

    expect(result).toHaveLength(3);
    expect(result.map((l) => l.id)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });

  it("returns only logs on or after 'from' date", async () => {
    await seedLog(makeLog("2026-02-28"));
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-02"));

    const result = await getLogsForQuery({ from: "2026-03-01" });

    const dates = result.map((l) => l.id);
    expect(dates).not.toContain("2026-02-28");
    expect(dates).toContain("2026-03-01");
    expect(dates).toContain("2026-03-02");
  });

  it("returns only logs on or before 'to' date", async () => {
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-02"));
    await seedLog(makeLog("2026-03-03"));

    const result = await getLogsForQuery({ to: "2026-03-02" });

    const dates = result.map((l) => l.id);
    expect(dates).toContain("2026-03-01");
    expect(dates).toContain("2026-03-02");
    expect(dates).not.toContain("2026-03-03");
  });

  // ── Missing days ─────────────────────────────────────────────────────

  it("returns empty array when no logs exist in range", async () => {
    const result = await getLogsForQuery({
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when AsyncStorage is completely empty", async () => {
    const result = await getLogsForQuery({
      from: "2026-01-01",
      to: "2026-12-31",
    });

    expect(result).toEqual([]);
  });

  it("skips missing days without crashing", async () => {
    // Seed days 1 and 3 but not day 2
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-03"));

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-03",
    });

    expect(result).toHaveLength(2);
    expect(result.map((l) => l.id)).toEqual(["2026-03-01", "2026-03-03"]);
  });

  // ── Null/undefined stripping ─────────────────────────────────────────

  it("strips null fields from returned logs", async () => {
    const logWithNulls = makeLog("2026-03-01");
    // Simulate a stored log that has null fields (e.g. from schema evolution)
    const stored = {
      ...logWithNulls,
      customMetricValues: null,
      bigRocks: null,
    };
    const key = `${STORAGE_KEYS.LOGS_PREFIX}2026-03-01`;
    await AsyncStorage.setItem(key, JSON.stringify(stored));

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-01",
    });

    expect(result).toHaveLength(1);
    const log = result[0];
    const values = Object.values(log);
    expect(values).not.toContain(null);
  });

  it("strips undefined fields from returned logs", async () => {
    const logWithUndefined = makeLog("2026-03-01");
    // Manually set a field to undefined before storing
    (logWithUndefined as any).someObsoleteField = undefined;
    await seedLog(logWithUndefined);

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-01",
    });

    expect(result).toHaveLength(1);
    const log = result[0];
    for (const key of Object.keys(log)) {
      expect((log as any)[key]).not.toBeUndefined();
    }
  });

  // ── maxDays parameter ────────────────────────────────────────────────

  it("defaults to 90 days maximum", async () => {
    // Seed 100 consecutive days
    const baseDate = "2026-01-01";
    for (let i = 0; i < 100; i++) {
      await seedLog(makeLog(offsetDate(baseDate, i)));
    }

    const result = await getLogsForQuery({
      from: baseDate,
      to: offsetDate(baseDate, 99),
    });

    expect(result).toHaveLength(90);
  });

  it("respects a custom maxDays value", async () => {
    for (let i = 0; i < 10; i++) {
      await seedLog(makeLog(offsetDate("2026-03-01", i)));
    }

    const result = await getLogsForQuery(
      { from: "2026-03-01", to: "2026-03-10" },
      5,
    );

    expect(result).toHaveLength(5);
  });

  it("returns all logs when count is under maxDays", async () => {
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-02"));
    await seedLog(makeLog("2026-03-03"));

    const result = await getLogsForQuery(
      { from: "2026-03-01", to: "2026-03-03" },
      90,
    );

    expect(result).toHaveLength(3);
  });

  it("takes the most recent days when truncating to maxDays", async () => {
    for (let i = 0; i < 10; i++) {
      await seedLog(makeLog(offsetDate("2026-03-01", i)));
    }

    const result = await getLogsForQuery(
      { from: "2026-03-01", to: "2026-03-10" },
      3,
    );

    expect(result).toHaveLength(3);
    // Should keep the 3 most recent days, still in chronological order
    expect(result.map((l) => l.id)).toEqual([
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
  });

  // ── Chronological order ──────────────────────────────────────────────

  it("returns logs in chronological order", async () => {
    // Seed in reverse order
    await seedLog(makeLog("2026-03-03"));
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-02"));

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-03",
    });

    expect(result.map((l) => l.id)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });

  it("maintains chronological order after maxDays truncation", async () => {
    for (let i = 0; i < 10; i++) {
      await seedLog(makeLog(offsetDate("2026-03-01", i)));
    }

    const result = await getLogsForQuery(
      { from: "2026-03-01", to: "2026-03-10" },
      5,
    );

    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it("handles a single-day range", async () => {
    await seedLog(makeLog("2026-03-15"));

    const result = await getLogsForQuery({
      from: "2026-03-15",
      to: "2026-03-15",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2026-03-15");
  });

  it("handles range with no 'from' (open start)", async () => {
    await seedLog(makeLog("2026-01-01"));
    await seedLog(makeLog("2026-03-01"));

    const result = await getLogsForQuery({ to: "2026-03-01" });

    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const log of result) {
      expect(log.date <= "2026-03-01").toBe(true);
    }
  });

  it("handles range with no 'to' (open end)", async () => {
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-04-01"));

    const result = await getLogsForQuery({ from: "2026-03-01" });

    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const log of result) {
      expect(log.date >= "2026-03-01").toBe(true);
    }
  });

  it("handles empty date range (no from or to)", async () => {
    await seedLog(makeLog("2026-03-01"));
    await seedLog(makeLog("2026-03-02"));

    const result = await getLogsForQuery({});

    // Should return logs (up to maxDays), not crash
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves valid DailyLog fields in returned objects", async () => {
    const original = makeLog("2026-03-01", {
      caffeine: { type: "espresso", amount: 150 },
      workout: { type: "run", intensity: 7 },
      sleepHours: 7.5,
      tags: ["Sunlight", "Cold Shower"],
      output: { tasksCompleted: 8, focusRating: 9, energyRating: 7 },
    });
    await seedLog(original);

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-01",
    });

    expect(result).toHaveLength(1);
    expect(result[0].caffeine).toEqual({ type: "espresso", amount: 150 });
    expect(result[0].workout).toEqual({ type: "run", intensity: 7 });
    expect(result[0].sleepHours).toBe(7.5);
    expect(result[0].tags).toEqual(["Sunlight", "Cold Shower"]);
    expect(result[0].output.focusRating).toBe(9);
  });

  it("handles corrupted storage entries gracefully", async () => {
    // Store valid log alongside invalid JSON
    await seedLog(makeLog("2026-03-01"));
    const badKey = `${STORAGE_KEYS.LOGS_PREFIX}2026-03-02`;
    await AsyncStorage.setItem(badKey, "not-valid-json{{{");

    const result = await getLogsForQuery({
      from: "2026-03-01",
      to: "2026-03-03",
    });

    // Should still return the valid log without throwing
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.find((l) => l.id === "2026-03-01")).toBeDefined();
  });
});
