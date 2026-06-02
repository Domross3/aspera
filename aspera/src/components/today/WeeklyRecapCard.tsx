// WeeklyRecapCard — the calm Friday/Monday "here's your week" bookend on Today.
//
// Surfaces only when there's a real, unseen recap for the current week (the
// hook gates on !isQuiet + last-shown-week). Quiet weeks render nothing — the
// card never nags. Conceptually fills the slot the old "Peak Day" stat vacated,
// but as a once-a-week synthesis, not a standing dashboard tile.

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { useWeeklyRecap } from "../../hooks/useWeeklyRecap";

export default function WeeklyRecapCard() {
  const { recap, visible, dismiss } = useWeeklyRecap();

  if (!visible || !recap) return null;

  return (
    <View>
      <SectionLabel label="Your week" style={{ marginTop: SPACING.xl }} />
      <GradientCard>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
          {recap.summary}
        </Text>
        <View style={styles.list}>
          {recap.items.map((item, i) => (
            <View key={`${item.kind}:${i}`} style={styles.item}>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.footerRow}>
          <Text
            style={[
              TYPOGRAPHY.caption,
              { color: COLORS.textMuted, fontStyle: "italic", flex: 1 },
            ]}
          >
            From your own logs — hints worth noticing, not proven cause.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void dismiss();
            }}
            hitSlop={8}
          >
            <Text style={styles.dismiss}>Got it</Text>
          </TouchableOpacity>
        </View>
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md, marginTop: SPACING.md },
  item: {
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  dismiss: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "600",
  } as object,
});
