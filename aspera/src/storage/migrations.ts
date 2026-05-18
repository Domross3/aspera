// Schema migrations for on-device data shapes.
//
// Two read-time migrations live here:
//
// 1. `migrateAppSettings` — converts legacy `customMetrics: CustomMetricDef[]`
//    on AppSettings into the new `eventTypes: EventTypeDef[]` shape, while
//    also folding in the older `quickMoodWindowStart/End` notification
//    fields if they happen to be on a pre-Phase-1 settings blob.
//
// 2. `migrateDailyLog` — converts legacy `customMetricValues:
//    CustomMetricValue[]` into `eventEntries: EventEntry[]`.
//
// Both are pure functions. They preserve original ids so the new
// definitions/entries stay linked to whatever the user already had. Both
// are idempotent: running them twice produces the same result. Neither
// throws on bad input — corrupt entries are silently dropped so a single
// bad row never blocks a user from opening their app.
//
// The legacy fields stay on the output during the migration window: that
// way a release that rolls back to the pre-Phase-2 code can still read
// existing data. We only drop the legacy fields after one full release
// cycle of Phase 2 data flowing.

import {
  AppSettings,
  APP_SETTINGS_SCHEMA_VERSION,
  CustomMetricDef,
  CustomMetricValue,
  DailyLog,
  EventEntry,
  EventTypeDef,
  FieldConfig,
  FieldDef,
  FieldKind,
  NotificationSettings,
} from "../types";

// Deterministic field id per migrated def. Two passes over the same input
// produce the same id, which is what lets `migrateDailyLog` reuse them
// without a runtime lookup table.
function fieldIdFor(defId: string): string {
  return `${defId}-field`;
}

// Map an old CustomMetricKind onto the new FieldKind. The four legacy
// kinds correspond 1:1 to four of the six new kinds (text + duration are
// genuinely new and have no legacy equivalent).
function mapKind(kind: CustomMetricDef["kind"]): FieldKind {
  switch (kind) {
    case "scale":
    case "chips":
    case "counter":
    case "toggle":
      return kind;
    default:
      return "scale"; // shouldn't happen — bad data lands here, scale is the safest fallback
  }
}

function buildFieldConfig(def: CustomMetricDef): FieldConfig | undefined {
  switch (def.kind) {
    case "scale":
      if (!def.scale) return undefined;
      return { min: def.scale.min, max: def.scale.max };
    case "chips":
      if (!def.chips) return undefined;
      return { options: def.chips.options, multi: def.chips.multi };
    case "counter":
      if (!def.counter) return undefined;
      return {
        step: def.counter.step,
        min: def.counter.min,
        max: def.counter.max,
        unit: def.counter.unit,
      };
    case "toggle":
      return undefined; // no config needed
    default:
      return undefined;
  }
}

// Convert one legacy CustomMetricDef → one single-cardinality EventTypeDef
// containing a single field of the matching kind. The field's name mirrors
// the type name (single-field types render with the type label and one
// widget — duplicating the name into the field is invisible to the user).
export function migrateCustomMetricDef(def: CustomMetricDef): EventTypeDef {
  return {
    id: def.id,
    name: def.name,
    cardinality: "single",
    fields: [
      {
        id: fieldIdFor(def.id),
        name: def.name,
        kind: mapKind(def.kind),
        required: false,
        config: buildFieldConfig(def),
      },
    ],
    createdAt:
      typeof def.createdAt === "number" && Number.isFinite(def.createdAt)
        ? def.createdAt
        : Date.now(),
  };
}

// Pull the per-kind value out of a legacy CustomMetricValue into the
// `fieldValues` map shape used by EventEntry. Returns null if the value
// is corrupt (unknown kind, missing payload) — caller drops nulls.
function extractLegacyValue(v: CustomMetricValue): unknown {
  switch (v.kind) {
    case "scale":
    case "counter":
      return typeof v.value === "number" ? v.value : null;
    case "toggle":
      return typeof v.value === "boolean" ? v.value : null;
    case "chips":
      return Array.isArray(v.selected) ? v.selected : null;
    default:
      return null;
  }
}

