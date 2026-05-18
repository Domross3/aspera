import "react-native-url-polyfill/auto";
import { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useNotifications } from "../src/hooks/useNotifications";
import { useSettings } from "../src/hooks/useSettings";
import { useAuth } from "../src/hooks/useAuth";
import { COLORS } from "../src/constants/theme";
import {
  QUICK_MOOD_NOTIFICATION_KIND,
  ensureQuickMoodSchedule,
} from "../src/lib/quickMoodNotifications";
import {
  USER_REMINDER_NOTIFICATION_KIND,
  ensureUserReminderSchedule,
} from "../src/lib/userReminderNotifications";

function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { settings, loading: settingsLoading } = useSettings();
  const { session, loading: authLoading } = useAuth();
  useNotifications();

  // Auth gate: redirect to /sign-in when there's no session, and out of
  // /sign-in once a session appears. Skip while initial auth check is in
  // flight to avoid a flash of the login screen for already-signed-in users.
  useEffect(() => {
    if (authLoading) return;
    const onSignInScreen = (segments[0] as string | undefined) === "sign-in";
    if (!session && !onSignInScreen) {
      router.replace("/sign-in" as never);
    } else if (session && onSignInScreen) {
      router.replace("/(tabs)" as never);
    }
  }, [session, authLoading, segments, router]);

  // Replenish the quick-mood notification schedule on app launch. Cheap if
  // already populated (helper checks scheduled count); only re-schedules
  // when buffer is running low.
  useEffect(() => {
    if (settingsLoading) return;
    void ensureQuickMoodSchedule(settings.notificationSettings);
  }, [settingsLoading, settings.notificationSettings]);

  // Same for user-defined reminders. The scheduler always re-rolls the
  // full set (cheaper to track) so any settings change naturally re-syncs.
  useEffect(() => {
    if (settingsLoading) return;
    void ensureUserReminderSchedule(settings.userReminders ?? []);
  }, [settingsLoading, settings.userReminders]);

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

  // Resolve what to do when a notification of any kind is tapped. Quick
  // mood pulses open the dedicated modal; user reminders deep-link to the
  // Today tab (and if they were linked to an EventTypeDef, the user can
  // navigate into the Log tab from there). Cold-start handled below.
  const handleNotificationKind = (
    data: { kind?: string; linkedEventTypeId?: string } | undefined,
  ) => {
    if (!data) return;
    if (data.kind === QUICK_MOOD_NOTIFICATION_KIND) {
      router.push("/quick-mood" as never);
      return;
    }
    if (data.kind === USER_REMINDER_NOTIFICATION_KIND) {
      // For v1 we route every user reminder back to Today. Deep-linking
      // into a specific Log-tab section for `linkedEventTypeId` requires
      // route params Plumbing the Log tab doesn't yet listen for — left
      // as a follow-up; tapping the notification at minimum opens the
      // app to the most relevant launch surface.
      router.push("/(tabs)" as never);
      return;
    }
  };

  // Notification tap handler: when any tagged notification is tapped from
  // foreground or background, route based on `data.kind`.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { kind?: string; linkedEventTypeId?: string }
          | undefined;
        handleNotificationKind(data);
      },
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Cold-start notification handler. If the app was launched by tapping a
  // notification, route accordingly — but only after auth is resolved and
  // the user is signed in, otherwise we race the auth gate's redirect to
  // /sign-in and end up with a half-mounted navigation tree that renders
  // blank. Once-per-cold-start guard via ref.
  const coldStartHandled = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (coldStartHandled.current) return;
    coldStartHandled.current = true;
    if (!session) return; // signed-out user — nothing to do

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as
        | { kind?: string; linkedEventTypeId?: string }
        | undefined;
      // Defer a tick so the Stack has mounted (tabs) before we push.
      setTimeout(() => {
        handleNotificationKind(data);
      }, 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, router]);

  // Splash placeholder while the persisted Supabase session is being
  // hydrated from AsyncStorage. Prevents a flash of /sign-in for users
  // who are already authenticated.
  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen
          name="quick-mood"
          options={{
            // fullScreenModal — not the iOS page-sheet modal — because the
            // page-sheet style has a hard-wired native drag-to-dismiss
            // gesture that ignores React Navigation's gestureEnabled flag.
            // fullScreenModal is a full-screen overlay with no native drag
            // behavior; only the in-app "Not now" / "Save" buttons dismiss.
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            gestureEnabled: false,
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
