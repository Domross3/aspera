// Candidate lever enumeration for the confidence-gated sweep (Engine A).
//
// A "lever" is a binary daily condition we test against the outcome series:
// the set of dates on which it was active (treatment) vs the rest (control).
// We curate to iPhone-feasible, low-tautology levers — alcohol, event toggles,
// recurrent event presence, and recurring free-form Moment labels — because
// every extra lever raises the FDR bar for ALL findings (see fdr.ts). The real
// per-pair power gate (≥7 treatment AND ≥7 control days) is applied later in
// runSweep, so only adequately-powered pairs ever enter the FDR family.

import type { DailyLog, EventTypeDef, Moment } from "../../types";
import { localDateKey } from "./aggregate";

export interface Lever {
  id: string;
  label: string;
  /** YYYY-MM-DD dates on which this lever was active. */
  treatmentDates: Set<string>;
}

// Cheap pre-filter: a lever must occur on at least this many distinct days to
// be worth enumerating. Mirrors momentPromotion's ≥3 recurrence threshold.
const MIN_LEVER_DAYS = 3;

function emoji(et: EventTypeDef): string {
  return et.emoji ? `${et.emoji} ` : "";
}

/**
 * Enumerate candidate levers from the user's own logged data:
 *   1. Alcohol (daily-log `drinks > 0`)
 *   2. Event-type toggle fields (e.g. "Meditated: yes")
 *   3. Recurrent event-type presence ("Had a workout today")
 *   4. Recurring free-form Moment labels ("coffee", "gym", …)
 *   5. App restriction active days (OBSERVATIONAL — see note below).
 */
export function buildLevers(
  logs: DailyLog[],
  moments: Moment[],
  eventTypes: EventTypeDef[],
  // OBSERVATIONAL lever: confounded by time/trend because the user chose when
  // to enable restrictions (selection bias). The rigorous test is a randomised
  // n-of-1 where restriction-on days are assigned by coin flip (planned
  // follow-up). Until then, treat any finding here as hypothesis-generating only.
  restrictionActiveDates: string[] = [],
): Lever[] {
  const levers: Lever[] = [];

  // 1. Alcohol.
  const alcoholDates = new Set<string>();
  for (const log of logs) {
    if ((log.drinks ?? 0) > 0) alcoholDates.add(log.date);
  }
  if (alcoholDates.size >= MIN_LEVER_DAYS) {
    levers.push({
      id: "alcohol",
      label: "🍸 Had alcohol",
      treatmentDates: alcoholDates,
    });
  }

  // 2 & 3. Event-type toggles + recurrent presence.
  for (const et of eventTypes) {
    for (const field of et.fields) {
      if (field.kind !== "toggle") continue;
      const dates = new Set<string>();
      for (const log of logs) {
        const entry = (log.eventEntries ?? []).find((e) => e.typeId === et.id);
        if (entry?.fieldValues?.[field.id] === true) dates.add(log.date);
      }
      if (dates.size >= MIN_LEVER_DAYS) {
        levers.push({
          id: `evt:${et.id}:${field.id}`,
          label: `${emoji(et)}${et.name}: ${field.name}`,
          treatmentDates: dates,
        });
      }
    }

    if (et.cardinality === "recurrent") {
      const dates = new Set<string>();
      for (const log of logs) {
        if ((log.eventEntries ?? []).some((e) => e.typeId === et.id)) {
          dates.add(log.date);
        }
      }
      if (dates.size >= MIN_LEVER_DAYS) {
        levers.push({
          id: `evt-present:${et.id}`,
          label: `${emoji(et)}Had ${et.name}`,
          treatmentDates: dates,
        });
      }
    }
  }

  // 4. Recurring Moment labels (case-insensitive, trimmed — matches the loose
  // comparison momentPromotion uses).
  const byLabel = new Map<string, { display: string; dates: Set<string> }>();
  for (const mo of moments) {
    const norm = mo.label.trim().toLowerCase();
    if (!norm) continue;
    const date = localDateKey(mo.timestamp);
    const entry = byLabel.get(norm) ?? {
      display: mo.label.trim(),
      dates: new Set<string>(),
    };
    entry.dates.add(date);
    byLabel.set(norm, entry);
  }
  byLabel.forEach((entry, norm) => {
    if (entry.dates.size >= MIN_LEVER_DAYS) {
      levers.push({
        id: `moment:${norm}`,
        label: entry.display,
        treatmentDates: entry.dates,
      });
    }
  });

  // 5. App restriction active days.
  // OBSERVATIONAL lever: confounded by time/trend because the user chose when
  // to enable restrictions (selection bias). The rigorous test is a randomised
  // n-of-1 where restriction-on days are assigned by coin flip (planned
  // follow-up). Until then, treat any finding here as hypothesis-generating only.
  const uniqueRestrictionDates = new Set(restrictionActiveDates);
  if (uniqueRestrictionDates.size >= MIN_LEVER_DAYS) {
    levers.push({
      id: "restriction-active",
      label: "🔒 App limit active",
      treatmentDates: uniqueRestrictionDates,
    });
  }

  return levers;
}
