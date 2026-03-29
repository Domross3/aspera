import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface Props {
  recommendation: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function RecommendationBanner({ recommendation, isLoading, onRefresh }: Props) {
  return (
    <LinearGradient
      colors={COLORS.gradients.focus as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, SHADOWS.glow]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>🧠</Text>
          <Text style={styles.title}>AI Recommendation</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading} style={styles.refresh}>
          {isLoading
            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            : <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.7)" />
          }
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <View style={styles.shimmer} />
          <View style={[styles.shimmer, { width: '70%' }]} />
        </View>
      ) : (
        <Text style={styles.rec}>
          {recommendation ?? 'Log today\'s data and tap refresh to get your AI recommendation.'}
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emoji: { fontSize: 18 },
  title: {
    ...TYPOGRAPHY.label,
    color: 'rgba(255,255,255,0.8)',
  } as object,
  refresh: { padding: SPACING.xs },
  loading: { gap: SPACING.xs },
  shimmer: {
    height: 14,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.sm,
  },
  rec: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  } as object,
});
