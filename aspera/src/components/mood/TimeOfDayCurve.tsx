import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MoodCheckIn } from "../../types";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  checkins: MoodCheckIn[];
}

interface HourBucket {
  hour: number;
  label: string;
  avgMood: number;
  avgEnergy: number;
  count: number;
}

const HOUR_LABELS: Record<number, string> = {
  6: "6a",
  7: "7a",
  8: "8a",
  9: "9a",
  10: "10a",
  11: "11a",
  12: "12p",
  13: "1p",
  14: "2p",
  15: "3p",
  16: "4p",
  17: "5p",
  18: "6p",
  19: "7p",
  20: "8p",
  21: "9p",
  22: "10p",
};

function bucketByHour(checkins: MoodCheckIn[]): HourBucket[] {
  const buckets: Record<number, { moods: number[]; energies: number[] }> = {};

  for (const c of checkins) {
    const hour = new Date(c.timestamp).getHours();
    // Group into 2-hour windows for smoother curve
    const bucket = Math.floor(hour / 2) * 2;
    if (bucket < 6 || bucket > 22) continue;
    if (!buckets[bucket]) buckets[bucket] = { moods: [], energies: [] };
    buckets[bucket].moods.push(c.mood);
    buckets[bucket].energies.push(c.energy);
  }

  return Object.entries(buckets)
    .map(([h, data]) => {
      const hour = parseInt(h);
      return {
        hour,
        label: HOUR_LABELS[hour] || `${hour}`,
        avgMood: data.moods.reduce((s, v) => s + v, 0) / data.moods.length,
        avgEnergy:
          data.energies.reduce((s, v) => s + v, 0) / data.energies.length,
        count: data.moods.length,
      };
    })
    .sort((a, b) => a.hour - b.hour);
}

export default function TimeOfDayCurve({ checkins }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const buckets = bucketByHour(checkins);

  if (buckets.length < 2) return null;

  const maxVal = 5;
  const chartHeight = 100;

  // Find peak and trough
  const peakBucket = buckets.reduce((best, b) =>
    b.avgMood > best.avgMood ? b : best,
  );
  const troughBucket = buckets.reduce((worst, b) =>
    b.avgMood < worst.avgMood ? b : worst,
  );

  return (
    <GradientCard style={{ marginTop: SPACING.sm }}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Time-of-Day Curve
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            When you feel best and worst
          </Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={[styles.chart, { height: chartHeight + 30 }]}>
        {/* Horizontal grid lines */}
        {[1, 2, 3, 4, 5].map((v) => (
          <View
            key={v}
            style={[
              styles.gridLine,
              { bottom: ((v - 1) / (maxVal - 1)) * chartHeight + 20 },
              { backgroundColor: colors.border },
            ]}
          />
        ))}

        {/* Mood bars + energy dots */}
        <View style={styles.barsRow}>
          {buckets.map((bucket) => {
            const moodPct = ((bucket.avgMood - 1) / (maxVal - 1)) * 100;
            const energyPct = ((bucket.avgEnergy - 1) / (maxVal - 1)) * 100;
            const isPeak = bucket.hour === peakBucket.hour;
            const isTrough = bucket.hour === troughBucket.hour;

            return (
              <View key={bucket.hour} style={styles.barCol}>
                <View style={styles.barArea}>
                  {/* Mood bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${moodPct}%`,
                        backgroundColor: isPeak
                          ? colors.success
                          : isTrough
                            ? colors.danger
                            : colors.accent,
                        opacity: isPeak || isTrough ? 1 : 0.6,
                      },
                    ]}
                  />
                  {/* Energy dot */}
                  <View
                    style={[
                      styles.energyDot,
                      {
                        bottom: `${energyPct}%`,
                        backgroundColor: colors.warning,
                        borderColor: colors.surface,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.hourLabel,
                    { color: colors.textMuted },
                    (isPeak || isTrough) && {
                      color: colors.text,
                      fontWeight: "700" as const,
                    },
                  ]}
                >
                  {bucket.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend + insights */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendSwatch, { backgroundColor: colors.accent }]}
          />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            Mood
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.warning }]}
          />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            Energy
          </Text>
        </View>
      </View>

      <View style={styles.insightRow}>
        <View
          style={[
            styles.insightChip,
            { borderColor: `${colors.success}44`, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <Text style={[styles.insightText, { color: colors.success }]}>
            Peak: {peakBucket.label} ({peakBucket.avgMood.toFixed(1)}/5)
          </Text>
        </View>
        <View
          style={[
            styles.insightChip,
            { borderColor: `${colors.danger}44`, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <Text style={[styles.insightText, { color: colors.danger }]}>
            Low: {troughBucket.label} ({troughBucket.avgMood.toFixed(1)}/5)
          </Text>
        </View>
      </View>
    </GradientCard>
  );
}

const makeStyles = (_c: AsperaColors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING.md,
    },
    title: {
      ...TYPOGRAPHY.subtitle,
    } as object,
    subtitle: {
      ...TYPOGRAPHY.caption,
      marginTop: 2,
    } as object,
    chart: {
      position: "relative",
      marginBottom: SPACING.sm,
    },
    gridLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
    },
    barsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: "100%",
      paddingBottom: 20,
      gap: 2,
    },
    barCol: {
      flex: 1,
      alignItems: "center",
    },
    barArea: {
      width: "70%",
      height: 100,
      justifyContent: "flex-end",
      alignItems: "center",
      position: "relative",
    },
    bar: {
      width: "100%",
      borderRadius: RADIUS.sm,
      minHeight: 4,
    },
    energyDot: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
    },
    hourLabel: {
      ...TYPOGRAPHY.caption,
      fontSize: 9,
      marginTop: SPACING.xs,
    } as object,
    legendRow: {
      flexDirection: "row",
      gap: SPACING.md,
      marginBottom: SPACING.sm,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendSwatch: {
      width: 12,
      height: 6,
      borderRadius: 2,
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    legendText: {
      ...TYPOGRAPHY.caption,
      fontSize: 10,
    } as object,
    insightRow: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    insightChip: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    insightText: {
      ...TYPOGRAPHY.caption,
      fontWeight: "600",
      fontSize: 11,
    } as object,
  });
