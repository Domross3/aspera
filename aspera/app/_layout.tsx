import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useNotifications } from "../src/hooks/useNotifications";
import { useSettings } from "../src/hooks/useSettings";
import {
  QUICK_MOOD_NOTIFICATION_KIND,
  ensureQuickMoodSchedule,
} from "../src/lib/quickMoodNotifications";

function AppLayout() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useSettings();
  useNotifications();

  // Replenish the quick-mood notification schedule on app launch. Cheap if
  // already populated (helper checks scheduled count); only re-schedules
  // when buffer is running low.
  useEffect(() => {
    if (settingsLoading) return;
    void ensureQuickMoodSchedule(settings.notificationSettings);
  }, [settingsLoading, settings.notificationSettings]);

  // OTA update check on launch. Skipped in dev (Metro handles reloads).
  useEffect(() => {
    if (__DEV__) return;
    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Network failure / no update server / etc. — fail silently
      }
    })();
  }, []);

  // Notification tap handler: when a quick-mood notification is tapped
  // (either from background or cold-start), open the modal.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const kind = (
          response.notification.request.content.data as { kind?: string }
        )?.kind;
        if (kind === QUICK_MOOD_NOTIFICATION_KIND) {
          router.push("/quick-mood" as never);
        }
      },
    );

    // Cold-start case: app was launched by tapping the notification.
    // getLastNotificationResponseAsync returns the response that launched the
    // app (or null if it wasn't launched by a notification).
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const kind = (
        response.notification.request.content.data as { kind?: string }
      )?.kind;
      if (kind === QUICK_MOOD_NOTIFICATION_KIND) {
        router.push("/quick-mood" as never);
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="quick-mood"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppLayout />
    </GestureHandlerRootView>
  );
}
