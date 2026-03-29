import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

const PRESET_TAGS = [
  { label: 'Cold Shower', emoji: '🥶' },
  { label: 'No Phone AM', emoji: '📵' },
  { label: 'Sunlight', emoji: '☀️' },
  { label: 'Alcohol', emoji: '🍺' },
  { label: 'Poor Sleep', emoji: '😴' },
  { label: 'Meditation', emoji: '🧘' },
  { label: 'Journaling', emoji: '📓' },
  { label: 'Social', emoji: '👥' },
];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function CustomTags({ selected, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const toggle = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    );
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed && !selected.includes(trimmed)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange([...selected, trimmed]);
    }
    setCustomText('');
    setShowInput(false);
  };

  return (
    <View>
      <View style={styles.wrap}>
        {PRESET_TAGS.map(t => {
          const active = selected.includes(t.label);
          return (
            <TouchableOpacity
              key={t.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(t.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{t.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom tags the user has added */}
        {selected
          .filter(t => !PRESET_TAGS.some(p => p.label === t))
          .map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, styles.chipActive]}
              onPress={() => toggle(t)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>🏷️</Text>
              <Text style={[styles.label, styles.labelActive]}>{t}</Text>
            </TouchableOpacity>
          ))}

        {/* Add custom tag button */}
        <TouchableOpacity
          style={[styles.chip, styles.addChip]}
          onPress={() => setShowInput(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={COLORS.accent} />
          <Text style={[styles.label, { color: COLORS.accent }]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="Tag name..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoFocus
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  addChip: {
    borderColor: COLORS.borderAccent,
    borderStyle: 'dashed',
  },
  emoji: { fontSize: 13 },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  labelActive: { color: COLORS.accent },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    ...TYPOGRAPHY.body as object,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
});
