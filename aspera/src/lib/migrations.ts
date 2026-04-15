import {
  AppSettings,
  CustomMetricDef,
  CustomMetricValue,
  DailyLog,
} from "../types";
import { createMetricDef, setValue } from "./customMetrics";

export function migrateLegacyCustomMetrics(
  settings: AppSettings,
  logs: DailyLog[],
): {
  settings: AppSettings;
  logs: DailyLog[];
  createdDefs: CustomMetricDef[];
} {
  const defsByName = new Map<string, CustomMetricDef>();
  for (const def of settings.customMetrics) {
    defsByName.set(def.name, def);
  }

  const createdDefs: CustomMetricDef[] = [];

  const ensureDef = (name: string): CustomMetricDef => {
    const existing = defsByName.get(name);
    if (existing) return existing;
    const def = createMetricDef({
      name,
      kind: "scale",
      scale: { min: 1, max: 10 },
    });
    defsByName.set(name, def);
    createdDefs.push(def);
    return def;
  };

  const migratedLogs = logs.map((log) => {
    const legacy = log.customMetrics ?? [];
    if (legacy.length === 0) return log;
    let values: CustomMetricValue[] = log.customMetricValues ?? [];
    for (const entry of legacy) {
      const def = ensureDef(entry.name);
      values = setValue(values, {
        id: def.id,
        kind: "scale",
        value: entry.value,
      });
    }
    return { ...log, customMetricValues: values };
  });

  const nextSettings: AppSettings = {
    ...settings,
    customMetrics: [...settings.customMetrics, ...createdDefs],
  };

  return { settings: nextSettings, logs: migratedLogs, createdDefs };
}
