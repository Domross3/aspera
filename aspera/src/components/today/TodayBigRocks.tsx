// Big Rocks as the morning anchor on the Today tab.
//
// Two modes:
//   - Empty (no rocks set today): morning prompt + BigRocksInput. Suggests
//     yesterday's rocks as a starting point if available.
//   - Set: numbered card display with a small "Edit" button to re-open the
//     input. Save persists immediately via the parent's onChange.
//
// Big Rocks live on the DailyLog ('bigRocks: string[]') and are now captured
// here on Today rather than buried in the Log form. Log tab shows them
// read-only and links back to Today.

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import BigRocksInput from "../log/BigRocksInput";
import { DailyLog } from "../../types";
import { asperaDayId } from "../../lib/day";

interface Props {
  todayRocks: string[];
  recentLogs: DailyLog[]; // for "yesterday's rocks" suggestion
  onChange: (rocks: string[]) => void | Promise<void>;
}

export default function TodayBigRocks({
  todayRocks,
  recentLogs,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const hasRocks = todayRocks.length > 0;

  // Yesterday's rocks (recentLogs[0] is today if logged; else most recent prior day).
  // Walk until we find a different date with non-empty rocks, capping at 7.
  const todayId = asperaDayId();
  const previousRocks =
    recentLogs.find((l) => l.id !== todayId && l.bigRocks?.length > 0)
      ?.bigRocks ?? [];

  const handleStartEditing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(true);
  };

  const handleApplyYesterday = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onChange(previousRocks.slice(0, 3));
    setEditing(false);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(false);
  };

  // Display mode: rocks set, not currently editing
  if (hasRocks && !editing) {
    return (
      <View style={{ marginTop: SPACING.lg }}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Today's Big Rocks</Text>
          <TouchableOpacity onPress={handleStartEditing} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>
        <GradientCard>
          {todayRocks.map((rock, i) => (
            <View key={i} style={styles.rockRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              <Text style={styles.rockText}>{rock}</Text>
            </View>
          ))}
        </GradientCard>
      </View>
    );
  }

  // Edit mode (either empty or explicitly editing)
  return (
    <View style={{ marginTop: SPACING.lg }}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>
          {hasRocks ? "Edit Big Rocks" : "What's mattering today?"}
        </Text>
        {hasRocks && (
          <TouchableOpacity onPress={handleDone} hitSlop={8}>
            <Text style={styles.editLink}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
      <GradientCard>
        <BigRocksInput rocks={todayRocks} onChange={onChange} />

        {!hasRocks && previousRocks.length > 0 && (
          <TouchableOpacity
            onPress={handleApplyYesterday}
            style={styles.suggestionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.suggestionText} numberOfLines={2}>
              Use yesterday's: {previousRocks.slice(0, 3).join(" · ")}
            </Text>
          </TouchableOpacity>
        )}
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
  } as object,
  editLink: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "600",
  } as object,
  rockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  rockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  } as object,
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
  },
  suggestionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  } as object,
});
