// Pure logic for the quick-mood notification limits (no expo/RN imports so
// it's unit-testable):
//   1. Morning-anchored window start — random pulses shouldn't start until a
//      bit after the user's morning log, so logging in the morning doesn't get
//      immediately buried in pulses. If the morning log is very late (or never
//      happens), fall back to the normal wake-time start.
//   2. Backlog cap — never let more than N delivered-but-unanswered pulses pile
//      up in the tray (so the user never wakes to 6).
//   3. Schedule horizon — how far ahead to schedule, bounded by iOS's 64
//      pending-notification cap.

import type { ParsedWindow } from "./notificationHelpers";

// ── Schedule horizon ───────────────────────────────────────────────────────
// iOS keeps at most 64 pending local notifications per app and silently drops
// the excess. Daily-log (2, repeating), the weekly recap (1, repeating) and any
// user reminders share that budget, so quick-mood gets a conservative slice.
export const QUICK_MOOD_BUDGET = 40;
export const MIN_SCHEDULE_DAYS = 5;
export const MAX_SCHEDULE_DAYS = 21;

/**
 * How many days ahead to schedule at `frequency` pulses/day.
 *
 * Previously fixed at 7 days, which had two failure modes: a user who stopped
 * opening the app ran out of pulses after a week and then heard nothing ever
 * again (the pulses are what prompt opening the app, so the silence was
 * permanent), and a high frequency (8/day × 7 = 56) crowded every other
 * notification off the device via the 64 cap.
 */
export function scheduleDaysFor(frequency: number): number {
  const days = Math.floor(QUICK_MOOD_BUDGET / Math.max(1, frequency));
  return Math.min(MAX_SCHEDULE_DAYS, Math.max(MIN_SCHEDULE_DAYS, days));
}

/** Top up once fewer than ~3 days of pulses remain. */
export function rescheduleThresholdFor(frequency: number): number {
  return Math.max(6, frequency * 3);
}

/** Minutes to wait after the morning log before the pulse window opens. */
export const MORNING_LOG_LEAD_MIN = 60;
/**
 * If the morning log lands more than this long after the normal wake-time
 * start, ignore it and just use the wake-time start — a late/odd log shouldn't
 * push the whole pulse window into the afternoon.
 */
export const MORNING_LOG_MAX_SHIFT_MIN = 180;
/** Max delivered-but-unanswered quick-mood pulses allowed in the tray. */
export const MAX_UNANSWERED = 2;

function windowStartMinutes(w: ParsedWindow): number {
  return w.startHour * 60 + w.startMinute;
}

/**
 * Compute TODAY's pulse-window start (minutes since local midnight), anchoring
 * to the morning log when present and recent enough.
 *
 * - No morning log today → wake-time start (unchanged behavior).
 * - Morning log present → start = logMinute + lead (e.g. +60m), BUT never more
 *   than `maxShift` past the wake-time start (a 3pm log won't shove pulses to
 *   4pm — we cap the shift and fall back toward the normal window).
 * - Never earlier than the wake-time start.
 *
 * `morningLogMinuteOfDay` is the local minute-of-day the user logged this
 * morning, or null if they haven't logged today.
 */
export function windowStartMinuteOfDay(
  window: ParsedWindow,
  morningLogMinuteOfDay: number | null,
  lead = MORNING_LOG_LEAD_MIN,
  maxShift = MORNING_LOG_MAX_SHIFT_MIN,
): number {
  const wakeStart = windowStartMinutes(window);
  if (morningLogMinuteOfDay == null) return wakeStart;

  const anchored = morningLogMinuteOfDay + lead;
  // Don't let the anchor pull the window EARLIER than wake-time.
  const notEarlier = Math.max(wakeStart, anchored);
  // Don't let a late log push the start more than maxShift past wake-time.
  const capped = Math.min(notEarlier, wakeStart + maxShift);
  return capped;
}

/**
 * Local minute-of-day for a ms-epoch timestamp, or null if it isn't "today".
 * Pure (caller passes `now` for testability).
 */
export function morningLogMinuteOfDay(
  lastMorningLogAtMs: number | null,
  now: Date = new Date(),
): number | null {
  if (lastMorningLogAtMs == null) return null;
  const logged = new Date(lastMorningLogAtMs);
  const sameDay =
    logged.getFullYear() === now.getFullYear() &&
    logged.getMonth() === now.getMonth() &&
    logged.getDate() === now.getDate();
  if (!sameDay) return null;
  return logged.getHours() * 60 + logged.getMinutes();
}

/**
 * Given the dates (ms-epoch) of currently-delivered quick-mood notifications,
 * return the identifiers to dismiss so at most `max` of the most RECENT remain.
 * Oldest are dismissed first. Pure: caller supplies the {id, when} list.
 */
export function selectStaleToDismiss(
  delivered: { id: string; when: number }[],
  max = MAX_UNANSWERED,
): string[] {
  if (delivered.length <= max) return [];
  // Newest first; keep the first `max`, dismiss the rest.
  const sorted = [...delivered].sort((a, b) => b.when - a.when);
  return sorted.slice(max).map((n) => n.id);
}
