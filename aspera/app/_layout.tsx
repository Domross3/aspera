import "react-native-url-polyfill/auto";
import { useEffect } from "react";
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
