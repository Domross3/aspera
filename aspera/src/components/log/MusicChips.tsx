import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MusicGenre } from '../../types';
import { MUSIC_GENRE_OPTIONS } from '../../constants/options';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  selected: MusicGenre[];
  onChange: (genres: MusicGenre[]) => void;
}

export default function MusicChips({ selected, onChange }: Props) {
  const toggle = (genre: MusicGenre) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (genre === 'none') {
      onChange(['none']);
      return;
    }
    const without = selected.filter(g => g !== 'none');
    const next = without.includes(genre)
      ? without.filter(g => g !== genre)
      : [...without, genre];
    onChange(next.length === 0 ? ['none'] : next);
  };

  return (
    <View style={styles.wrap}>
      {MUSIC_GENRE_OPTIONS.map(opt => {
        const isSelected = selected.includes(opt.type);
        return (
          <TouchableOpacity
            key={opt.type}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggle(opt.type)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{opt.emoji}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  emoji: { fontSize: 14 },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  labelSelected: {
    color: COLORS.accent,
  },
});
