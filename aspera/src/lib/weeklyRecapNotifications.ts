// Weekly recap notification.
//
// The recap itself is composed on-device by `src/lib/agent/recap.ts` and shown
// from Today's Patterns surface. This scheduler only gives the calm agent a
// weekly delivery rhythm, using the same local-notification style as the
// morning/evening log prompts. It does not call AI and does not upload data.

import * as Notifications from "expo-notifications";

export const WEEKLY_RECAP_NOTIFICATION_KIND = "weekly_recap";

const WEEKLY_RECAP_COPY = {
  title: "Your Aspera recap is ready",
  body: "A quiet look at what stood out this week, if anything did.",
};

// Expo's weekly trigger uses 1=Sunday, 2=Monday, … 7=Saturday.
const MONDAY = 2;
const RECAP_HOUR = 9;
const RECAP_MINUTE = 0;

async function cancelByKind(kind: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => (n.content.data as { kind?: string })?.kind === kind)
    .map((n) => n.identifier);
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

/**
 * Idempotently schedules one Monday-morning recap prompt. We intentionally keep
 * this setting-free for v1: if the user has granted notifications, the recap
 * cadence exists; if not, any stale recap notification is cancelled.
 */
export async function ensureWeeklyRecapSchedule(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  await cancelByKind(WEEKLY_RECAP_NOTIFICATION_KIND);

  if (status !== "granted") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: WEEKLY_RECAP_COPY.title,
      body: WEEKLY_RECAP_COPY.body,
      data: { kind: WEEKLY_RECAP_NOTIFICATION_KIND },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: MONDAY,
      hour: RECAP_HOUR,
      minute: RECAP_MINUTE,
    },
  });
}

export async function cancelWeeklyRecapNotification(): Promise<void> {
  await cancelByKind(WEEKLY_RECAP_NOTIFICATION_KIND);
}
