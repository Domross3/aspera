// Phase 1 persistence-bug diagnosis (Log redesign).
//
// User reports: "hidden fields like daylight come back", "log won't stay
// saved". Two candidate mechanisms were proposed: (a) settings round-trip
// drops fields via the migrate-on-read whitelist, (b) the DailyLog
// hydrate↔save path. This suite isolates (a): it exercises the EXACT
// save → persist(raw) → reload(migrate) cycle the app uses and asserts that
// user field-hiding survives. If these pass, the settings layer is exonerated
// and the bug lives in the DailyLog path (addressed in Log Phase 2 autosave).

import { migrateAppSettings, settingsNeedsMigration } from "../migrations";
import { APP_SETTINGS_SCHEMA_VERSION, AppSettings } from "../../types";

// Mirrors storage.ts getSettings(): JSON round-trip through AsyncStorage +
// migrate-on-read. saveSettings writes the object verbatim (no re-migrate),
// so we model that faithfully.
function reloadFromPersisted(saved: AppSettings): AppSettings {
  const raw = JSON.stringify(saved); // saveSettings stores verbatim
  const stored = JSON.parse(raw) as Partial<AppSettings>;
  return migrateAppSettings(stored);
}

const BASE = (): AppSettings => migrateAppSettings({});

describe("settings persistence round-trip (hidden fields)", () => {
  it("preserves a hidden whole section across reload", () => {
    const saved: AppSettings = { ...BASE(), hiddenLogSections: ["daylight"] };
    const reloaded = reloadFromPersisted(saved);
    expect(reloaded.hiddenLogSections).toContain("daylight");
  });

  it("preserves a hidden individual field across reload", () => {
    const saved: AppSettings = {
      ...BASE(),
      hiddenSystemFields: ["nutrition.hydration"],
    };
    const reloaded = reloadFromPersisted(saved);
    expect(reloaded.hiddenSystemFields).toContain("nutrition.hydration");
  });

  it("is idempotent: a second reload keeps the hidden field", () => {
    const saved: AppSettings = { ...BASE(), hiddenLogSections: ["daylight"] };
    const once = reloadFromPersisted(saved);
    const twice = reloadFromPersisted(once);
    expect(twice.hiddenLogSections).toContain("daylight");
  });

  it("preserves a custom section order across reload", () => {
    const order = ["sleep", "nutrition", "caffeine"];
    const saved: AppSettings = { ...BASE(), logSectionOrder: order };
    const reloaded = reloadFromPersisted(saved);
    expect(reloaded.logSectionOrder).toEqual(order);
  });

  it("after one reload the blob no longer needs migration (write-back is stable)", () => {
    const saved: AppSettings = { ...BASE(), hiddenLogSections: ["daylight"] };
    const reloaded = reloadFromPersisted(saved);
    // schemaVersion is stamped current, so subsequent launches skip migration.
    expect(reloaded.schemaVersion).toBe(APP_SETTINGS_SCHEMA_VERSION);
    expect(
      settingsNeedsMigration(JSON.parse(JSON.stringify(reloaded))),
    ).toBe(false);
  });
});
