import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WeeklyTrend } from "../../types";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import TrendBar from "./TrendBar";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  trends: WeeklyTrend[];
}

type Metric = "focusRating" | "energyRating" | "tasksCompleted";

// Pad trends to a fixed 7-day rolling window ending today. Days without
// a trend entry render with `value: null` so TrendBar shows an em-dash
// and a zero-height bar — keeps the x-axis legible when the user has
// sparse history (e.g. just started logging).
function padToWeek(
  trends: WeeklyTrend[],
  metricKey: Metric,
): { label: string; value: number | null; key: string }[] {
  const byDate = new Map(trends.map((t) => [t.date, t]));
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);

  const result: { label: string; value: number | null; key: string }[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    const label = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 2);
    const t = byDate.get(dateStr);
    result.push({
      label,
      value: t ? t[metricKey] : null,
      key: dateStr,
    });
  }
  return result;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    selector: {
      flexDirection: "row",
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    tab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabText: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontWeight: "600",
    } as object,
    barsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 4,
      marginTop: SPACING.sm,
    },
  });

export default function TrendBarsSection({ trends }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [activeMetric, setActiveMetric] = useState<Metric>("focusRating");

  const METRICS: { key: Metric; label: string; color: string; max: number }[] =
    [
      { key: "focusRating", label: "Focus", color: colors.accent, max: 5 },
      { key: "energyRating", label: "Energy", color: colors.warning, max: 5 },
      {
        key: "tasksCompleted",
        label: "Tasks",
        color: colors.success,
        max: 20,
      },
    ];

  const metric = METRICS.find((m) => m.key === activeMetric)!;
  const padded = padToWeek(trends, activeMetric);

  return (
    <View>
      {/* Metric selector */}
      <View style={styles.selector}>
        {METRICS.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.tab,
              activeMetric === m.key && {
                borderBottomColor: m.color,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveMetric(m.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeMetric === m.key && { color: m.color },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bars */}
      <View style={styles.barsRow}>
        {padded.map((t) => (
          <TrendBar
            key={t.key}
            label={t.label}
            value={t.value}
            maxValue={metric.max}
            color={metric.color}
          />
        ))}
      </View>
    </View>
  );
}
