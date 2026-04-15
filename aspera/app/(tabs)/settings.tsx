import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useSettings } from "../../src/hooks/useSettings";
import { useIntegrations } from "../../src/hooks/useIntegrations";
import {
  clearAllLogs,
  clearInsights,
  clearIntegrationData,
} from "../../src/storage/storage";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";

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
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  React.useEffect(() => {
    if (!loading) setApiKeyInput(settings.claudeApiKey);
  }, [loading, settings.claudeApiKey]);

  const handleSaveKey = async () => {
    await update({ claudeApiKey: apiKeyInput.trim() });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRefreshIntegrations = async () => {
    await refreshFromMocks();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all logs, cached insights, and integration cache. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllLogs();
            await clearInsights();
            await clearIntegrationData();
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

        {/* API Key */}
        <SectionLabel label="Claude API Key" />
        <GradientCard style={{ marginBottom: SPACING.lg }}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textSecondary, marginBottom: SPACING.sm },
            ]}
          >
            Required to generate AI insights. Your key is stored locally only.
          </Text>
          <TextInput
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-ant-..."
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, TYPOGRAPHY.body as object]}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSaveKey}
          />
          <TouchableOpacity
            style={[styles.button, saved && styles.buttonSuccess]}
            onPress={handleSaveKey}
            activeOpacity={0.8}
          >
            <Text
              style={[TYPOGRAPHY.subtitle as object, { color: COLORS.text }]}
            >
              {saved ? "✓ Saved" : "Save Key"}
            </Text>
          </TouchableOpacity>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
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
