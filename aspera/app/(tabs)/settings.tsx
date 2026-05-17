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
  clearInsights,
  clearIntegrationData,
} from "../../src/storage/storage";
import {
  cancelAllQuickMoodNotifications,
  ensureQuickMoodSchedule,
} from "../../src/lib/quickMoodNotifications";
import { wipeUserData } from "../../src/lib/cloudStore";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import ContinuousSlider from "../../src/components/common/ContinuousSlider";
import TimePickerModal from "../../src/components/settings/TimePickerModal";
import type { NotificationSettings } from "../../src/types";

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
            await clearInsights();
            await clearIntegrationData();
            // Also wipe the cloud copy so a re-fetch doesn't repopulate.
            if (session) {
              try {
                await wipeUserData(session.user.id);
              } catch (err) {
                console.warn("[settings] cloud wipe failed", err);
              }
            }
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
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
            Your waking window. Quick mood pulses fire only between these
            times.
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
                update({
                  notificationSettings: {
                    ...settings.notificationSettings,
                    morningEnabled: v,
                  },
                })
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
                update({
                  notificationSettings: {
                    ...settings.notificationSettings,
                    eveningEnabled: v,
                  },
                })
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
              opacity: settings.notificationSettings.quickMoodEnabled
                ? 1
                : 0.5,
              marginBottom: SPACING.sm,
            }}
            pointerEvents={
              settings.notificationSettings.quickMoodEnabled
                ? "auto"
                : "none"
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
        </GradientCard>

        {/* Somatic Interceptor */}
        <SectionLabel label="Somatic Interceptor" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textSecondary, marginBottom: SPACING.md },
            ]}
          >
            After 5 minutes of inactivity on Today, a short breathe → name
            your feeling → reframe modal appears. Switch it off here if you
            don't want it interrupting you.
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
          timePickerKey
            ? settings.notificationSettings[timePickerKey]
            : "07:00"
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
