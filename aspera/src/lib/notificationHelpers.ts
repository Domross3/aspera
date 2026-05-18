// Shared scheduling primitives for local notifications. Originally lived
// inside quickMoodNotifications.ts; extracted here so userReminderNotifications
// can reuse the same machinery without copy-paste.

export interface ParsedTime {
  hour: number;
  minute: number;
}

export interface ParsedWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export function parseTime(hhmm: string): ParsedTime {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return {
    hour: Number.isFinite(h) ? h : 0,
    minute: Number.isFinite(m) ? m : 0,
  };
}

export function parseWindow(start: string, end: string): ParsedWindow {
  const s = parseTime(start);
  const e = parseTime(end);
  return {
    startHour: s.hour,
    startMinute: s.minute,
    endHour: e.hour,
    endMinute: e.minute,
  };
}

export function minutesInWindow(window: ParsedWindow): number {
  const startMin = window.startHour * 60 + window.startMinute;
  const endMin = window.endHour * 60 + window.endMinute;
  return Math.max(0, endMin - startMin);
}

/**
 * Pick `count` random minute offsets within [0, windowMinutes), each at
 * least `minGapMin` apart. Returns at most `count` offsets, sorted
 * ascending; may return fewer if the window can't accommodate them.
 */
export function pickRandomOffsets(
  count: number,
  windowMinutes: number,
  minGapMin: number,
): number[] {
  if (windowMinutes <= 0 || count <= 0) return [];
  const offsets: number[] = [];
  const maxAttempts = 50;
  let attempts = 0;
  while (offsets.length < count && attempts < maxAttempts) {
    const candidate = Math.floor(Math.random() * windowMinutes);
    const ok = offsets.every((o) => Math.abs(o - candidate) >= minGapMin);
    if (ok) offsets.push(candidate);
    attempts += 1;
  }
  return offsets.sort((a, b) => a - b);
}

/**
 * For a given window and a per-day count, build Date objects covering
 * `daysAhead` days starting today. Past trigger times (today only) are
 * filtered out — no point scheduling a notification for 3am if it's
 * already 4am.
 */
export function buildDailyTriggerDates(
  daysAhead: number,
  count: number,
  window: ParsedWindow,
  minGapMin: number,
  weekdayFilter?: (date: Date) => boolean,
): Date[] {
  const windowMinutes = minutesInWindow(window);
  const dates: Date[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() + dayOffset);
    if (weekdayFilter && !weekdayFilter(dayDate)) continue;

    const offsets = pickRandomOffsets(count, windowMinutes, minGapMin);
    for (const offsetMin of offsets) {
      const fireDate = new Date(dayDate);
      fireDate.setHours(
        window.startHour,
        window.startMinute + offsetMin,
        0,
        0,
      );
      // Skip times in the past (only affects today's schedule).
      if (fireDate.getTime() > now.getTime() + 60_000) {
        dates.push(fireDate);
      }
    }
  }
  return dates;
}

/**
 * For fixed-time schedules: build Date objects for each `HH:MM` time
 * across `daysAhead` days, optionally filtered by weekday.
 */
export function buildFixedTimeTriggerDates(
  daysAhead: number,
  times: string[],
  weekdayFilter?: (date: Date) => boolean,
): Date[] {
  const dates: Date[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() + dayOffset);
    if (weekdayFilter && !weekdayFilter(dayDate)) continue;

    for (const t of times) {
      const { hour, minute } = parseTime(t);
      const fireDate = new Date(dayDate);
      fireDate.setHours(hour, minute, 0, 0);
      if (fireDate.getTime() > now.getTime() + 60_000) {
        dates.push(fireDate);
      }
    }
  }
  return dates;
}
