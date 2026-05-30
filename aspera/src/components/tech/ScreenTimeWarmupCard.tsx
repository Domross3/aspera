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
import { RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
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
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const latest = screenTime.latestDay;
  const daysCollected = screenTime.daysCollected;
  const progress = Math.min(1, daysCollected / SCREEN_TIME_WARMUP_DAYS);

  return (
    <GradientCard style={{ marginBottom: SPACING.md }}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="phone-portrait-outline"
            size={18}
            color={colors.accent}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Screen Time data
          </Text>
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {daysCollected}/{SCREEN_TIME_WARMUP_DAYS}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>

      {latest ? (
        <View style={styles.summary}>
          <Text style={[styles.total, { color: colors.text }]}>
            {formatMinutesLabel(latest.totalMinutes)}
          </Text>
          <Text style={[styles.caption, { color: colors.textMuted }]}>
            Latest synced day: {latest.date}
          </Text>
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
                  <Text
                    style={[
                      styles.categoryName,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {SCREEN_TIME_CATEGORY_LABELS[category]}
                  </Text>
                  <Text style={[styles.categoryTime, { color: colors.text }]}>
                    {formatMinutesLabel(minutes)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          Native aggregates appear here after the report sync runs on device.
        </Text>
      )}

      {screenTime.totalsError ? (
        <Text style={[styles.error, { color: colors.danger }]}>
          {screenTime.totalsError}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => void screenTime.refreshTotals()}
        disabled={screenTime.loadingTotals}
        style={[
          styles.button,
          { backgroundColor: colors.accent },
          screenTime.loadingTotals && styles.disabled,
        ]}
      >
        {screenTime.loadingTotals ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <>
            <Ionicons name="sync-outline" size={16} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Sync report
            </Text>
          </>
        )}
      </TouchableOpacity>
    </GradientCard>
  );
}

const makeStyles = (_c: AsperaColors) =>
  StyleSheet.create({
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
    } as object,
    progressText: {
      ...TYPOGRAPHY.caption,
    } as object,
    track: {
      height: 6,
      borderRadius: RADIUS.pill,
      overflow: "hidden",
      marginBottom: SPACING.md,
    },
    fill: {
      height: "100%",
    },
    summary: {
      gap: SPACING.xs,
    },
    total: {
      ...TYPOGRAPHY.hero,
      fontSize: 28,
      lineHeight: 34,
    } as object,
    caption: {
      ...TYPOGRAPHY.caption,
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
      flex: 1,
    } as object,
    categoryTime: {
      ...TYPOGRAPHY.caption,
      fontWeight: "600",
    } as object,
    error: {
      ...TYPOGRAPHY.caption,
      marginTop: SPACING.sm,
    } as object,
    button: {
      marginTop: SPACING.md,
      minHeight: 42,
      borderRadius: RADIUS.md,
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
      fontWeight: "700",
    } as object,
  });
