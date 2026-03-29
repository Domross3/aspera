import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface Props {
  streak: number;
}

export default function StreakCounter({ streak }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [streak]);

  return (
    <LinearGradient
      colors={COLORS.gradients.energy as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, SHADOWS.glow]}
    >
      <Animated.Text style={[styles.flame, { transform: [{ scale: scaleAnim }] }]}>🔥</Animated.Text>
      <View style={styles.text}>
        <Text style={styles.label}>STREAK</Text>
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.unit}>{streak === 1 ? 'day' : 'days'}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flame: { fontSize: 40 },
  text: { gap: 2 },
  label: {
    ...TYPOGRAPHY.label,
    color: 'rgba(255,255,255,0.7)',
  } as object,
  count: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
  } as object,
  unit: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
  } as object,
});
