// DepthTap — a single eudaimonic 3-way tap (Yes / Somewhat / No) for one of
// the depth pillars (meaning / connection / growth). Deliberately light: a tap,
// not a slider — quantifying meaning on a 1–7 scale would be the QS reductionism
// the depth track exists to avoid. Storage is for gentle trending, not scoring.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { DEPTH_OPTIONS } from "../../lib/depthPrompts";
import type { DepthValue } from "../../types";

interface Props {
  prompt: string;
  value: DepthValue | undefined;
  onChange: (value: DepthValue) => void;
}

export default function DepthTap({ prompt, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.row}>
        {DEPTH_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(opt.value);
              }}
              style={[styles.btn, active && styles.btnActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  prompt: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  } as object,
  row: { flexDirection: "row", gap: SPACING.xs },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  btnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "600",
  } as object,
  labelActive: { color: COLORS.background } as object,
});
