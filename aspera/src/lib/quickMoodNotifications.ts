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
import {
  buildDailyTriggerDates,
  minutesInWindow,
  parseWindow,
  type ParsedWindow,
} from "./notificationHelpers";

const NOTIFICATION_KIND = "quick_mood_check";
const SCHEDULE_DAYS = 7;
const MIN_HOURS_BETWEEN = 2;
const RESCHEDULE_THRESHOLD = SCHEDULE_DAYS * 2; // re-schedule when below this many
// If the user's wake→sleep window is inverted or too small to hold even a
// single pulse, fall back to a sane daytime window so pulses never silently
// drop to zero (a real failure mode when wake/sleep got mis-set).
const FALLBACK_WINDOW: ParsedWindow = {
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
};
const MIN_GAP_FLOOR_MIN = 15;

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
    .filter(
      (n) => (n.content.data as { kind?: string })?.kind === NOTIFICATION_KIND,
    )
    .map((n) => n.identifier);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
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

  const frequency = Math.max(1, Math.min(8, settings.quickMoodFrequency));

  // Guard a degenerate window: if wake→sleep is inverted, zero, or too tight
  // to hold a single pulse, fall back to a daytime window. Otherwise a
  // mis-set wake/sleep silently produces no pulses at all.
  let window = parseWindow(settings.wakeTime, settings.sleepTime);
  if (minutesInWindow(window) < 30) {
    window = FALLBACK_WINDOW;
  }

  // Shrink the inter-pulse gap if the window can't fit `frequency` pulses at
  // the default 2h spacing — without this, a 12h window with frequency 8
  // (needs 7×120m = 840m > 720m) silently schedules fewer than requested.
  const winMin = minutesInWindow(window);
  const fitGap = frequency > 1 ? Math.floor(winMin / (frequency - 1)) : winMin;
  const gapMin = Math.max(
    MIN_GAP_FLOOR_MIN,
    Math.min(MIN_HOURS_BETWEEN * 60, fitGap),
  );

  const dates = buildDailyTriggerDates(
    SCHEDULE_DAYS,
    frequency,
    window,
    gapMin,
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
