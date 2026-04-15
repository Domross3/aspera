import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  icon: string;
  label: string;
  value: string;
  color: string;
}

export default function SummaryPill({ icon, label, value, color }: Props) {
  return (
    <View style={[styles.pill, { borderColor: `${color}44` }]}>
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={16}
        color={color}
      />
      <View style={styles.text}>
        <Text style={[styles.label, { color: COLORS.textMuted }]}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceElevated,
  },
  text: { gap: 1 },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  } as object,
  value: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    fontSize: 13,
  } as object,
});
