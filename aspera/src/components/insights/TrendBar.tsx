import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface Props {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const MAX_BAR_HEIGHT = 80;

export default function TrendBar({ label, value, maxValue, color }: Props) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: maxValue > 0 ? (value / maxValue) * MAX_BAR_HEIGHT : 0,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue]);

  return (
    <View style={styles.col}>
      <Text style={styles.val}>{value}</Text>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { height: heightAnim, backgroundColor: color }]}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  track: {
    width: '70%',
    height: MAX_BAR_HEIGHT,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  val: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
  } as object,
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  } as object,
});
