import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { registerQuickMoodCategories } from "../lib/quickMoodActions";

const PUSH_TOKEN_KEY = "aspera_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert deprecated in expo-notifications 0.32+; replaced by
    // shouldShowBanner + shouldShowList. Keeping shouldShowAlert true for
    // back-compat during transition.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void registerForPushNotificationsAsync();
    // Register the mood/energy action categories so long-pressing a pulse shows
    // the lock-screen buttons. Idempotent.
    void registerQuickMoodCategories();

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        // foreground notification received — no-op for now
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        // notification tapped — no-op for now
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C63FF",
    });
  }

  // Skip if already registered this session
  const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (cached) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const projectId =
    (
      Constants.expoConfig?.extra as
        | { eas?: { projectId?: string } }
        | undefined
    )?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      // No backend configured (dev) — cache so we don't re-ask every launch.
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      return;
    }

    // Server expects `expo_token` (not `token`). Only cache AFTER the server
    // confirms it stored the token — otherwise a failed POST would still be
    // cached and the `if (cached) return` guard above would never retry.
    const res = await fetch(`${apiUrl}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expo_token: token }),
    });
    if (res.ok) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }
  } catch {
    // Silently ignore — simulator / network blip. Nothing cached, so the
    // next launch retries.
  }
}
