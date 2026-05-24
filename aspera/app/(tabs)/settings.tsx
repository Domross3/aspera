import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useSettings } from "../../src/hooks/useSettings";
import { useIntegrations } from "../../src/hooks/useIntegrations";
import { useAuth } from "../../src/hooks/useAuth";
import {
  clearAllLogs,
  clearAllMoodCheckIns,
  clearAllMoments,
  clearInsights,
  clearIntegrationData,
} from "../../src/storage/storage";
import {
  cancelAllQuickMoodNotifications,
  ensureQuickMoodSchedule,
} from "../../src/lib/quickMoodNotifications";
import { wipeUserData } from "../../src/lib/cloudStore";
import { dailyLoadOfReminder } from "../../src/lib/userReminderNotifications";
import {
  ensureDailyLogSchedule,
  cancelAllDailyLogNotifications,
} from "../../src/lib/dailyLogNotifications";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import ContinuousSlider from "../../src/components/common/ContinuousSlider";
import TimePickerModal from "../../src/components/settings/TimePickerModal";
import ReminderEditor from "../../src/components/settings/ReminderEditor";
import type { NotificationSettings, UserReminder } from "../../src/types";

// iOS caps scheduled notifications at ~64 per app. We schedule 7 days
// ahead, so the safe per-day budget is ~9. Warn at 7 / day; hard-cap
// new reminders that would push past 9 / day.
const DAILY_CAP_HARD = 9;
const DAILY_CAP_WARN = 7;

// Which row's picker is open. Maps directly to the field name on
// NotificationSettings so handlers can index by key without a switch.
type TimeKey = "wakeTime" | "sleepTime" | "morningTime" | "eveningTime";

