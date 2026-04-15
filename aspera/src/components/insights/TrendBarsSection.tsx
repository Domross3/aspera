import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WeeklyTrend } from "../../types";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import TrendBar from "./TrendBar";

interface Props {
  trends: WeeklyTrend[];
}

type Metric = "focusRating" | "energyRating" | "tasksCompleted";

const METRICS: { key: Metric; label: string; color: string; max: number }[] = [
  { key: "focusRating", label: "Focus", color: COLORS.accent, max: 10 },
  { key: "energyRating", label: "Energy", color: COLORS.warning, max: 10 },
  { key: "tasksCompleted", label: "Tasks", color: COLORS.success, max: 20 },
];

export default function TrendBarsSection({ trends }: Props) {
  const [activeMetric, setActiveMetric] = useState<Metric>("focusRating");
  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const sorted = [...trends]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

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
        {sorted.map((t) => (
          <TrendBar
            key={t.date}
            label={t.dayLabel}
            value={t[activeMetric]}
            maxValue={metric.max}
            color={metric.color}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.textMuted,
    fontWeight: "600",
  } as object,
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: SPACING.sm,
  },
});
