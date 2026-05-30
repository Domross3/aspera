import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { BROWSING_DATA, BrowsingDay } from "../../lib/mockData";
import {
  fetchBrowsingFromFirebase,
  FirebaseBrowsingDay,
} from "../../lib/firebase";
import { useTheme } from "../../theme/ThemeProvider";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

function msToLabel(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function firebaseToLocal(fb: FirebaseBrowsingDay): BrowsingDay {
  const sites = Object.entries(fb.sites).map(([key, info]) => ({
    hostname: info.hostname || key.replace(/_/g, "."),
    time: info.time,
    category: info.category,
    visits: info.visits,
  }));
  return { date: fb.date, sites, totals: fb.totals, focusScore: fb.focusScore };
}

export default function BrowsingFocus() {
  const [liveData, setLiveData] = useState<BrowsingDay | null>(null);
  const [isLive, setIsLive] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Firebase live fetch — disabled for demo stability, enable to show LIVE badge
  // useEffect(() => {
  //   fetchBrowsingFromFirebase().then(results => {
  //     if (results.length > 0) {
  //       setLiveData(firebaseToLocal(results[0]));
  //       setIsLive(true);
  //     }
  //   });
  // }, []);

  const today = isLive ? liveData : BROWSING_DATA[0];
  if (!today) return null;

  const { totals, focusScore, sites } = today;
  const totalMs = totals.productive + totals.neutral + totals.distracting;
  const prodPct = Math.round((totals.productive / totalMs) * 100);
  const distPct = Math.round((totals.distracting / totalMs) * 100);

  const scoreColor =
    focusScore >= 70
      ? colors.success
      : focusScore >= 40
        ? colors.warning
        : colors.danger;

  const topSites = [...sites].sort((a, b) => b.time - a.time).slice(0, 5);

  const categoryColors: Record<string, string> = {
    productive: colors.success,
    neutral: colors.textMuted,
    distracting: colors.danger,
  };

  return (
    <View>
      <SectionLabel label="Browsing Focus" />
      <GradientCard>
        <View style={styles.header}>
          <Text style={styles.extensionIcon}>🌐</Text>
          <Text style={styles.headerText}>Aspera Focus</Text>
          <View style={[styles.badge, isLive && styles.badgeLive]}>
            <Text style={[styles.badgeText, isLive && styles.badgeTextLive]}>
              {isLive ? "LIVE" : "MOCK"}
            </Text>
          </View>
        </View>

        {/* Focus Score */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {focusScore}
            </Text>
            <Text style={styles.scoreLabel}>SCORE</Text>
          </View>
          <View style={styles.breakdownCol}>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.breakdownLabel}>Productive</Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                {msToLabel(totals.productive)} ({prodPct}%)
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View
                style={[styles.dot, { backgroundColor: colors.textMuted }]}
              />
              <Text style={styles.breakdownLabel}>Neutral</Text>
              <Text style={styles.breakdownValue}>
                {msToLabel(totals.neutral)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <Text style={styles.breakdownLabel}>Distracting</Text>
              <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                {msToLabel(totals.distracting)} ({distPct}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Bar */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                flex: totals.productive,
                backgroundColor: colors.success,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.barFill,
              { flex: totals.neutral, backgroundColor: colors.textMuted },
            ]}
          />
          <View
            style={[
              styles.barFill,
              {
                flex: totals.distracting,
                backgroundColor: colors.danger,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              },
            ]}
          />
        </View>

        {/* Top Sites */}
        <Text
          style={[
            TYPOGRAPHY.caption,
            {
              color: colors.textMuted,
              marginTop: SPACING.md,
              marginBottom: SPACING.xs,
            },
          ]}
        >
          TOP SITES
        </Text>
        {topSites.map((site, i) => (
          <View key={site.hostname} style={styles.siteRow}>
            <View
              style={[
                styles.siteDot,
                { backgroundColor: categoryColors[site.category] },
              ]}
            />
            <Text style={styles.siteHost} numberOfLines={1}>
              {site.hostname}
            </Text>
            <Text style={styles.siteTime}>{msToLabel(site.time)}</Text>
            <Text style={styles.siteVisits}>{site.visits} visits</Text>
          </View>
        ))}
      </GradientCard>
    </View>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      gap: SPACING.xs,
    },
    extensionIcon: { fontSize: 14 },
    headerText: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      flex: 1,
    } as object,
    badge: {
      backgroundColor: "rgba(108,99,255,0.2)",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.pill,
    },
    badgeLive: {
      backgroundColor: "rgba(52,211,153,0.2)",
    },
    badgeText: {
      ...TYPOGRAPHY.caption,
      color: c.accent,
      fontSize: 9,
    } as object,
    badgeTextLive: {
      color: c.success,
    },
    // Score
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.lg,
      marginBottom: SPACING.md,
    },
    scoreCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    scoreValue: {
      ...TYPOGRAPHY.title,
      lineHeight: 26,
    } as object,
    scoreLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 8,
    } as object,
    breakdownCol: { flex: 1, gap: SPACING.xs },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    breakdownLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      flex: 1,
      fontSize: 11,
    } as object,
    breakdownValue: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    } as object,
    // Bar
    barTrack: {
      flexDirection: "row",
      height: 6,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: c.surface,
    },
    barFill: { height: "100%" },
    // Sites
    siteRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: SPACING.xs,
      gap: SPACING.xs,
    },
    siteDot: { width: 6, height: 6, borderRadius: 3 },
    siteHost: {
      ...TYPOGRAPHY.body,
      color: c.text,
      flex: 1,
      fontSize: 13,
    } as object,
    siteTime: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      minWidth: 40,
      textAlign: "right",
    } as object,
    siteVisits: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 10,
      minWidth: 45,
      textAlign: "right",
    } as object,
  });