const TIME_KEY_TITLES: Record<TimeKey, string> = {
  wakeTime: "Wake time",
  sleepTime: "Sleep time",
  morningTime: "Morning check-in",
  eveningTime: "Evening reflection",
};

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function statusColors(status: string): { bg: string; fg: string } {
  switch (status) {
    case "connected":
      return { bg: "rgba(46, 204, 113, 0.14)", fg: COLORS.success };
    case "mock":
      return { bg: "rgba(108, 99, 255, 0.18)", fg: COLORS.accent };
    case "planned":
      return { bg: "rgba(255, 184, 77, 0.14)", fg: COLORS.warning };
    default:
      return { bg: "rgba(255,255,255,0.08)", fg: COLORS.textMuted };
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, loading, update } = useSettings();
  const {
    connections,
    latestAttention,
    latestSummary,
    loading: integrationsLoading,
    refreshFromMocks,
  } = useIntegrations();
  const [refreshed, setRefreshed] = useState(false);
  const [timePickerKey, setTimePickerKey] = useState<TimeKey | null>(null);

  // Reminder editor target. `null` = closed; `"__new__"` = creating;
  // any other string = editing the reminder with that id.
  const [reminderEditorTarget, setReminderEditorTarget] = useState<
    string | null
  >(null);

  // Claude API key UI removed — the mobile app no longer holds the key.
  // All Claude calls go through the aspera-web `/api/mobile/claude` proxy.

  const handleRefreshIntegrations = async () => {
    await refreshFromMocks();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  };

  const handleToggleQuickMood = async (enabled: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSettings = {
      ...settings.notificationSettings,
      quickMoodEnabled: enabled,
    };

    if (enabled) {
      // Request OS permission if needed before scheduling
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const result = await Notifications.requestPermissionsAsync();
        if (result.status !== "granted") {
          Alert.alert(
            "Notifications disabled",
            "Enable notifications for Aspera in iOS Settings to receive quick mood check-ins.",
          );
          return;
        }
      }
      await update({ notificationSettings: nextSettings });
      await ensureQuickMoodSchedule(nextSettings);
    } else {
      await update({ notificationSettings: nextSettings });
      await cancelAllQuickMoodNotifications();
    }
  };

  const handleFrequencyChange = async (raw: number) => {
    const next = Math.round(raw);
    const current = settings.notificationSettings.quickMoodFrequency;
    if (next === current) return;
    const nextSettings: NotificationSettings = {
      ...settings.notificationSettings,
      quickMoodFrequency: next,
    };
    await update({ notificationSettings: nextSettings });
    if (nextSettings.quickMoodEnabled) {
      await cancelAllQuickMoodNotifications();
      await ensureQuickMoodSchedule(nextSettings);
    }
  };

  // ── Reminder helpers ──────────────────────────────────────────────────

  const userReminders = settings.userReminders ?? [];
  const eventTypes = settings.eventTypes ?? [];

  // Approximate per-day notification load: morning + evening + quick
  // mood pulses + every enabled reminder's per-day contribution.
  const baseDailyLoad =
    (settings.notificationSettings.morningEnabled ? 1 : 0) +
    (settings.notificationSettings.eveningEnabled ? 1 : 0) +
    (settings.notificationSettings.quickMoodEnabled
      ? settings.notificationSettings.quickMoodFrequency
      : 0);
  const reminderDailyLoad = userReminders.reduce(
    (acc, r) => acc + dailyLoadOfReminder(r),
    0,
  );
  const totalDailyLoad = baseDailyLoad + reminderDailyLoad;

  const loadColor =
    totalDailyLoad >= DAILY_CAP_HARD
      ? COLORS.danger
      : totalDailyLoad >= DAILY_CAP_WARN
        ? COLORS.warning
        : COLORS.success;

  const editingReminder =
    reminderEditorTarget && reminderEditorTarget !== "__new__"
      ? (userReminders.find((r) => r.id === reminderEditorTarget) ?? null)
      : null;

  // Daily load contribution of *the reminder we're currently editing* (if
  // any), so the "would this push over the cap" check only counts the
  // delta when the user is editing rather than creating.
  const draftBaselineLoad = editingReminder
    ? dailyLoadOfReminder(editingReminder)
    : 0;

  const handleReminderSave = async (next: UserReminder) => {
    const nextLoad =
      totalDailyLoad - draftBaselineLoad + dailyLoadOfReminder(next);
    if (nextLoad > DAILY_CAP_HARD) {
      Alert.alert(
        "Notification limit reached",
        "iOS only lets each app schedule a limited number of notifications. Disable or delete a reminder first, then come back.",
      );
      return;
    }
    const existing = userReminders.some((r) => r.id === next.id);
    const nextList = existing
      ? userReminders.map((r) => (r.id === next.id ? next : r))
      : [...userReminders, next];
    await update({ userReminders: nextList });
    setReminderEditorTarget(null);
  };

  const handleReminderDelete = async () => {
    if (!editingReminder) return;
    await update({
      userReminders: userReminders.filter((r) => r.id !== editingReminder.id),
    });
    setReminderEditorTarget(null);
  };

  const handleReminderToggle = async (id: string, enabled: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await update({
      userReminders: userReminders.map((r) =>
        r.id === id ? { ...r, enabled } : r,
      ),
    });
  };

  const handleTimeChange = async (key: TimeKey, hhmm: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSettings: NotificationSettings = {
      ...settings.notificationSettings,
      [key]: hhmm,
    };
    await update({ notificationSettings: nextSettings });
    // Changing wake/sleep changes the window quick-mood pulses fire in —
    // re-roll the schedule so the new bounds take effect immediately.
    if (
      (key === "wakeTime" || key === "sleepTime") &&
      nextSettings.quickMoodEnabled
    ) {
      await cancelAllQuickMoodNotifications();
      await ensureQuickMoodSchedule(nextSettings);
    }
    // Morning/evening times reschedule the daily-log notifications.
    if (key === "morningTime" || key === "eveningTime") {
      await ensureDailyLogSchedule(nextSettings);
    }
  };

  // Toggling morning/evening enables/cancels the daily-log notification
  // for that kind. Re-uses the existing `update` flow for the Switch's
  // onValueChange handler; the Switches inline-spread their own patch
  // (legacy pattern) so we wrap with this helper to keep the scheduler
  // call alongside the settings write.
  const handleToggleDailyLog = async (
    key: "morningEnabled" | "eveningEnabled",
    enabled: boolean,
  ) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSettings: NotificationSettings = {
      ...settings.notificationSettings,
      [key]: enabled,
    };
    if (enabled) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const result = await Notifications.requestPermissionsAsync();
        if (result.status !== "granted") {
          Alert.alert(
            "Notifications disabled",
            "Enable notifications for Aspera in iOS Settings to schedule daily check-ins.",
          );
          return;
        }
      }
    }
    await update({ notificationSettings: nextSettings });
    await ensureDailyLogSchedule(nextSettings);
  };

  const handleSendTestMoodNotification = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const result = await Notifications.requestPermissionsAsync();
      if (result.status !== "granted") {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications for Aspera in iOS Settings to send a test.",
        );
        return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pulse check",
        body: "How are you right now? (test notification)",
        data: { kind: "quick_mood_check" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  };

  // Diagnostic: show the current state of scheduled notifications + permission,
  // then force a fresh pulse + daily-log schedule. The `>= RESCHEDULE_THRESHOLD`
  // short-circuit in ensureQuickMoodSchedule can leave the queue stale if iOS
  // is silently truncating or if the queued dates have already drifted past.
  // This bypasses that check by canceling first and rebuilding from scratch.
  const handleForcePulseReschedule = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await Notifications.getPermissionsAsync();
    const before = await Notifications.getAllScheduledNotificationsAsync();
    const quickMoodBefore = before.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "quick_mood_check",
    ).length;
    const remindersBefore = before.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "user_reminder",
    ).length;
    const morningBefore = before.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "morning_log",
    ).length;
    const eveningBefore = before.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "evening_log",
    ).length;

    await cancelAllQuickMoodNotifications();
    await ensureQuickMoodSchedule(settings.notificationSettings);
    await cancelAllDailyLogNotifications();
    await ensureDailyLogSchedule(settings.notificationSettings);

    const after = await Notifications.getAllScheduledNotificationsAsync();
    const quickMoodAfter = after.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "quick_mood_check",
    ).length;
    const morningAfter = after.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "morning_log",
    ).length;
    const eveningAfter = after.filter(
      (n) => (n.content.data as { kind?: string })?.kind === "evening_log",
    ).length;

    Alert.alert(
      "Schedules rebuilt",
      [
        `iOS permission: ${status}`,
        `Pulses enabled: ${settings.notificationSettings.quickMoodEnabled ? "yes" : "no"}`,
        `Window: ${settings.notificationSettings.wakeTime}–${settings.notificationSettings.sleepTime}`,
        `Frequency: ${settings.notificationSettings.quickMoodFrequency}× / day`,
        `Morning: ${settings.notificationSettings.morningEnabled ? settings.notificationSettings.morningTime : "off"}`,
        `Evening: ${settings.notificationSettings.eveningEnabled ? settings.notificationSettings.eveningTime : "off"}`,
        "",
        `Before: ${quickMoodBefore} pulses · ${morningBefore} AM · ${eveningBefore} PM · ${remindersBefore} reminders`,
        `After: ${quickMoodAfter} pulses · ${morningAfter} AM · ${eveningAfter} PM`,
      ].join("\n"),
    );
  };

  const { session, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll need to sign in again to access your data. Local cached data stays until you Clear All Data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all logs and mood check-ins from your account (on this device AND on Aspera's servers), plus reset cached insights. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllLogs();
            await clearAllMoodCheckIns();
            await clearAllMoments();
            await clearInsights();
            await clearIntegrationData();
            // Also wipe the cloud copy so a re-fetch doesn't repopulate.
            let cloudWipeFailed = false;
            if (session) {
              try {
                await wipeUserData(session.user.id);
              } catch (err) {
                console.warn("[settings] cloud wipe failed", err);
                cloudWipeFailed = true;
              }
            }
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
            // Surface a partial-wipe so the user knows the cloud copy may
            // re-sync on next launch, rather than silently leaving it.
            if (cloudWipeFailed) {
              Alert.alert(
                "Local data cleared",
                "Your on-device data is gone, but the cloud copy couldn't be reached. It will be retried — if it re-syncs, open Clear All Data again once you're back online.",
              );
            }
          },
        },
      ],
    );
  };

  if (loading || integrationsLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            TYPOGRAPHY.hero,
            { color: COLORS.text, marginBottom: SPACING.xs },
          ]}
        >
          Settings
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: COLORS.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Configure your AI-powered optimizer
        </Text>

        {/* Integrations */}
        <SectionLabel label="Integrations" />
        {latestAttention && (
          <GradientCard style={{ marginBottom: SPACING.md }}>
            <View style={styles.integrationHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.integrationTitle}>Attention Layer</Text>
                <Text style={styles.integrationBody}>
                  Latest normalized context for Insights and future holistic
                  time-spent analysis.
                </Text>
              </View>
              <View style={styles.attentionScore}>
                <Text style={styles.attentionScoreLabel}>FOCUS</Text>
                <Text style={styles.attentionScoreValue}>
                  {latestAttention.focusScore}
                </Text>
              </View>
            </View>

            <View style={styles.integrationMetricsRow}>
              <View style={styles.integrationMetric}>
                <Text style={styles.integrationMetricValue}>
                  {formatMinutes(latestAttention.productiveMinutes)}
                </Text>
                <Text style={styles.integrationMetricLabel}>Productive</Text>
              </View>
              <View style={styles.integrationMetric}>
                <Text style={styles.integrationMetricValue}>
                  {formatMinutes(latestAttention.neutralMinutes)}
                </Text>
                <Text style={styles.integrationMetricLabel}>Neutral</Text>
              </View>
              <View style={styles.integrationMetric}>
                <Text
                  style={[
                    styles.integrationMetricValue,
                    { color: COLORS.danger },
                  ]}
                >
                  {formatMinutes(latestAttention.distractingMinutes)}
                </Text>
                <Text style={styles.integrationMetricLabel}>Distracting</Text>
              </View>
            </View>

            <Text style={styles.integrationFootnote}>
              {latestSummary?.date
                ? `Normalized from ${latestSummary.date} connector data.`
                : "Using latest connector snapshot."}
            </Text>
          </GradientCard>
        )}

        {connections.map((connection) => {
          const colors = statusColors(connection.status);
          return (
            <GradientCard
              key={connection.id}
              style={{ marginBottom: SPACING.sm }}
            >
              <View style={styles.integrationHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.integrationTitle}>{connection.name}</Text>
                  <Text style={styles.integrationBody}>
                    {connection.description}
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: colors.bg }]}
                >
                  <Text style={[styles.statusText, { color: colors.fg }]}>
                    {connection.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {connection.highlights?.slice(0, 2).map((highlight) => (
                <Text key={highlight} style={styles.integrationHighlight}>
                  • {highlight}
                </Text>
              ))}

              {connection.nextStep ? (
                <Text style={styles.integrationNextStep}>
                  Next: {connection.nextStep}
                </Text>
              ) : null}
            </GradientCard>
          );
        })}

        <TouchableOpacity
          style={[
            styles.button,
            refreshed && styles.buttonSuccess,
            { marginBottom: SPACING.xl },
          ]}
          onPress={handleRefreshIntegrations}
          activeOpacity={0.8}
        >
          <Text style={[TYPOGRAPHY.subtitle as object, { color: COLORS.text }]}>
            {refreshed
              ? "✓ Integration Sync Refreshed"
              : "Refresh Mock Integration Sync"}
          </Text>
        </TouchableOpacity>

        {/* Notifications — merged section covering wake/sleep window, daily
            check-in pings, and random quick-mood pulses. One concept (the
            user's day shape) drives all three cards. */}
        <SectionLabel label="Notifications" />

        {/* Waking window — these times also bound quick-mood pulses. */}
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textSecondary, marginBottom: SPACING.md },
            ]}
          >
            Your waking window. Quick mood pulses fire only between these times.
          </Text>
          <TouchableOpacity
            onPress={() => setTimePickerKey("wakeTime")}
            activeOpacity={0.7}
            style={[styles.row, { marginBottom: SPACING.md }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Wake time
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                When your day starts
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>
              {settings.notificationSettings.wakeTime}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimePickerKey("sleepTime")}
            activeOpacity={0.7}
            style={styles.row}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Sleep time
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                When you wind down
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>
              {settings.notificationSettings.sleepTime}
            </Text>
          </TouchableOpacity>
        </GradientCard>

        {/* Daily check-in reminders — independent toggles with editable times. */}
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <View style={[styles.row, { marginBottom: SPACING.sm }]}>
            <TouchableOpacity
              onPress={() => setTimePickerKey("morningTime")}
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Morning check-in
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                {settings.notificationSettings.morningTime} · How are you
                feeling?
              </Text>
            </TouchableOpacity>
            <Switch
              value={settings.notificationSettings.morningEnabled}
              onValueChange={(v) =>
                void handleToggleDailyLog("morningEnabled", v)
              }
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
          {settings.notificationSettings.morningTime <
          settings.notificationSettings.wakeTime ? (
            <Text style={styles.validationHint}>
              Earlier than your wake time
            </Text>
          ) : null}

          <View style={[styles.row, { marginTop: SPACING.md }]}>
            <TouchableOpacity
              onPress={() => setTimePickerKey("eveningTime")}
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Evening reflection
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                {settings.notificationSettings.eveningTime} · Log today before
                you forget
              </Text>
            </TouchableOpacity>
            <Switch
              value={settings.notificationSettings.eveningEnabled}
              onValueChange={(v) =>
                void handleToggleDailyLog("eveningEnabled", v)
              }
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
          {settings.notificationSettings.eveningTime >
          settings.notificationSettings.sleepTime ? (
            <Text style={styles.validationHint}>
              Later than your sleep time
            </Text>
          ) : null}
        </GradientCard>

        {/* Quick mood pulses — random scheduling within the waking window. */}
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textSecondary, marginBottom: SPACING.md },
            ]}
          >
            Random notifications throughout your waking window for a 10-second
            mood + energy capture. Scheduled locally on your device.
          </Text>
          <View style={[styles.row, { marginBottom: SPACING.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Quick mood pulses
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                {settings.notificationSettings.wakeTime} –{" "}
                {settings.notificationSettings.sleepTime}
              </Text>
            </View>
            <Switch
              value={settings.notificationSettings.quickMoodEnabled}
              onValueChange={handleToggleQuickMood}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
          <View
            style={{
              opacity: settings.notificationSettings.quickMoodEnabled ? 1 : 0.5,
              marginBottom: SPACING.sm,
            }}
            pointerEvents={
              settings.notificationSettings.quickMoodEnabled ? "auto" : "none"
            }
          >
            <ContinuousSlider
              label="Frequency"
              value={settings.notificationSettings.quickMoodFrequency}
              min={1}
              max={8}
              step={1}
              onChange={handleFrequencyChange}
              formatValue={(v) => `${Math.round(v)}× / day`}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendTestMoodNotification}
            activeOpacity={0.7}
            style={[styles.row, { marginTop: SPACING.md }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Send test notification
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                Fires in 2 seconds — for verifying the modal works
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleForcePulseReschedule}
            activeOpacity={0.7}
            style={[styles.row, { marginTop: SPACING.sm }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Rebuild pulse schedule
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                Cancels + reschedules the next 7 days. Shows the diagnostic
                state for permission, window, and pending count.
              </Text>
            </View>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>↻</Text>
          </TouchableOpacity>
        </GradientCard>

        {/* Reminders — user-defined habit notifications */}
        <SectionLabel label="Reminders" />
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Daily notification load
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                iOS limits scheduled notifications per app — staying under
                ~9/day keeps everything firing reliably.
              </Text>
            </View>
            <Text
              style={[
                TYPOGRAPHY.subtitle,
                { color: loadColor, fontWeight: "700" },
              ]}
            >
              {totalDailyLoad.toFixed(0)} / {DAILY_CAP_HARD}
            </Text>
          </View>
        </GradientCard>

        {userReminders.length > 0 ? (
          <GradientCard style={{ marginBottom: SPACING.md }}>
            {userReminders.map((reminder, idx) => {
              const linkedType = reminder.linkedEventTypeId
                ? eventTypes.find((t) => t.id === reminder.linkedEventTypeId)
                : undefined;
              return (
                <View key={reminder.id}>
                  <TouchableOpacity
                    onPress={() => setReminderEditorTarget(reminder.id)}
                    activeOpacity={0.7}
                    style={styles.row}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                        {linkedType?.emoji ? `${linkedType.emoji} ` : ""}
                        {reminder.label}
                      </Text>
                      <Text
                        style={[
                          TYPOGRAPHY.caption,
                          { color: COLORS.textMuted },
                        ]}
                      >
                        {reminder.schedule.kind === "fixed"
                          ? reminder.schedule.times.join(", ")
                          : `${reminder.schedule.count}× / day in ${reminder.schedule.windowStart}–${reminder.schedule.windowEnd}`}
                        {reminder.weekdays.length < 7
                          ? ` · ${reminder.weekdays.length} day${
                              reminder.weekdays.length === 1 ? "" : "s"
                            }/wk`
                          : ""}
                      </Text>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(v) =>
                        void handleReminderToggle(reminder.id, v)
                      }
                      trackColor={{
                        false: COLORS.border,
                        true: COLORS.accent,
                      }}
                      thumbColor={COLORS.text}
                    />
                  </TouchableOpacity>
                  {idx < userReminders.length - 1 ? (
                    <View
                      style={{
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: COLORS.border,
                        marginVertical: SPACING.sm,
                      }}
                    />
                  ) : null}
                </View>
              );
            })}
          </GradientCard>
        ) : null}

        <TouchableOpacity
          onPress={() => {
            if (totalDailyLoad >= DAILY_CAP_HARD) {
              Alert.alert(
                "Notification limit reached",
                "Disable or delete an existing reminder before adding a new one.",
              );
              return;
            }
            setReminderEditorTarget("__new__");
          }}
          activeOpacity={0.7}
          style={[
            styles.addReminderRow,
            totalDailyLoad >= DAILY_CAP_HARD && styles.addReminderDisabled,
          ]}
        >
          <Text style={styles.addReminderText}>+ New reminder</Text>
        </TouchableOpacity>

        {/* Somatic Interceptor */}
        <SectionLabel label="Somatic Interceptor" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textSecondary, marginBottom: SPACING.md },
            ]}
          >
            After 5 minutes of inactivity on Today, a short breathe → name your
            feeling → reframe modal appears. Switch it off here if you don't
            want it interrupting you.
          </Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                Enable
              </Text>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
                5-minute idle trigger on the Today tab
              </Text>
            </View>
            <Switch
              value={settings.notificationSettings.somaticInterceptorEnabled}
              onValueChange={(v) => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                void update({
                  notificationSettings: {
                    ...settings.notificationSettings,
                    somaticInterceptorEnabled: v,
                  },
                });
              }}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={COLORS.text}
            />
          </View>
        </GradientCard>

        {/* About */}
        <SectionLabel label="About" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <View style={styles.row}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
              App
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
              Aspera
            </Text>
          </View>
          <View style={[styles.row, { marginTop: SPACING.sm }]}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
              Version
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.row, { marginTop: SPACING.sm }]}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
              AI Model
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.accent }]}>
              claude-sonnet-4-6
            </Text>
          </View>
        </GradientCard>

        {/* Account */}
        {session && (
          <>
            <SectionLabel label="Account" />
            <GradientCard style={{ marginBottom: SPACING.lg }}>
              <View style={[styles.row, { marginBottom: SPACING.sm }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                    Signed in
                  </Text>
                  <Text
                    style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}
                  >
                    {session.user.email ?? "Apple ID"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.danger }]}>
                  Sign out
                </Text>
              </TouchableOpacity>
            </GradientCard>
          </>
        )}

        {/* Danger Zone */}
        <SectionLabel label="Data" />
        <TouchableOpacity onPress={handleClearData} activeOpacity={0.8}>
          <GradientCard colors={["#2A1515", "#1A0E0E"]}>
            <Text
              style={[TYPOGRAPHY.subtitle as object, { color: COLORS.danger }]}
            >
              Clear All Data
            </Text>
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: COLORS.textMuted, marginTop: SPACING.xs },
              ]}
            >
              Permanently delete all logs and insights
            </Text>
          </GradientCard>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={timePickerKey !== null}
        initial={
          timePickerKey ? settings.notificationSettings[timePickerKey] : "07:00"
        }
        title={timePickerKey ? TIME_KEY_TITLES[timePickerKey] : "Pick a time"}
        onCancel={() => setTimePickerKey(null)}
        onConfirm={(hhmm) => {
          if (timePickerKey) {
            void handleTimeChange(timePickerKey, hhmm);
          }
          setTimePickerKey(null);
        }}
      />

      <ReminderEditor
        visible={reminderEditorTarget !== null}
        initial={editingReminder}
        eventTypes={eventTypes}
        onCancel={() => setReminderEditorTarget(null)}
        onSave={(next) => void handleReminderSave(next)}
        onDelete={
          reminderEditorTarget && reminderEditorTarget !== "__new__"
            ? () => void handleReminderDelete()
            : undefined
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  validationHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    marginTop: SPACING.xs,
    fontSize: 11,
  } as object,
  addReminderRow: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  addReminderDisabled: {
    opacity: 0.5,
  },
  addReminderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: "center",
  },
  buttonSuccess: {
    backgroundColor: COLORS.success,
  },
  integrationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  integrationTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    marginBottom: 2,
  } as object,
  integrationBody: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 17,
  } as object,
  attentionScore: {
    minWidth: 60,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  attentionScoreLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 8,
  } as object,
  attentionScoreValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.accent,
    fontWeight: "800",
  } as object,
  integrationMetricsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  integrationMetric: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  integrationMetricValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  integrationMetricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  } as object,
  integrationFootnote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  } as object,
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
  } as object,
  integrationHighlight: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 17,
  } as object,
  integrationNextStep: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    marginTop: SPACING.sm,
    lineHeight: 17,
  } as object,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
