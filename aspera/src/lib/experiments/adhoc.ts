// Ad-hoc comparison plumbing for the "Compare" surface inside the
// Patterns section (Phase 8 sub-phase 8g).
//
// Same engine as the experiment framework (compareDays from compare.ts);
// only the input plumbing differs. The user picks a treatment + outcome
// from their existing daily-log data + event types; this module:
//   - Enumerates available treatment + outcome options
//   - Splits a window of daily logs into control / treatment groups
//   - Extracts the outcome value for each day
//
// v1 keeps treatments binary (toggle / event present / daily-log truthy)
// because they produce clean two-group splits. Continuous treatments
// would need a median split or correlation analysis — defer to v2.

import type { DailyLog, EventTypeDef } from "../../types";
import type { DayMetric } from "./types";

export type TreatmentOption =
  | {
      kind: "event_toggle";
      eventTypeId: string;
      fieldId: string;
      label: string;
    }
  | { kind: "event_present"; eventTypeId: string; label: string }
  | { kind: "daily_log_truthy"; field: "drinks"; label: string };

export type OutcomeOption =
  | {
      kind: "daily_log_number";
      field:
        | "focusRating"
        | "energyRating"
        | "tasksCompleted"
        | "sleepHours"
        | "daylightMinutes";
      label: string;
    }
  | {
      kind: "event_field_value";
      eventTypeId: string;
      fieldId: string;
      label: string;
    };

export interface CompareGroups {
  control: DayMetric[];
  treatment: DayMetric[];
}

/**
 * Run a treatment evaluator over a single log day. Returns `true` when
 * the day belongs to the treatment group, `false` for control.
 */
function evalTreatment(log: DailyLog, opt: TreatmentOption): boolean {
  switch (opt.kind) {
    case "event_toggle": {
      const entry = (log.eventEntries ?? []).find(
        (e) => e.typeId === opt.eventTypeId,
      );
      return entry?.fieldValues?.[opt.fieldId] === true;
    }
    case "event_present":
      return (log.eventEntries ?? []).some(
        (e) => e.typeId === opt.eventTypeId,
      );
    case "daily_log_truthy":
      if (opt.field === "drinks") return (log.drinks ?? 0) > 0;
      return false;
  }
}

/**
 * Extract the numeric outcome value from a log for the chosen outcome
 * option. Returns null when the log doesn't have the value (e.g., user
 * hasn't logged that field this day) — the day is then excluded from
 * the comparison so the engine sees only valid samples.
 */
function extractOutcome(log: DailyLog, opt: OutcomeOption): number | null {
  if (opt.kind === "daily_log_number") {
    switch (opt.field) {
      case "focusRating":
        return Number.isFinite(log.output?.focusRating)
          ? log.output.focusRating
          : null;
      case "energyRating":
        return Number.isFinite(log.output?.energyRating)
          ? log.output.energyRating
          : null;
      case "tasksCompleted":
        return Number.isFinite(log.output?.tasksCompleted)
          ? log.output.tasksCompleted
          : null;
      case "sleepHours":
        return Number.isFinite(log.sleepHours) ? log.sleepHours : null;
      case "daylightMinutes":
        return Number.isFinite(log.daylightMinutes)
          ? log.daylightMinutes
          : null;
    }
  }
  if (opt.kind === "event_field_value") {
    const entry = (log.eventEntries ?? []).find(
      (e) => e.typeId === opt.eventTypeId,
    );
    const v = entry?.fieldValues?.[opt.fieldId];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * Partition `logs` into control + treatment groups based on the chosen
 * treatment and extract the outcome value for each day. Days with null
 * outcome values are dropped silently so the engine sees only complete
 * samples.
 */
export function buildCompareGroups(
  logs: DailyLog[],
  treatment: TreatmentOption,
  outcome: OutcomeOption,
): CompareGroups {
  const control: DayMetric[] = [];
  const treatmentGroup: DayMetric[] = [];

  for (const log of logs) {
    const outcomeValue = extractOutcome(log, outcome);
    if (outcomeValue === null) continue;
    const inTreatment = evalTreatment(log, treatment);
    const metric: DayMetric = { date: log.date, value: outcomeValue };
    if (inTreatment) treatmentGroup.push(metric);
    else control.push(metric);
  }

  return { control, treatment: treatmentGroup };
}

/**
 * Enumerate treatment options the user can pick from. Pulls from their
 * existing event-type definitions plus a hard-coded short list of daily-
 * log built-ins that have a clean binary signal.
 */
export function listTreatmentOptions(
  eventTypes: EventTypeDef[],
): TreatmentOption[] {
  const opts: TreatmentOption[] = [];
  const formatLabel = (et: EventTypeDef, suffix?: string): string => {
    const emoji = et.emoji ? `${et.emoji} ` : "";
    return suffix ? `${emoji}${et.name}: ${suffix}` : `${emoji}${et.name}`;
  };
  for (const et of eventTypes) {
    for (const field of et.fields) {
      if (field.kind === "toggle") {
        opts.push({
          kind: "event_toggle",
          eventTypeId: et.id,
          fieldId: field.id,
          label: formatLabel(et, field.name),
        });
      }
    }
    if (et.cardinality === "recurrent") {
      opts.push({
        kind: "event_present",
        eventTypeId: et.id,
        label: `Had ${formatLabel(et)} today`,
      });
    }
  }
  opts.push({
    kind: "daily_log_truthy",
    field: "drinks",
    label: "🍸 Had alcohol",
  });
  return opts;
}

/**
 * Enumerate outcome options. Daily-log built-ins come first (they're the
 * most common comparisons), followed by any user-defined scale / counter
 * / duration fields on their event types.
 */
export function listOutcomeOptions(
  eventTypes: EventTypeDef[],
): OutcomeOption[] {
  const opts: OutcomeOption[] = [
    {
      kind: "daily_log_number",
      field: "focusRating",
      label: "Focus rating",
    },
    {
      kind: "daily_log_number",
      field: "energyRating",
      label: "Energy rating",
    },
    {
      kind: "daily_log_number",
      field: "tasksCompleted",
      label: "Tasks completed",
    },
    { kind: "daily_log_number", field: "sleepHours", label: "Sleep (hours)" },
    {
      kind: "daily_log_number",
      field: "daylightMinutes",
      label: "Daylight (min)",
    },
  ];
  for (const et of eventTypes) {
    for (const field of et.fields) {
      if (
        field.kind === "scale" ||
        field.kind === "counter" ||
        field.kind === "duration"
      ) {
        const emoji = et.emoji ? `${et.emoji} ` : "";
        opts.push({
          kind: "event_field_value",
          eventTypeId: et.id,
          fieldId: field.id,
          label: `${emoji}${et.name}: ${field.name}`,
        });
      }
    }
  }
  return opts;
}
