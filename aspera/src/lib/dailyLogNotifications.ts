// Daily morning + evening log notifications.
//
// The Settings UI has long exposed `morningEnabled`/`morningTime` and
// `eveningEnabled`/`eveningTime` toggles, but until now nothing in the
// codebase actually scheduled them — they were dead UI. This module
// fills that gap.
//
// Both notifications repeat daily at the user's chosen wall-clock time
// using an iOS CALENDAR trigger (DAILY repeating) — that's a single
// scheduled item per kind, lives across app launches, no per-day churn
// like the random quick-mood pulses need. The OS handles timezone +
// daylight savings automatically.
//
// Carried `data.kind`:
//   - "morning_log"  → tap routes to /(tabs)/log (today)
//   - "evening_log"  → tap routes to /(tabs)/log (today)

import * as Notifications from "expo-notifications";
import type { NotificationSettings } from "../types";
import { parseTime } from "./notificationHelpers";

export const MORNING_LOG_NOTIFICATION_KIND = "morning_log";
export const EVENING_LOG_NOTIFICATION_KIND = "evening_log";

const MORNING_COPY = {
  title: "Morning check-in",
  body: "Tap to log how you're starting the day — mood + energy.",
};
const EVENING_COPY = {
  title: "Evening reflection",
  body: "Log today before you forget the details.",
};

async function cancelByKind(kind: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => (n.content.data as { kind?: string })?.kind === kind)
    .map((n) => n.identifier);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

async function scheduleDaily(
  kind: string,
  hhmm: string,
  title: string,
  body: string,
): Promise<void> {
  const { hour, minute } = parseTime(hhmm);
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { kind },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Sync the morning + evening log schedules with the user's
 * NotificationSettings. Idempotent — cancels what we own first, then
 * re-schedules only the kinds that are enabled. Safe to call on every
 * app launch and after any settings change.
 */
export async function ensureDailyLogSchedule(
  settings: NotificationSettings,
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await cancelByKind(MORNING_LOG_NOTIFICATION_KIND);
    await cancelByKind(EVENING_LOG_NOTIFICATION_KIND);
    return;
  }

  await cancelByKind(MORNING_LOG_NOTIFICATION_KIND);
  if (settings.morningEnabled) {
    await scheduleDaily(
      MORNING_LOG_NOTIFICATION_KIND,
      settings.morningTime,
      MORNING_COPY.title,
      MORNING_COPY.body,
    );
  }

  await cancelByKind(EVENING_LOG_NOTIFICATION_KIND);
  if (settings.eveningEnabled) {
    await scheduleDaily(
      EVENING_LOG_NOTIFICATION_KIND,
      settings.eveningTime,
      EVENING_COPY.title,
      EVENING_COPY.body,
    );
  }
}

/**
 * Cancel both morning + evening scheduled notifications. Used by the
 * diagnostic "rebuild schedule" surface so it can re-roll cleanly.
 */
export async function cancelAllDailyLogNotifications(): Promise<void> {
  await cancelByKind(MORNING_LOG_NOTIFICATION_KIND);
  await cancelByKind(EVENING_LOG_NOTIFICATION_KIND);
}
