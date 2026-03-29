import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
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
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const isCustom = value !== 'none' && !WORKOUT_OPTIONS.some(o => o.type === value);

  const handlePress = (type: WorkoutType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(type);
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(trimmed);
    }
    setCustomText('');
    setShowInput(false);
  };

  return (
    <View>
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

        {/* Show custom tile if custom value is active */}
        {isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.tileSelected]}
            onPress={() => handlePress('none')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.accent} />
            <Text style={[styles.label, styles.labelSelected]}>{value}</Text>
          </TouchableOpacity>
        )}

        {/* Add custom button */}
        {!isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.addTile]}
            onPress={() => setShowInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={COLORS.accent} />
            <Text style={[styles.label, { color: COLORS.accent }]}>Custom</Text>
          </TouchableOpacity>
        )}
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="e.g. Swimming, Boxing..."
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
  addTile: {
    borderColor: COLORS.borderAccent,
    borderStyle: 'dashed',
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  labelSelected: {
    color: COLORS.accent,
  },
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
