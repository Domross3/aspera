import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { MealQuality } from "../../types";
import { MEAL_QUALITY_LABELS } from "../../constants/options";
import { SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { AsperaColors } from "../../theme/ThemeProvider";

interface Props {
  mealQuality: MealQuality;
  hydration: number;
  onChangeMeal: (q: MealQuality) => void;
  onChangeHydration: (h: number) => void;
}

// Fixed semantic colors for meal quality — not theme-dependent,
// they always convey red→green sentiment regardless of palette.
const MEAL_COLORS: Record<number, string> = {
  1: "#e74c3c",
  2: "#F97316",
  3: "#f39c12",
  4: "#A3E635",
  5: "#2ecc71",
};

export default function NutritionInput({
  mealQuality,
  hydration,
  onChangeMeal,
  onChangeHydration,
}: Props) {
  const styles = useThemedStyles(makeStyles);

  const adjustHydration = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeHydration(Math.max(0, Math.min(12, hydration + delta)));
  };

  return (
    <View>
      {/* Meal Quality */}
      <Text style={styles.subLabel}>Meal Quality</Text>
      <View style={styles.mealRow}>
        {([1, 2, 3, 4, 5] as MealQuality[]).map((q) => (
          <TouchableOpacity
            key={q}
            style={[
              styles.mealTile,
              mealQuality === q && {
                borderColor: MEAL_COLORS[q],
                backgroundColor: `${MEAL_COLORS[q]}22`,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChangeMeal(q);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.mealScore,
                mealQuality === q && { color: MEAL_COLORS[q] },
              ]}
            >
              {q}
            </Text>
            <Text
              style={[
                styles.mealLabel,
                mealQuality === q && { color: MEAL_COLORS[q] },
              ]}
            >
              {MEAL_QUALITY_LABELS[q]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hydration */}
      <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>
        Hydration
      </Text>
      <View style={styles.hydroRow}>
        <TouchableOpacity
          style={styles.hydroBtn}
          onPress={() => adjustHydration(-1)}
        >
          <Text style={styles.hydroBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.hydroDisplay}>
          <Text style={styles.hydroValue}>{hydration}</Text>
          <Text style={styles.hydroUnit}>glasses</Text>
        </View>
        <TouchableOpacity
          style={styles.hydroBtn}
          onPress={() => adjustHydration(1)}
        >
          <Text style={styles.hydroBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Water dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: 12 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChangeHydration(i + 1);
            }}
          >
            <View style={[styles.dot, i < hydration && styles.dotFilled]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: AsperaColors) => ({
  subLabel: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
    marginBottom: SPACING.sm,
  } as object,
  mealRow: {
    flexDirection: "row" as const,
    gap: SPACING.xs,
  },
  mealTile: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  mealScore: {
    ...TYPOGRAPHY.subtitle,
    color: c.textSecondary,
    fontWeight: "700" as const,
  } as object,
  mealLabel: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
    marginTop: 2,
  } as object,
  hydroRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: SPACING.sm,
  },
  hydroBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  hydroBtnText: {
    fontSize: 22,
    color: c.text,
    lineHeight: 28,
  },
  hydroDisplay: {
    alignItems: "center" as const,
  },
  hydroValue: {
    ...TYPOGRAPHY.title,
    color: c.accentAlt,
  } as object,
  hydroUnit: {
    ...TYPOGRAPHY.caption,
    color: c.textMuted,
  } as object,
  dotsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: SPACING.xs,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.border,
    borderWidth: 1,
    borderColor: c.border,
  },
  dotFilled: {
    backgroundColor: c.accentAlt,
    borderColor: c.accentAlt,
  },
});
