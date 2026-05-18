// userReminderNotifications — schedules / reschedules / cancels the
// user-defined habit reminders from Phase 6. Same shape as
// quickMoodNotifications.ts but parameterized per-reminder.
//
// Each scheduled notification carries `data.kind = "user_reminder"` plus
// the originating reminder id (so we can re-derive what to do on tap and
// in particular deep-link into a linked EventTypeDef on the Log tab).

import * as Notifications from "expo-notifications";
import type { UserReminder } from "../types";
import {
  buildDailyTriggerDates,
  buildFixedTimeTriggerDates,
  parseWindow,
} from "./notificationHelpers";

export const USER_REMINDER_NOTIFICATION_KIND = "user_reminder";

const SCHEDULE_DAYS = 7;
const MIN_HOURS_BETWEEN_RANDOM = 2;

// Carried in `Notifications.scheduleNotificationAsync`'s `content.data`
// payload. Includes the `[key: string]: unknown` index signature that
// expo-notifications expects so we don't have to cast at every call.
interface ReminderNotificationData {
  kind: typeof USER_REMINDER_NOTIFICATION_KIND;
  reminderId: string;
  linkedEventTypeId?: string;
  [key: string]: unknown;
}

export async function cancelAllUserReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter(
      (n) =>
        (n.content.data as { kind?: string })?.kind ===
        USER_REMINDER_NOTIFICATION_KIND,
    )
    .map((n) => n.identifier);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

async function cancelRemindersById(reminderId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => {
      const data = n.content.data as
        | { kind?: string; reminderId?: string }
        | undefined;
      return (
        data?.kind === USER_REMINDER_NOTIFICATION_KIND &&
        data?.reminderId === reminderId
      );
    })
    .map((n) => n.identifier);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

function weekdayFilterFor(weekdays: number[]): (date: Date) => boolean {
  if (weekdays.length === 0 || weekdays.length === 7) {
    return () => true; // every day
  }
  const set = new Set(weekdays);
  return (d: Date) => set.has(d.getDay());
}

async function scheduleOneReminder(reminder: UserReminder): Promise<void> {
  if (!reminder.enabled) return;

  const weekdayFilter = weekdayFilterFor(reminder.weekdays);
  let triggerDates: Date[] = [];

  if (reminder.schedule.kind === "fixed") {
    triggerDates = buildFixedTimeTriggerDates(
      SCHEDULE_DAYS,
      reminder.schedule.times,
      weekdayFilter,
    );
  } else {
    const window = parseWindow(
      reminder.schedule.windowStart,
      reminder.schedule.windowEnd,
    );
    triggerDates = buildDailyTriggerDates(
      SCHEDULE_DAYS,
      Math.max(1, Math.min(5, reminder.schedule.count)),
      window,
      MIN_HOURS_BETWEEN_RANDOM * 60,
      weekdayFilter,
    );
  }

  const data: ReminderNotificationData = {
    kind: USER_REMINDER_NOTIFICATION_KIND,
    reminderId: reminder.id,
    linkedEventTypeId: reminder.linkedEventTypeId,
  };

  for (const date of triggerDates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.label,
        body: reminder.linkedEventTypeId ? "Tap to log" : "",
        sound: true,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }
}

/**
 * Sync the scheduled-notification stack with the user's reminders. Cancels
 * everything our `kind` tag owns and re-schedules. Safe to call on every
 * app launch and after any settings change — cheap (the loop runs once
 * per active reminder per week).
 *
 * Returns the number of notifications actually scheduled — useful for the
 * Settings load indicator and for warning when iOS's 64-notification cap
 * is being approached.
 */
export async function ensureUserReminderSchedule(
  reminders: UserReminder[],
): Promise<number> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await cancelAllUserReminders();
    return 0;
  }

  await cancelAllUserReminders();

  const enabled = reminders.filter((r) => r.enabled);
  for (const reminder of enabled) {
    await scheduleOneReminder(reminder);
  }

  // Recount: scheduleOneReminder may have added fewer than expected (the
  // window-based schedulers skip past times and edge cases).
  const after = await Notifications.getAllScheduledNotificationsAsync();
  return after.filter(
    (n) =>
      (n.content.data as { kind?: string })?.kind ===
      USER_REMINDER_NOTIFICATION_KIND,
  ).length;
}

// Compute the per-day notification load contribution of a single
// reminder. Used by the Settings notification-budget indicator to
// estimate "X / 64 daily notifications" before iOS's silent truncation.
export function dailyLoadOfReminder(reminder: UserReminder): number {
  if (!reminder.enabled) return 0;
  const activeDays =
    reminder.weekdays.length === 0 ? 7 : reminder.weekdays.length;
  const perActiveDay =
    reminder.schedule.kind === "fixed"
      ? reminder.schedule.times.length
      : reminder.schedule.count;
  // Average over the week (so days-off still contribute proportionally).
  return (perActiveDay * activeDays) / 7;
}

// Re-export — keep this constant alongside the other notification kinds
// for routing code in _layout.tsx.
export { USER_REMINDER_NOTIFICATION_KIND as _USER_REMINDER_NOTIFICATION_KIND };
// (`cancelRemindersById` is unused right now but kept as future-proofing
// for per-reminder edits that don't want to re-roll the whole stack. Suppress
// the unused warning explicitly by using void.)
void cancelRemindersById;
