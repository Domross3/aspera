import { migrateLegacyCustomMetrics } from "../src/lib/migrations";
import { AppSettings, DailyLog } from "../src/types";

function baseSettings(over: Partial<AppSettings> = {}): AppSettings {
  return {
    claudeApiKey: "",
    onboardingComplete: false,
    moodNotificationsEnabled: false,
    hiddenLogSections: [],
    customMetrics: [],
    ...over,
  };
}

function baseLog(over: Partial<DailyLog> = {}): DailyLog {
  return {
    id: "2026-04-13",
    date: "2026-04-13",
    createdAt: 0,
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

describe("migrateLegacyCustomMetrics", () => {
  it("creates a scale def per unique legacy metric name", () => {
    const logs = [
      baseLog({
        customMetrics: [
          { name: "Supplements", value: 8 },
          { name: "Creativity", value: 4 },
        ],
      }),
      baseLog({
        id: "2026-04-12",
        date: "2026-04-12",
        customMetrics: [{ name: "Supplements", value: 9 }],
      }),
    ];
    const { settings, createdDefs } = migrateLegacyCustomMetrics(
      baseSettings(),
      logs,
    );
    expect(createdDefs).toHaveLength(2);
    const names = createdDefs.map((d) => d.name).sort();
    expect(names).toEqual(["Creativity", "Supplements"]);
    expect(createdDefs.every((d) => d.kind === "scale")).toBe(true);
    expect(settings.customMetrics).toHaveLength(2);
  });

  it("populates customMetricValues on each log using the new def ids", () => {
    const logs = [
      baseLog({
        customMetrics: [{ name: "Supplements", value: 8 }],
      }),
    ];
    const { logs: migrated, createdDefs } = migrateLegacyCustomMetrics(
      baseSettings(),
      logs,
    );
    const suppDef = createdDefs.find((d) => d.name === "Supplements")!;
    expect(migrated[0].customMetricValues).toEqual([
      { id: suppDef.id, kind: "scale", value: 8 },
    ]);
  });

  it("is idempotent: running again does not duplicate defs", () => {
    const logs = [
      baseLog({ customMetrics: [{ name: "Supplements", value: 8 }] }),
    ];
    const first = migrateLegacyCustomMetrics(baseSettings(), logs);
    const second = migrateLegacyCustomMetrics(first.settings, first.logs);
    expect(second.settings.customMetrics).toHaveLength(
      first.settings.customMetrics.length,
    );
    expect(second.createdDefs).toHaveLength(0);
  });

  it("leaves logs without legacy metrics unchanged", () => {
    const logs = [baseLog({ customMetrics: [] })];
    const { logs: migrated, createdDefs } = migrateLegacyCustomMetrics(
      baseSettings(),
      logs,
    );
    expect(createdDefs).toHaveLength(0);
    expect(migrated[0].customMetricValues ?? []).toEqual([]);
  });
});
