import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { SCREEN_TIME_DATA } from "../../lib/mockData";

function minsToLabel(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ScreenTimeCard() {
  const today = SCREEN_TIME_DATA[0];
  if (!today) return null;

  const totalMs = today.totalMinutes;
  const topApps = today.topApps.slice(0, 5);

  // Determine if screen time is high
  const isHigh = totalMs > 360; // >6h is high
  const summaryColor =
    totalMs <= 240
      ? COLORS.success
      : totalMs <= 360
        ? COLORS.warning
        : COLORS.danger;

  return (
    <View>
      <SectionLabel label="Screen Time" />
      <GradientCard>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📱</Text>
          <Text style={styles.headerText}>iOS Screen Time</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MOCK</Text>
          </View>
        </View>

        {/* Total + Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.totalCircle}>
            <Text style={[styles.totalValue, { color: summaryColor }]}>
              {minsToLabel(totalMs)}
            </Text>
            <Text style={styles.totalLabel}>TODAY</Text>
          </View>
          <View style={styles.statsCol}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{today.pickups}</Text>
              <Text style={styles.statLabel}>Pickups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{today.firstPickup}</Text>
              <Text style={styles.statLabel}>First pickup</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {minsToLabel(today.longestSession)}
              </Text>
              <Text style={styles.statLabel}>Longest session</Text>
            </View>
          </View>
        </View>

        {/* Category bar */}
        <View style={styles.barTrack}>
          {today.byCategory.map((cat, i) => (
            <View
              key={cat.category}
              style={[
                styles.barFill,
                {
                  flex: cat.minutes,
                  backgroundColor: cat.color,
                  borderTopLeftRadius: i === 0 ? 4 : 0,
                  borderBottomLeftRadius: i === 0 ? 4 : 0,
                  borderTopRightRadius:
                    i === today.byCategory.length - 1 ? 4 : 0,
                  borderBottomRightRadius:
                    i === today.byCategory.length - 1 ? 4 : 0,
                },
              ]}
            />
          ))}
        </View>

        {/* Category breakdown */}
        <View style={styles.categoryList}>
          {today.byCategory.map((cat) => (
            <View key={cat.category} style={styles.categoryRow}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.category}</Text>
              <Text style={[styles.categoryTime, { color: cat.color }]}>
                {minsToLabel(cat.minutes)}
              </Text>
              <Text style={styles.categoryPct}>
                {Math.round((cat.minutes / totalMs) * 100)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Top Apps */}
        <Text
          style={[
            TYPOGRAPHY.caption,
            {
              color: COLORS.textMuted,
              marginTop: SPACING.md,
              marginBottom: SPACING.xs,
            },
          ]}
        >
          TOP APPS
        </Text>
        {topApps.map((app, i) => (
          <View key={app.name} style={styles.appRow}>
            <Text style={styles.appIcon}>{app.icon}</Text>
            <Text style={styles.appName} numberOfLines={1}>
              {app.name}
            </Text>
            <Text style={styles.appTime}>{minsToLabel(app.minutes)}</Text>
          </View>
        ))}
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  headerIcon: { fontSize: 14 },
  headerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  } as object,
  badge: {
    backgroundColor: "rgba(108,99,255,0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 9,
  } as object,
  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  totalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 15,
    lineHeight: 20,
  } as object,
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 8,
  } as object,
  statsCol: {
    flex: 1,
    gap: SPACING.xs,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  } as object,
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  // Bar
  barTrack: {
    flexDirection: "row",
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  barFill: { height: "100%" },
  // Categories
  categoryList: {
    gap: 2,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  categoryName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 11,
  } as object,
  categoryTime: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  } as object,
  categoryPct: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    minWidth: 28,
    textAlign: "right",
  } as object,
  // Apps
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  appIcon: { fontSize: 14 },
  appName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    fontSize: 13,
  } as object,
  appTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  } as object,
});