// Read-time AppSettings migration. Idempotent. Always returns a settings
// object with `schemaVersion === APP_SETTINGS_SCHEMA_VERSION` set.
export function migrateAppSettings(stored: Partial<AppSettings>): AppSettings {
  // Cast through `any` deliberately for the notification field migration —
  // old persisted blobs may have legacy fields the current type doesn't list.
  const storedNotif = (stored.notificationSettings ?? {}) as Partial<
    NotificationSettings
  > & {
    quickMoodWindowStart?: string;
    quickMoodWindowEnd?: string;
  };

  const notificationSettings: NotificationSettings = {
    morningEnabled: storedNotif.morningEnabled ?? true,
    morningTime: storedNotif.morningTime ?? "08:00",
    eveningEnabled: storedNotif.eveningEnabled ?? true,
    eveningTime: storedNotif.eveningTime ?? "21:00",
    wakeTime:
      storedNotif.wakeTime ?? storedNotif.quickMoodWindowStart ?? "07:00",
    sleepTime:
      storedNotif.sleepTime ?? storedNotif.quickMoodWindowEnd ?? "22:00",
    quickMoodEnabled: storedNotif.quickMoodEnabled ?? false,
    quickMoodFrequency: storedNotif.quickMoodFrequency ?? 3,
    somaticInterceptorEnabled: storedNotif.somaticInterceptorEnabled ?? true,
  };

  // Pass through pre-migrated event types if they exist; otherwise build
  // them from legacy customMetrics. Idempotency check: if eventTypes is
  // present we trust it and skip the legacy conversion (the user may have
  // already edited their event types past the migrated shape).
  const legacyDefs = Array.isArray(stored.customMetrics)
    ? stored.customMetrics
    : [];
  const eventTypes: EventTypeDef[] =
    Array.isArray(stored.eventTypes) && stored.eventTypes.length > 0
      ? stored.eventTypes
      : legacyDefs.map(migrateCustomMetricDef);

  // Preserve any existing custom order; otherwise leave undefined so the
  // renderer derives a default (system sections first, then event types).
  const logSectionOrder = Array.isArray(stored.logSectionOrder)
    ? stored.logSectionOrder
    : undefined;

  return {
    schemaVersion: APP_SETTINGS_SCHEMA_VERSION,
    onboardingComplete: stored.onboardingComplete ?? false,
    moodNotificationsEnabled: stored.moodNotificationsEnabled ?? false,
    hiddenLogSections: Array.isArray(stored.hiddenLogSections)
      ? stored.hiddenLogSections
      : [],
    customMetrics: legacyDefs, // kept verbatim for rollback safety
    eventTypes,
    logSectionOrder,
    userReminders: Array.isArray(stored.userReminders)
      ? stored.userReminders
      : undefined,
    dismissedPromotions: Array.isArray(stored.dismissedPromotions)
      ? stored.dismissedPromotions
      : undefined,
    notificationSettings,
  };
}

// Read-time DailyLog migration. Idempotent. If eventEntries already
// exists, the legacy customMetricValues are ignored (we trust the new
// shape). Otherwise we synthesize eventEntries from the legacy array.
export function migrateDailyLog(log: DailyLog): DailyLog {
  if (Array.isArray(log.eventEntries)) {
    return log; // already in the new shape; leave legacy fields untouched
  }

  const legacyValues = Array.isArray(log.customMetricValues)
    ? log.customMetricValues
    : [];

  const eventEntries: EventEntry[] = [];
  const createdAt =
    typeof log.createdAt === "number" && Number.isFinite(log.createdAt)
      ? log.createdAt
      : Date.now();

  for (const v of legacyValues) {
    if (!v || typeof v.id !== "string") continue;
    const value = extractLegacyValue(v);
    if (value === null) continue; // corrupt legacy entry — drop it silently
    eventEntries.push({
      id: `${log.id}-${v.id}`,
      typeId: v.id,
      date: log.date,
      fieldValues: { [fieldIdFor(v.id)]: value },
      createdAt,
    });
  }

  return {
    ...log,
    eventEntries,
  };
}

// Did `migrateAppSettings` actually produce a different settings object?
// Used by `getSettings` to decide whether to write the migrated value
// back to AsyncStorage. Cheap shallow check — we don't compare every
// nested field, just the top-level shape indicators.
export function settingsNeedsMigration(
  stored: Partial<AppSettings>,
): boolean {
  if (
    typeof stored.schemaVersion !== "number" ||
    stored.schemaVersion < APP_SETTINGS_SCHEMA_VERSION
  ) {
    return true;
  }
  return false;
}
