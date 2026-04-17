import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const PUSH_TOKEN_KEY = "aspera_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void registerForPushNotificationsAsync();

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
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
      ?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (apiUrl) {
      await fetch(`${apiUrl}/api/push/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }
  } catch {
    // Silently ignore — simulator or permissions issue
  }
}
