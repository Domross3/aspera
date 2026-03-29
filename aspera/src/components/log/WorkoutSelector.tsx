import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WorkoutType } from '../../types';
import { WORKOUT_OPTIONS } from '../../constants/options';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  value: WorkoutType;
  onChange: (type: WorkoutType) => void;
}

export default function WorkoutSelector({ value, onChange }: Props) {
  const handlePress = (type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(type);
  };

  return (
    <View style={styles.grid}>
      {WORKOUT_OPTIONS.map(opt => {
        const selected = value === opt.type;
        return (
          <TouchableOpacity
            key={opt.type}
            style={[styles.tile, selected && styles.tileSelected]}
            onPress={() => handlePress(opt.type)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={opt.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={selected ? COLORS.accent : COLORS.textMuted}
            />
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tile: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  tileSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  labelSelected: {
    color: COLORS.accent,
  },
});
