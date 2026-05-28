import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GradientCard from "../common/GradientCard";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import {
  SCREEN_TIME_CATEGORY_COLORS,
  SCREEN_TIME_CATEGORY_LABELS,
} from "../../lib/screenTime/categories";
import {
  formatMinutesLabel,
  SCREEN_TIME_WARMUP_DAYS,
} from "../../lib/screenTime/storage";
import type { ScreenTimeCategory } from "../../lib/screenTime/constants";
import type { useScreenTime } from "../../hooks/useScreenTime";

interface Props {
  screenTime: ReturnType<typeof useScreenTime>;
}

const CATEGORY_ORDER: ScreenTimeCategory[] = [
  "social",
  "entertainment",
  "productivity",
  "communication",
  "other",
];

export default function ScreenTimeWarmupCard({ screenTime }: Props) {
  const latest = screenTime.latestDay;
  const daysCollected = screenTime.daysCollected;
  const progress = Math.min(1, daysCollected / SCREEN_TIME_WARMUP_DAYS);

  return (
    <GradientCard style={{ marginBottom: SPACING.md }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="phone-portrait-outline" size={18} color={COLORS.accent} />
          <Text style={styles.title}>Screen Time data</Text>
        </View>
        <Text style={styles.progressText}>
          {daysCollected}/{SCREEN_TIME_WARMUP_DAYS}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {latest ? (
        <View style={styles.summary}>
          <Text style={styles.total}>{formatMinutesLabel(latest.totalMinutes)}</Text>
          <Text style={styles.caption}>Latest synced day: {latest.date}</Text>
          <View style={styles.categoryList}>
            {CATEGORY_ORDER.map((category) => {
              const minutes = latest.byCategory[category] ?? 0;
              if (minutes <= 0) return null;
              return (
                <View key={category} style={styles.categoryRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: SCREEN_TIME_CATEGORY_COLORS[category] },
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {SCREEN_TIME_CATEGORY_LABELS[category]}
                  </Text>
                  <Text style={styles.categoryTime}>
                    {formatMinutesLabel(minutes)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.caption}>
          Native aggregates appear here after the report sync runs on device.
        </Text>
      )}

      {screenTime.totalsError ? (
        <Text style={styles.error}>{screenTime.totalsError}</Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => void screenTime.refreshTotals()}
        disabled={screenTime.loadingTotals}
        style={[styles.button, screenTime.loadingTotals && styles.disabled]}
      >
        {screenTime.loadingTotals ? (
          <ActivityIndicator color={COLORS.text} size="small" />
        ) : (
          <>
            <Ionicons name="sync-outline" size={16} color={COLORS.text} />
            <Text style={styles.buttonText}>Sync report</Text>
          </>
        )}
      </TouchableOpacity>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  track: {
    height: 6,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.accent,
  },
  summary: {
    gap: SPACING.xs,
  },
  total: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 34,
  } as object,
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    lineHeight: 18,
  } as object,
  categoryList: {
    marginTop: SPACING.xs,
    gap: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  } as object,
  categoryTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: SPACING.sm,
  } as object,
  button: {
    marginTop: SPACING.md,
    minHeight: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.xs,
  },
  disabled: {
    opacity: 0.65,
  },
  buttonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
});
