import {
  migrateAppSettings,
  migrateDailyLog,
  migrateCustomMetricDef,
  settingsNeedsMigration,
} from "./migrations";
import {
  APP_SETTINGS_SCHEMA_VERSION,
  type AppSettings,
  type CustomMetricDef,
  type DailyLog,
} from "../types";

// ── migrateCustomMetricDef ────────────────────────────────────────────────

describe("migrateCustomMetricDef", () => {
  it("turns a toggle metric into a single-cardinality EventTypeDef", () => {
    const def: CustomMetricDef = {
      id: "lion-mane",
      name: "Lion's mane",
      kind: "toggle",
      createdAt: 1715000000000,
    };

    const result = migrateCustomMetricDef(def);

    expect(result.id).toBe("lion-mane");
    expect(result.name).toBe("Lion's mane");
    expect(result.cardinality).toBe("single");
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0]).toMatchObject({
      id: "lion-mane-field",
      name: "Lion's mane",
      kind: "toggle",
      required: false,
    });
    expect(result.fields[0].config).toBeUndefined();
    expect(result.createdAt).toBe(1715000000000);
  });

  it("preserves scale config", () => {
    const def: CustomMetricDef = {
      id: "soreness",
      name: "Soreness",
      kind: "scale",
      createdAt: 0,
      scale: { min: 1, max: 10 },
    };

    const result = migrateCustomMetricDef(def);

    expect(result.fields[0].kind).toBe("scale");
    expect(result.fields[0].config).toEqual({ min: 1, max: 10 });
  });

  it("preserves chips config", () => {
    const def: CustomMetricDef = {
      id: "mood-tags",
      name: "Mood tags",
      kind: "chips",
      createdAt: 0,
      chips: { options: ["calm", "anxious", "focused"], multi: true },
    };

    const result = migrateCustomMetricDef(def);

    expect(result.fields[0].kind).toBe("chips");
    expect(result.fields[0].config).toEqual({
      options: ["calm", "anxious", "focused"],
      multi: true,
    });
  });

  it("preserves counter config", () => {
    const def: CustomMetricDef = {
      id: "water",
      name: "Water",
      kind: "counter",
      createdAt: 0,
      counter: { step: 1, min: 0, max: 20, unit: "glasses" },
    };

    const result = migrateCustomMetricDef(def);

    expect(result.fields[0].kind).toBe("counter");
    expect(result.fields[0].config).toEqual({
      step: 1,
      min: 0,
      max: 20,
      unit: "glasses",
    });
  });

  it("backfills createdAt when missing or non-finite", () => {
    const def = {
      id: "x",
      name: "X",
      kind: "toggle",
      createdAt: NaN,
    } as unknown as CustomMetricDef;

    const result = migrateCustomMetricDef(def);

    expect(Number.isFinite(result.createdAt)).toBe(true);
  });
});

// ── migrateAppSettings ────────────────────────────────────────────────────

