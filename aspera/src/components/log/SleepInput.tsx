import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { SLEEP_DATA } from '../../lib/mockData';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function SleepInput({ value, onChange }: Props) {
  const [synced, setSynced] = useState(false);

  // Auto-pull from mock HealthKit on first render if value is 0
  useEffect(() => {
    if (value === 0 && !synced) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySleep = SLEEP_DATA.find(s => s.date === todayStr);
      if (todaySleep) {
        onChange(todaySleep.hours_slept);
        setSynced(true);
      }
    }
  }, []);

  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.round((value + delta) * 10) / 10;
    onChange(Math.max(0, Math.min(14, next)));
  };

  const qualityLabel = value >= 8 ? 'Great' : value >= 7 ? 'Good' : value >= 6 ? 'Fair' : value > 0 ? 'Low' : '—';
  const qualityColor = value >= 8 ? COLORS.success : value >= 7 ? COLORS.accentAlt : value >= 6 ? COLORS.warning : COLORS.danger;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Time in Bed</Text>
        <View style={styles.healthkitBadge}>
          <Ionicons name="heart" size={11} color={COLORS.danger} />
          <Text style={styles.healthkitText}>Apple Health</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => adjust(-0.5)}>
          <Ionicons name="remove" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.countWrap}>
          <Text style={styles.count}>{value.toFixed(1)}</Text>
          <Text style={styles.unit}>hours</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => adjust(0.5)}>
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Quality indicator */}
      <View style={styles.qualityRow}>
        <Text style={[styles.qualityLabel, { color: qualityColor }]}>{qualityLabel}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(100, (value / 9) * 100)}%`, backgroundColor: qualityColor }]} />
        </View>
      </View>

      {/* Quick presets */}
      <View style={styles.chips}>
        {[5, 6, 6.5, 7, 7.5, 8, 9].map(h => (
          <TouchableOpacity
            key={h}
            style={[styles.chip, Math.abs(value - h) < 0.05 && styles.chipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(h); }}
          >
            <Text style={[styles.chipText, Math.abs(value - h) < 0.05 && styles.chipTextActive]}>
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {synced && (
        <Text style={styles.syncNote}>
          Auto-filled from Apple Health
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
  healthkitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(248,113,113,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  healthkitText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '600',
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countWrap: { alignItems: 'center', minWidth: 70 },
  count: {
    ...TYPOGRAPHY.hero,
    color: COLORS.accentAlt,
    lineHeight: 42,
  } as object,
  unit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  qualityLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    width: 40,
  } as object,
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  chipActive: {
    backgroundColor: COLORS.accentAlt,
    borderColor: COLORS.accentAlt,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  } as object,
  chipTextActive: {
    color: '#000',
  },
  syncNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as object,
});
