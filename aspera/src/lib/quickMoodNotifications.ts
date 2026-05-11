// Local notification scheduling for quick mood check-ins.
//
// Architecture: we schedule local notifications on-device (no server cron).
// expo-notifications fires them even when the app is closed, respects the
// user's timezone automatically, and works offline.
//
// We schedule the next 7 days at a time. Each day gets N notifications
// (default 3) at random times within the waking window (default 9am–9pm),
// with a 2-hour minimum gap between any two on the same day. New random
// times are picked fresh each day — there's no fixed daily pattern.
//
// Each notification carries `data.kind = "quick_mood_check"` so the root
// layout's response listener can recognize it and route to /quick-mood.
//
// Idempotency: ensureQuickMoodSchedule() checks how many scheduled notifs
// already exist; if we have <14 (≈ less than 5 days of buffer), it cancels
// everything tagged for quick-mood and re-schedules a fresh week.

import * as Notifications from "expo-notifications";
import { NotificationSettings } from "../types";

const NOTIFICATION_KIND = "quick_mood_check";
const SCHEDULE_DAYS = 7;
const MIN_HOURS_BETWEEN = 2;
const RESCHEDULE_THRESHOLD = SCHEDULE_DAYS * 2; // re-schedule when below this many

interface ParsedWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return {
    hour: Number.isFinite(h) ? h : 0,
    minute: Number.isFinite(m) ? m : 0,
  };
}

function parseWindow(settings: NotificationSettings): ParsedWindow {
  const start = parseTime(settings.quickMoodWindowStart);
  const end = parseTime(settings.quickMoodWindowEnd);
  return {
    startHour: start.hour,
    startMinute: start.minute,
    endHour: end.hour,
    endMinute: end.minute,
  };
}

function minutesInWindow(window: ParsedWindow): number {
  const startMin = window.startHour * 60 + window.startMinute;
  const endMin = window.endHour * 60 + window.endMinute;
  return Math.max(0, endMin - startMin);
}

/**
 * Pick `count` random minute offsets within [0, windowMinutes), each at
 * least `minGapMin` apart. If the window can't fit `count` notifications
 * with the requested gap, returns as many as fit.
 */
function pickRandomOffsets(
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

function buildDailyTriggerDates(
  daysAhead: number,
  count: number,
  window: ParsedWindow,
): Date[] {
  const windowMinutes = minutesInWindow(window);
  const minGap = MIN_HOURS_BETWEEN * 60;
  const dates: Date[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const offsets = pickRandomOffsets(count, windowMinutes, minGap);
    for (const offsetMin of offsets) {
      const fireDate = new Date(now);
      fireDate.setDate(fireDate.getDate() + dayOffset);
      fireDate.setHours(
        window.startHour,
        window.startMinute + offsetMin,
        0,
        0,
      );
      // Skip times in the past (only affects today's schedule)
      if (fireDate.getTime() > now.getTime() + 60_000) {
        dates.push(fireDate);
      }
    }
  }
  return dates;
}

const COPY_OPTIONS: { title: string; body: string }[] = [
  { title: "Mood check-in", body: "How's it going right now?" },
  { title: "Quick check-in", body: "What's happening?" },
  { title: "Pulse check", body: "Tap to log mood + energy" },
  { title: "Aspera", body: "A 10-second check-in?" },
];

function pickCopy(): { title: string; body: string } {
  return COPY_OPTIONS[Math.floor(Math.random() * COPY_OPTIONS.length)];
}

/**
 * Cancel every quick-mood notification we've scheduled. We tag by reading
 * the data payload — any notification whose data.kind matches our constant.
 */
export async function cancelAllQuickMoodNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => (n.content.data as { kind?: string })?.kind === NOTIFICATION_KIND)
    .map((n) => n.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function countQuickMoodNotifications(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (n) => (n.content.data as { kind?: string })?.kind === NOTIFICATION_KIND,
  ).length;
}

/**
 * Ensures the next ~week of quick-mood notifications is scheduled.
 *
 * - If `quickMoodEnabled` is false: cancels all quick-mood notifs.
 * - If <RESCHEDULE_THRESHOLD remain (≈ <5 days), cancels & re-schedules fresh.
 * - Otherwise no-op.
 *
 * Safe to call repeatedly (on app launch, on settings change, etc.).
 */
export async function ensureQuickMoodSchedule(
  settings: NotificationSettings,
): Promise<void> {
  if (!settings.quickMoodEnabled) {
    await cancelAllQuickMoodNotifications();
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  const existing = await countQuickMoodNotifications();
  if (existing >= RESCHEDULE_THRESHOLD) return;

  await cancelAllQuickMoodNotifications();

  const window = parseWindow(settings);
  const dates = buildDailyTriggerDates(
    SCHEDULE_DAYS,
    Math.max(1, Math.min(8, settings.quickMoodFrequency)),
    window,
  );

  for (const date of dates) {
    const copy = pickCopy();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: { kind: NOTIFICATION_KIND },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }
}

export { NOTIFICATION_KIND as QUICK_MOOD_NOTIFICATION_KIND };
