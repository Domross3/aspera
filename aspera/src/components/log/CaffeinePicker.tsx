import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CaffeineType } from '../../types';
import { CAFFEINE_OPTIONS, CAFFEINE_AMOUNTS } from '../../constants/options';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  value: CaffeineType;
  amount: number;
  onChange: (type: CaffeineType, amount: number) => void;
}

export default function CaffeinePicker({ value, amount, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const isCustom = value !== 'none' && !CAFFEINE_OPTIONS.some(o => o.type === value);

  const handleType = (type: CaffeineType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const option = CAFFEINE_OPTIONS.find(o => o.type === type);
    onChange(type, type === 'none' ? 0 : (option?.defaultMg ?? 100));
  };

  const handleAmount = (mg: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value, mg);
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(trimmed, 100);
    }
    setCustomText('');
    setShowInput(false);
  };

  return (
    <View>
      <View style={styles.row}>
        {CAFFEINE_OPTIONS.map(opt => {
          const selected = value === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[styles.tile, selected && styles.tileSelected]}
              onPress={() => handleType(opt.type)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={selected ? COLORS.accent : COLORS.textMuted}
              />
              <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom type row */}
      <View style={[styles.row, { marginTop: SPACING.xs }]}>
        {isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.tileSelected, { flex: 1 }]}
            onPress={() => handleType('none')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color={COLORS.accent} />
            <Text style={[styles.tileLabel, styles.tileLabelSelected]}>{value}</Text>
          </TouchableOpacity>
        )}
        {!isCustom && (
          <TouchableOpacity
            style={[styles.tile, styles.addTile]}
            onPress={() => setShowInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={COLORS.accent} />
            <Text style={[styles.tileLabel, { color: COLORS.accent }]}>Custom</Text>
          </TouchableOpacity>
        )}
      </View>

      {showInput && (
        <View style={styles.inputRow}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="e.g. Yerba Mate, Tea..."
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

      {value !== 'none' && (
        <View style={styles.amountsRow}>
          {CAFFEINE_AMOUNTS.map(mg => (
            <TouchableOpacity
              key={mg}
              style={[styles.amountChip, amount === mg && styles.amountChipSelected]}
              onPress={() => handleAmount(mg)}
              activeOpacity={0.7}
            >
              <Text style={[styles.amountLabel, amount === mg && styles.amountLabelSelected]}>
                {mg}mg
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
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
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  tileLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  tileLabelSelected: {
    color: COLORS.accent,
  },
  amountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  amountChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  amountChipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  amountLabelSelected: {
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