describe("migrateAppSettings", () => {
  it("produces sensible defaults from an empty input", () => {
    const result = migrateAppSettings({});

    expect(result.schemaVersion).toBe(APP_SETTINGS_SCHEMA_VERSION);
    expect(result.onboardingComplete).toBe(false);
    expect(result.hiddenLogSections).toEqual([]);
    expect(result.eventTypes).toEqual([]);
    expect(result.customMetrics).toEqual([]);
    expect(result.notificationSettings.wakeTime).toBe("07:00");
    expect(result.notificationSettings.sleepTime).toBe("22:00");
    expect(result.notificationSettings.somaticInterceptorEnabled).toBe(true);
    expect(result.cheatPolicy).toMatchObject({
      weeklyCap: 1,
      spentThisWeek: 0,
    });
    expect(result.cheatPolicy?.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("migrates legacy customMetrics into eventTypes (preserving id)", () => {
    const legacy: Partial<AppSettings> = {
      customMetrics: [
        { id: "vit-d", name: "Vit D", kind: "toggle", createdAt: 1 },
        {
          id: "intensity",
          name: "Workout intensity",
          kind: "scale",
          createdAt: 2,
          scale: { min: 1, max: 10 },
        },
      ],
    };

    const result = migrateAppSettings(legacy);

    expect(result.eventTypes).toHaveLength(2);
    expect(result.eventTypes?.[0]?.id).toBe("vit-d");
    expect(result.eventTypes?.[0]?.fields[0].kind).toBe("toggle");
    expect(result.eventTypes?.[1]?.id).toBe("intensity");
    expect(result.eventTypes?.[1]?.fields[0].config).toEqual({
      min: 1,
      max: 10,
    });
    // Legacy field preserved for one-release rollback safety
    expect(result.customMetrics).toEqual(legacy.customMetrics);
  });

  it("maps legacy quickMoodWindowStart/End onto wakeTime/sleepTime", () => {
    const legacy = {
      notificationSettings: {
        morningEnabled: true,
        morningTime: "08:00",
        eveningEnabled: true,
        eveningTime: "21:00",
        quickMoodWindowStart: "06:30",
        quickMoodWindowEnd: "23:00",
        quickMoodEnabled: true,
        quickMoodFrequency: 5,
      },
    } as unknown as Partial<AppSettings>;

    const result = migrateAppSettings(legacy);

    expect(result.notificationSettings.wakeTime).toBe("06:30");
    expect(result.notificationSettings.sleepTime).toBe("23:00");
    expect(result.notificationSettings.quickMoodFrequency).toBe(5);
    expect(result.notificationSettings.quickMoodEnabled).toBe(true);
  });

  it("is idempotent on already-migrated settings", () => {
    const migrated = migrateAppSettings({
      customMetrics: [{ id: "x", name: "X", kind: "toggle", createdAt: 100 }],
    });

    // Run again. Should be a no-op (same schemaVersion, same shape).
    const twice = migrateAppSettings(migrated);

    expect(twice.schemaVersion).toBe(APP_SETTINGS_SCHEMA_VERSION);
    expect(twice.eventTypes).toEqual(migrated.eventTypes);
  });

  it("trusts existing eventTypes over legacy customMetrics", () => {
    // User has edited their event types past the migrated shape — e.g.
    // added a second field. We must not overwrite their edits by re-running
    // the legacy conversion.
    const legacy: Partial<AppSettings> = {
      customMetrics: [{ id: "x", name: "X", kind: "toggle", createdAt: 0 }],
      eventTypes: [
        {
          id: "x",
          name: "X (edited)",
          cardinality: "recurrent",
          fields: [
            { id: "f1", name: "Type", kind: "chips", required: false },
            { id: "f2", name: "Intensity", kind: "scale", required: false },
          ],
          createdAt: 0,
        },
      ],
    };

    const result = migrateAppSettings(legacy);

    expect(result.eventTypes).toHaveLength(1);
    expect(result.eventTypes?.[0]?.name).toBe("X (edited)");
    expect(result.eventTypes?.[0]?.cardinality).toBe("recurrent");
    expect(result.eventTypes?.[0]?.fields).toHaveLength(2);
  });

  it("preserves a custom logSectionOrder if present", () => {
    const order = ["sleep", "bigRocks", "lion-mane"];
    const result = migrateAppSettings({
      logSectionOrder: order as never,
    });
    expect(result.logSectionOrder).toEqual(order);
  });

  it("preserves and normalizes an existing cheatPolicy", () => {
    const result = migrateAppSettings({
      cheatPolicy: {
        weeklyCap: 3,
        pendingCap: 5,
        pendingCapEffectiveWeek: "2026-05-25",
        weekStart: "2026-05-18",
        spentThisWeek: 2,
      },
    });

    expect(result.cheatPolicy).toEqual({
      weeklyCap: 3,
      pendingCap: 5,
      pendingCapEffectiveWeek: "2026-05-25",
      weekStart: "2026-05-18",
      spentThisWeek: 2,
    });
  });
});

// ── settingsNeedsMigration ────────────────────────────────────────────────

describe("settingsNeedsMigration", () => {
  it("returns true when schemaVersion is undefined", () => {
    expect(settingsNeedsMigration({})).toBe(true);
  });

  it("returns true when schemaVersion is below current", () => {
    expect(settingsNeedsMigration({ schemaVersion: 1 })).toBe(true);
  });

  it("returns false when schemaVersion matches", () => {
    expect(
      settingsNeedsMigration({ schemaVersion: APP_SETTINGS_SCHEMA_VERSION }),
    ).toBe(false);
  });
});

// ── migrateDailyLog ───────────────────────────────────────────────────────

function baseLog(): DailyLog {
  return {
    id: "2026-05-15",
    date: "2026-05-15",
    createdAt: 1715000000000,
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
  };
}

describe("migrateDailyLog", () => {
  it("synthesizes eventEntries from legacy customMetricValues", () => {
    const log: DailyLog = {
      ...baseLog(),
      customMetricValues: [
        { id: "lion-mane", kind: "toggle", value: true },
        { id: "soreness", kind: "scale", value: 7 },
        { id: "tags", kind: "chips", selected: ["focused", "calm"] },
      ],
    };

    const migrated = migrateDailyLog(log);

    expect(migrated.eventEntries).toHaveLength(3);
    expect(migrated.eventEntries?.[0]).toMatchObject({
      typeId: "lion-mane",
      date: "2026-05-15",
      fieldValues: { "lion-mane-field": true },
    });
    expect(migrated.eventEntries?.[1]?.fieldValues).toEqual({
      "soreness-field": 7,
    });
    expect(migrated.eventEntries?.[2]?.fieldValues).toEqual({
      "tags-field": ["focused", "calm"],
    });
    // Legacy field is kept for one release
    expect(migrated.customMetricValues).toEqual(log.customMetricValues);
  });

  it("normalizes legacy 10-point focus and energy ratings to 5-point ratings", () => {
    const migrated = migrateDailyLog({
      ...baseLog(),
      output: { tasksCompleted: 4, focusRating: 7, energyRating: 10 },
    });

    expect(migrated.output.focusRating).toBe(4);
    expect(migrated.output.energyRating).toBe(5);
    expect(migrated.output.tasksCompleted).toBe(4);
  });

  it("is idempotent — pre-migrated logs pass through unchanged", () => {
    const log: DailyLog = {
      ...baseLog(),
      eventEntries: [
        {
          id: "e1",
          typeId: "lion-mane",
          date: "2026-05-15",
          fieldValues: { "lion-mane-field": true },
          createdAt: 1,
        },
      ],
      customMetricValues: [
        { id: "lion-mane", kind: "toggle", value: false }, // intentionally different
      ],
    };

    const migrated = migrateDailyLog(log);

    // eventEntries already present — we trust those, not the legacy values
    expect(migrated.eventEntries).toBe(log.eventEntries);
    expect(migrated.eventEntries?.[0]?.fieldValues).toEqual({
      "lion-mane-field": true,
    });
  });

  it("drops corrupt legacy values silently", () => {
    const log: DailyLog = {
      ...baseLog(),
      customMetricValues: [
        { id: "good", kind: "toggle", value: true },
        // missing fields — corrupt
        { kind: "toggle" } as never,
        { id: "bad-scale", kind: "scale" } as never,
        { id: "bad-chips", kind: "chips" } as never,
        { id: "okay-counter", kind: "counter", value: 3 },
      ],
    };

    const migrated = migrateDailyLog(log);

    // Only "good" + "okay-counter" survive
    expect(migrated.eventEntries).toHaveLength(2);
    expect(migrated.eventEntries?.map((e) => e.typeId)).toEqual([
      "good",
      "okay-counter",
    ]);
  });

  it("produces an empty eventEntries array when there's nothing to migrate", () => {
    const log = baseLog();

    const migrated = migrateDailyLog(log);

    expect(migrated.eventEntries).toEqual([]);
  });
});
