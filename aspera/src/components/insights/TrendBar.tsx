import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { COLORS, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  label: string;
  // `null` means no data for that day — the bar stays at zero height and
  // the value label renders as an em-dash. Lets a sparse week keep the
  // x-axis legible instead of collapsing absent days off the chart.
  value: number | null;
  maxValue: number;
  color: string;
}

const MAX_BAR_HEIGHT = 80;

function isFiniteValue(v: number | null): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export default function TrendBar({ label, value, maxValue, color }: Props) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target =
      isFiniteValue(value) && maxValue > 0
        ? (value / maxValue) * MAX_BAR_HEIGHT
        : 0;
    Animated.timing(heightAnim, {
      toValue: target,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue]);

  return (
    <View style={styles.col}>
      <Text style={styles.val}>{isFiniteValue(value) ? value : "—"}</Text>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { height: heightAnim, backgroundColor: color }]}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  track: {
    width: "70%",
    height: MAX_BAR_HEIGHT,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  fill: {
    width: "100%",
    borderRadius: RADIUS.sm,
  },
  val: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "700",
  } as object,
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  } as object,
});
