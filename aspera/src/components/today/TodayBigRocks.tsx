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

import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import BigRocksInput from "../log/BigRocksInput";
import { DailyLog } from "../../types";
import { asperaDayId } from "../../lib/day";
import { carryForwardFocus, shouldReaffirmFocus } from "../../lib/focusCarry";

interface Props {
  todayRocks: string[];
  recentLogs: DailyLog[]; // for carry-forward + "still these?"
  onChange: (rocks: string[]) => void | Promise<void>;
  // True once the user has explicitly cleared/edited today's focus, so we
  // don't re-carry-forward over a deliberate empty. Optional; defaults false.
  todayFocusTouched?: boolean;
}

export default function TodayBigRocks({
  todayRocks,
  recentLogs,
  onChange,
  todayFocusTouched = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [dismissedReaffirm, setDismissedReaffirm] = useState(false);
  const hasRocks = todayRocks.length > 0;

  const todayId = asperaDayId();
  const previousRocks = carryForwardFocus(recentLogs, todayId);

  // Auto carry-forward: when today has no focus yet and the user hasn't
  // deliberately cleared it, pre-fill from the most recent prior day. Runs
  // once per empty-state (guarded by a ref) so it never fights a manual edit
  // or loops. The carried log keeps outputRated:false (it's a focus, not a
  // rating) — the parent's onChange/defaultLogShell handles that.
  const carriedRef = useRef(false);
  useEffect(() => {
    if (
      !hasRocks &&
      !todayFocusTouched &&
      !carriedRef.current &&
      previousRocks.length > 0
    ) {
      carriedRef.current = true;
      void onChange(previousRocks);
    }
  }, [hasRocks, todayFocusTouched, previousRocks, onChange]);

  // "Still these?" — the same focus has ridden untouched for a stretch of
  // days, so it may be stale. Ask (relevance, not completion). Display-mode
  // only, dismissable for the session.
  const reaffirm =
    hasRocks &&
    !editing &&
    !dismissedReaffirm &&
    shouldReaffirmFocus(recentLogs, todayRocks);

  const handleStartEditing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(true);
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
          <Text style={styles.sectionLabel}>Today's Focus</Text>
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
          {reaffirm && (
            <View style={styles.reaffirmRow}>
              <Text style={styles.reaffirmText}>Still these?</Text>
              <View style={styles.reaffirmActions}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDismissedReaffirm(true);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.reaffirmYes}>Yes, keep</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStartEditing} hitSlop={8}>
                  <Text style={styles.reaffirmEdit}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GradientCard>
      </View>
    );
  }

  // Edit mode (either empty or explicitly editing)
  return (
    <View style={{ marginTop: SPACING.lg }}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>
          {hasRocks ? "Edit today's focus" : "What's mattering today?"}
        </Text>
        {hasRocks && (
          <TouchableOpacity onPress={handleDone} hitSlop={8}>
            <Text style={styles.editLink}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
      <GradientCard>
        <BigRocksInput rocks={todayRocks} onChange={onChange} />
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
  reaffirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  reaffirmText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  reaffirmActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  reaffirmYes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600",
  } as object,
  reaffirmEdit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "600",
  } as object,
});
