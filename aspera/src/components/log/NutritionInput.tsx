import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MealQuality } from '../../types';
import { MEAL_QUALITY_LABELS } from '../../constants/options';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  mealQuality: MealQuality;
  hydration: number;
  onChangeMeal: (q: MealQuality) => void;
  onChangeHydration: (h: number) => void;
}

const MEAL_COLORS: Record<number, string> = {
  1: COLORS.danger,
  2: '#F97316',
  3: COLORS.warning,
  4: '#A3E635',
  5: COLORS.success,
};

export default function NutritionInput({ mealQuality, hydration, onChangeMeal, onChangeHydration }: Props) {
  const adjustHydration = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeHydration(Math.max(0, Math.min(12, hydration + delta)));
  };

  return (
    <View>
      {/* Meal Quality */}
      <Text style={styles.subLabel}>Meal Quality</Text>
      <View style={styles.mealRow}>
        {([1, 2, 3, 4, 5] as MealQuality[]).map(q => (
          <TouchableOpacity
            key={q}
            style={[
              styles.mealTile,
              mealQuality === q && { borderColor: MEAL_COLORS[q], backgroundColor: `${MEAL_COLORS[q]}22` },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangeMeal(q); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.mealScore, mealQuality === q && { color: MEAL_COLORS[q] }]}>{q}</Text>
            <Text style={[styles.mealLabel, mealQuality === q && { color: MEAL_COLORS[q] }]}>
              {MEAL_QUALITY_LABELS[q]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hydration */}
      <Text style={[styles.subLabel, { marginTop: SPACING.md }]}>Hydration</Text>
      <View style={styles.hydroRow}>
        <TouchableOpacity style={styles.hydroBtn} onPress={() => adjustHydration(-1)}>
          <Text style={styles.hydroBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.hydroDisplay}>
          <Text style={styles.hydroValue}>{hydration}</Text>
          <Text style={styles.hydroUnit}>glasses</Text>
        </View>
        <TouchableOpacity style={styles.hydroBtn} onPress={() => adjustHydration(1)}>
          <Text style={styles.hydroBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Water dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: 12 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangeHydration(i + 1); }}
          >
            <View style={[styles.dot, i < hydration && styles.dotFilled]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  } as object,
  mealRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  mealTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  mealScore: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    fontWeight: '700',
  } as object,
  mealLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  } as object,
  hydroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  hydroBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydroBtnText: {
    fontSize: 22,
    color: COLORS.text,
    lineHeight: 28,
  },
  hydroDisplay: {
    alignItems: 'center',
  },
  hydroValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.accentAlt,
  } as object,
  hydroUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dotFilled: {
    backgroundColor: COLORS.accentAlt,
    borderColor: COLORS.accentAlt,
  },
});
