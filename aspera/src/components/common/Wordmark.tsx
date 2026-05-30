import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TYPOGRAPHY } from "../../constants/theme";
import BreathingOrb from "./BreathingOrb";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  tagline?: string;
  compact?: boolean;
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
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
      color: c.textMuted,
      fontSize: 9.5,
      letterSpacing: 3,
      lineHeight: 11,
      marginBottom: 1,
    } as object,
    name: {
      color: c.text,
    } as object,
  });

export default function Wordmark({
  tagline = "ad astra per",
  compact = false,
}: Props) {
  const styles = useThemedStyles(makeStyles);
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
