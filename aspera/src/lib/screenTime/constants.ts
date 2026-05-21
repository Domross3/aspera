// Single source of truth for Screen Time / Family Controls constants shared
// between the JS layer, the local native module, and both iOS extension
// targets. The App Group id MUST match `ios/Constants.swift` and the App
// Group capability set on all three targets (main app + DeviceActivityMonitor
// + DeviceActivityReport) — drift here silently breaks cross-process reads.
//
// Phase 8 — screen controls. See the plan: App Group state is the bridge
// between the out-of-process extensions and the main app.

export const APP_GROUP_ID = "group.com.dominicross.aspera";

// Keys written/read in the App Group's shared UserDefaults, namespaced per
// restriction id. The JS/cloud `Restriction` object is metadata only — these
// keys are the authoritative live enforcement state.
export const APP_GROUP_KEYS = {
  // Encoded FamilyActivitySelection (opaque app/category tokens) per restriction.
  selection: (id: string) => `selection:${id}`,
  // Whether the shield is currently applied for this restriction.
  activeRestriction: (id: string) => `activeRestriction:${id}`,
  // Epoch ms when an active cheat's 30-min break ends.
  cheatExpiry: (id: string) => `cheatExpiry:${id}`,
  // "window" | "cap" | "cheat-rearm" — debugging + guarded re-arm decision.
  lastAppliedReason: (id: string) => `lastAppliedReason:${id}`,
  // JSON blob of the most recent per-category daily totals (data ingestion).
  dailyTotals: "dailyTotals",
} as const;

// Deterministic DeviceActivity activity names. Stable names make
// cancel/restart/debug tractable across app launches + the extensions.
export const ACTIVITY_NAMES = {
  window: (id: string) => `restriction-window-${id}`,
  cap: (id: string) => `restriction-cap-${id}`,
  cheatRearm: (id: string) => `restriction-cheat-rearm-${id}`,
} as const;

// Named ManagedSettingsStore per restriction so each shield clears
// independently. Mirrors `ManagedSettingsStore(named:)` on the Swift side.
export const SHIELD_STORE_NAME = (id: string) => `restriction-${id}`;

// The five locked categories the data layer collapses Apple's emitted
// categories into. Unknown categories map to "other".
export const SCREEN_TIME_CATEGORIES = [
  "social",
  "entertainment",
  "productivity",
  "communication",
  "other",
] as const;

export type ScreenTimeCategory = (typeof SCREEN_TIME_CATEGORIES)[number];

// Default cheat break length when a cheat is spent.
export const CHEAT_BREAK_MINUTES = 30;
