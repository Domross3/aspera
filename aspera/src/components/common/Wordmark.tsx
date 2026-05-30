import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";
import BreathingOrb from "./BreathingOrb";

interface Props {
  tagline?: string;
  compact?: boolean;
}

export default function Wordmark({
  tagline = "ad astra per",
  compact = false,
}: Props) {
  return (
    <View style={[styles.shell, compact && styles.compact]}>
      <BreathingOrb size={compact ? 42 : 56} animate={!compact} />
      <View style={styles.textBlock}>
        <Text style={styles.tagline}>{tagline}</Text>
        <Text style={[TYPOGRAPHY.wordmark, styles.name]}>aspera</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    gap: 12,
  },
  compact: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  textBlock: {
    alignItems: "center",
  },
  tagline: {
    ...TYPOGRAPHY.aspLabel,
    color: COLORS.textMuted,
    fontSize: 9.5,
    letterSpacing: 3,
    lineHeight: 11,
    marginBottom: 1,
  } as object,
  name: {
    color: COLORS.text,
  } as object,
});
