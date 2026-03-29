import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  value: number;  // 1–10
  disabled?: boolean;
  onChange: (v: number) => void;
}

export default function IntensitySlider({ value, disabled = false, onChange }: Props) {
  const set = (v: number) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(10, v));
    if (clamped !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(clamped);
    }
  };

  const intensityColor = disabled ? COLORS.textMuted : COLORS.intensity[value - 1] ?? COLORS.accent;

  return (
    <View style={disabled && styles.disabled}>
      {/* Tappable segments */}
      <View style={styles.segmentRow}>
        {Array.from({ length: 10 }).map((_, i) => {
          const segVal = i + 1;
          const active = segVal <= value;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: active
                    ? COLORS.intensity[i]
                    : COLORS.border,
                  height: 12 + i * 2.5, // graduated height
                },
              ]}
              onPress={() => set(segVal)}
              activeOpacity={0.7}
              disabled={disabled}
            />
          );
        })}
      </View>

      {/* Labels + value */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>Low</Text>
        <View style={styles.valueRow}>
          <TouchableOpacity onPress={() => set(value - 1)} disabled={disabled} style={styles.adjBtn}>
            <Text style={[styles.adjText, { color: intensityColor }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.valueText, { color: intensityColor }]}>
            {disabled ? '—' : value} / 10
          </Text>
          <TouchableOpacity onPress={() => set(value + 1)} disabled={disabled} style={styles.adjBtn}>
            <Text style={[styles.adjText, { color: intensityColor }]}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.labelText}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    paddingVertical: SPACING.sm,
  },
  segment: {
    flex: 1,
    borderRadius: RADIUS.sm,
    minHeight: 12,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  labelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  valueText: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '700',
  } as object,
  adjBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
});
