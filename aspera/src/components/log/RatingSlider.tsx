import React, { useRef } from "react";
import {
  View,
  Text,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

interface Props {
  label: string;
  value: number;
  max?: number;
  onChange: (v: number) => void;
  accentColor?: string;
}

export default function RatingSlider({
  label,
  value,
  max = 10,
  onChange,
  accentColor = COLORS.accent,
}: Props) {
  const adjustValue = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(1, Math.min(max, value + delta)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>
          {value}/{max}
        </Text>
      </View>

      {/* Tap-to-select dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < value;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(i + 1);
              }}
              style={[
                styles.dot,
                { backgroundColor: filled ? accentColor : COLORS.border },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => adjustValue(-1)}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              {
                width: `${(value / max) * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => adjustValue(1)}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  } as object,
  value: {
    ...TYPOGRAPHY.title,
    fontWeight: "700",
  } as object,
  dotsRow: {
    flexDirection: "row",
    gap: SPACING.xs - 2,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: RADIUS.pill,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 20,
    color: COLORS.text,
    lineHeight: 24,
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: RADIUS.pill,
  },
});
