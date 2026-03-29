import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useInsights } from '../../src/hooks/useInsights';
import { useLogs } from '../../src/hooks/useLogs';
import { useSettings } from '../../src/hooks/useSettings';
import { CoachPersonality } from '../../src/api/claude';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';
import GradientCard from '../../src/components/common/GradientCard';
import SectionLabel from '../../src/components/common/SectionLabel';
import CorrelationCard from '../../src/components/insights/CorrelationCard';
import TrendBarsSection from '../../src/components/insights/TrendBarsSection';

const PERSONALITIES: { key: CoachPersonality; label: string; emoji: string; desc: string }[] = [
  { key: 'analytical', label: 'Analytical', emoji: '📊', desc: 'Data-driven, precise' },
  { key: 'unserious', label: 'Unserious', emoji: '😏', desc: 'Witty, calls you out' },
  { key: 'stoic', label: 'Stoic', emoji: '🏛️', desc: 'Terse, Marcus Aurelius' },
];

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { recentLogs } = useLogs();
  const { settings } = useSettings();
  const { insights, loading, error, loadCached, generate } = useInsights();
  const [personality, setPersonality] = useState<CoachPersonality>('analytical');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCached();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleGenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generate(settings.claudeApiKey, recentLogs, personality);
  };

  const handlePersonality = (p: CoachPersonality) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPersonality(p);
  };

  return (
    <LinearGradient colors={COLORS.gradients.background as [string, string]} style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[styles.content, {
            paddingTop: insets.top + SPACING.lg,
            paddingBottom: insets.bottom + 100,
          }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[TYPOGRAPHY.hero, { color: COLORS.text, marginBottom: SPACING.xs }]}>Insights</Text>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginBottom: SPACING.lg }]}>
            AI-powered correlations from your data
          </Text>

          {/* Personality selector */}
          <SectionLabel label="Coaching Style" />
          <View style={styles.personalityRow}>
            {PERSONALITIES.map(p => {
              const active = personality === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.personalityPill, active && styles.personalityPillActive]}
                  onPress={() => handlePersonality(p.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.personalityEmoji}>{p.emoji}</Text>
                  <Text style={[styles.personalityLabel, active && styles.personalityLabelActive]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.personalityDesc, active && { color: COLORS.textSecondary }]}>
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Generate button */}
          <TouchableOpacity onPress={handleGenerate} disabled={loading} activeOpacity={0.85} style={{ marginTop: SPACING.lg }}>
            <LinearGradient
              colors={COLORS.gradients.accent as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.genButton, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.text} size="small" />
                  <Text style={styles.genButtonText}>Analyzing your patterns...</Text>
                </View>
              ) : (
                <Text style={styles.genButtonText}>
                  {insights ? '🔄 Regenerate Insights' : '✨ Generate AI Insights'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Error */}
          {error && (
            <GradientCard colors={['#2A1515', '#1A0E0E']} style={{ marginTop: SPACING.md }}>
              <Text style={[TYPOGRAPHY.caption, { color: COLORS.danger }]}>⚠️ {error}</Text>
            </GradientCard>
          )}

          {/* Summary */}
          {insights && (
            <>
              <GradientCard colors={COLORS.gradients.accent} style={{ marginTop: SPACING.lg }}>
                <Text style={[TYPOGRAPHY.label, { color: 'rgba(255,255,255,0.7)', marginBottom: SPACING.xs }]}>
                  SUMMARY
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>{insights.summary}</Text>
                <View style={styles.recBox}>
                  <Text style={[TYPOGRAPHY.label, { color: 'rgba(255,255,255,0.6)', marginBottom: SPACING.xs }]}>
                    TOP ACTION
                  </Text>
                  <Text style={[TYPOGRAPHY.body, { color: COLORS.text, fontWeight: '600' }]}>
                    {insights.topRecommendation}
                  </Text>
                </View>
              </GradientCard>

              {/* Trend bars */}
              {insights.weeklyTrends?.length > 0 && (
                <>
                  <SectionLabel label="7-Day Trends" style={{ marginTop: SPACING.xl }} />
                  <GradientCard>
                    <TrendBarsSection trends={insights.weeklyTrends} />
                  </GradientCard>
                </>
              )}

              {/* Correlation cards */}
              <SectionLabel label={`${insights.correlations.length} Patterns Found`} style={{ marginTop: SPACING.xl }} />
              <View style={styles.cards}>
                {insights.correlations.map((c, i) => (
                  <CorrelationCard key={c.id} correlation={c} index={i} />
                ))}
              </View>

              {/* Footnote */}
              <View style={styles.footnote}>
                <Text style={styles.footnoteText}>
                  Powered by mock data from Spotify, HealthKit, and Google APIs
                </Text>
                <Text style={[styles.footnoteText, { marginTop: 2 }]}>
                  Generated {new Date(insights.generatedAt).toLocaleDateString()}
                </Text>
              </View>
            </>
          )}

          {/* Empty state */}
          {!insights && !loading && (
            <GradientCard style={{ marginTop: SPACING.xl, alignItems: 'center', paddingVertical: SPACING.xl }}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🔭</Text>
              <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text, textAlign: 'center' }]}>
                No insights yet
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs }]}>
                Choose a coaching style above, then generate your analysis
              </Text>
            </GradientCard>
          )}
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  personalityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  personalityPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  personalityPillActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  personalityEmoji: { fontSize: 20 },
  personalityLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '700',
  } as object,
  personalityLabelActive: { color: COLORS.accent },
  personalityDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 9,
  } as object,
  genButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: '700',
  } as object,
  loadingRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  recBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cards: { gap: SPACING.md },
  footnote: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footnoteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  } as object,
});
