import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogs } from '../../src/hooks/useLogs';
import { useSettings } from '../../src/hooks/useSettings';
import { getTodayRec, saveTodayRec } from '../../src/storage/storage';
import { getTodayRecommendation } from '../../src/api/claude';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';
import GradientCard from '../../src/components/common/GradientCard';
import SummaryPill from '../../src/components/today/SummaryPill';
import RecommendationBanner from '../../src/components/today/RecommendationBanner';
import StreakCounter from '../../src/components/today/StreakCounter';
import AnimatedNumber from '../../src/components/common/AnimatedNumber';
import SectionLabel from '../../src/components/common/SectionLabel';

function todayId() { return new Date().toISOString().split('T')[0]; }

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todayLog, recentLogs, loading, streak } = useLogs();
  const { settings } = useSettings();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load cached recommendation
  useEffect(() => {
    getTodayRec(todayId()).then(r => { if (r) setRecommendation(r); });
  }, []);

  const fetchRecommendation = async () => {
    if (!settings.claudeApiKey) {
      setRecommendation('Add your Claude API key in Settings to get AI recommendations.');
      return;
    }
    setRecLoading(true);
    try {
      const rec = await getTodayRecommendation(settings.claudeApiKey, todayLog, recentLogs);
      setRecommendation(rec);
      await saveTodayRec(todayId(), rec);
    } catch {
      setRecommendation('Could not generate recommendation. Check your API key.');
    } finally {
      setRecLoading(false);
    }
  };

  const log = todayLog;

  // Compute weekly averages from recentLogs
  const weekAvg = recentLogs.length > 0 ? {
    focus: +(recentLogs.reduce((s, l) => s + l.output.focusRating, 0) / recentLogs.length).toFixed(1),
    energy: +(recentLogs.reduce((s, l) => s + l.output.energyRating, 0) / recentLogs.length).toFixed(1),
    tasks: +(recentLogs.reduce((s, l) => s + l.output.tasksCompleted, 0) / recentLogs.length).toFixed(1),
  } : null;

  // Best and worst days
  const bestDay = recentLogs.length > 0
    ? recentLogs.reduce((best, l) => (l.output.focusRating + l.output.energyRating) > (best.output.focusRating + best.output.energyRating) ? l : best)
    : null;

  // Mini trend bars data (last 7 days)
  const trendDays = [...recentLogs].sort((a, b) => a.id.localeCompare(b.id));

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
          {/* Header */}
          <Text style={[TYPOGRAPHY.label, { color: COLORS.textMuted, marginBottom: SPACING.xs }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </Text>
          <Text style={[TYPOGRAPHY.hero, { color: COLORS.text, marginBottom: SPACING.xl }]}>Today</Text>

          {/* Streak */}
          <StreakCounter streak={streak} />

          {/* AI Recommendation */}
          <View style={{ marginTop: SPACING.lg }}>
            <RecommendationBanner
              recommendation={recommendation}
              isLoading={recLoading}
              onRefresh={fetchRecommendation}
            />
          </View>

          {/* Today's stats cards */}
          {log && (
            <>
              <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.textSecondary, marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
                Today's Metrics
              </Text>
              <View style={styles.statsRow}>
                <GradientCard style={styles.statCard} colors={COLORS.gradients.focus}>
                  <Text style={styles.statLabel}>FOCUS</Text>
                  <AnimatedNumber
                    value={log.output.focusRating}
                    style={[styles.statValue, { color: COLORS.accent }]}
                  />
                  <Text style={styles.statUnit}>/10</Text>
                </GradientCard>
                <GradientCard style={styles.statCard} colors={COLORS.gradients.energy}>
                  <Text style={styles.statLabel}>ENERGY</Text>
                  <AnimatedNumber
                    value={log.output.energyRating}
                    style={[styles.statValue, { color: COLORS.warning }]}
                  />
                  <Text style={styles.statUnit}>/10</Text>
                </GradientCard>
                <GradientCard style={styles.statCard} colors={COLORS.gradients.success}>
                  <Text style={styles.statLabel}>TASKS</Text>
                  <AnimatedNumber
                    value={log.output.tasksCompleted}
                    style={[styles.statValue, { color: COLORS.success }]}
                  />
                  <Text style={styles.statUnit}>done</Text>
                </GradientCard>
              </View>

              {/* Input pills */}
              <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.textSecondary, marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
                Today's Inputs
              </Text>
              <View style={styles.pillsWrap}>
                <SummaryPill
                  icon="cafe-outline"
                  label="Caffeine"
                  value={log.caffeine.type === 'none' ? 'None' : `${log.caffeine.type} · ${log.caffeine.amount}mg`}
                  color={COLORS.warning}
                />
                <SummaryPill
                  icon="barbell-outline"
                  label="Workout"
                  value={log.workout.type === 'none' ? 'Rest' : `${log.workout.type} · ${log.workout.intensity}/10`}
                  color={COLORS.accent}
                />
                <SummaryPill
                  icon="musical-notes-outline"
                  label="Music"
                  value={log.music.join(', ')}
                  color={COLORS.accentAlt}
                />
                <SummaryPill
                  icon="water-outline"
                  label="Hydration"
                  value={`${log.nutrition.hydration} glasses`}
                  color={COLORS.accentAlt}
                />
                <SummaryPill
                  icon="restaurant-outline"
                  label="Nutrition"
                  value={`Meal quality ${log.nutrition.mealQuality}/5`}
                  color={COLORS.success}
                />
              </View>
            </>
          )}

          {/* Weekly Trends Section — always shown when we have recent data */}
          {recentLogs.length > 0 && weekAvg && (
            <>
              <SectionLabel label="7-Day Overview" style={{ marginTop: SPACING.xl }} />

              {/* Weekly averages */}
              <View style={styles.statsRow}>
                <GradientCard style={styles.avgCard}>
                  <Text style={styles.avgLabel}>AVG FOCUS</Text>
                  <Text style={[styles.avgValue, { color: COLORS.accent }]}>{weekAvg.focus}</Text>
                  <Text style={styles.avgUnit}>/10</Text>
                </GradientCard>
                <GradientCard style={styles.avgCard}>
                  <Text style={styles.avgLabel}>AVG ENERGY</Text>
                  <Text style={[styles.avgValue, { color: COLORS.warning }]}>{weekAvg.energy}</Text>
                  <Text style={styles.avgUnit}>/10</Text>
                </GradientCard>
                <GradientCard style={styles.avgCard}>
                  <Text style={styles.avgLabel}>AVG TASKS</Text>
                  <Text style={[styles.avgValue, { color: COLORS.success }]}>{weekAvg.tasks}</Text>
                  <Text style={styles.avgUnit}>/day</Text>
                </GradientCard>
              </View>

              {/* Mini trend bars */}
              <GradientCard style={{ marginTop: SPACING.md }}>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted, marginBottom: SPACING.md }]}>
                  FOCUS TREND
                </Text>
                <View style={styles.trendRow}>
                  {trendDays.map(day => {
                    const pct = (day.output.focusRating / 10) * 100;
                    const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                    return (
                      <View key={day.id} style={styles.trendCol}>
                        <View style={styles.barContainer}>
                          <View style={[styles.bar, { height: `${pct}%`, backgroundColor: COLORS.accent }]} />
                        </View>
                        <Text style={styles.trendLabel}>{dayLabel}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted, marginBottom: SPACING.md, marginTop: SPACING.lg }]}>
                  ENERGY TREND
                </Text>
                <View style={styles.trendRow}>
                  {trendDays.map(day => {
                    const pct = (day.output.energyRating / 10) * 100;
                    const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                    return (
                      <View key={day.id} style={styles.trendCol}>
                        <View style={styles.barContainer}>
                          <View style={[styles.bar, { height: `${pct}%`, backgroundColor: COLORS.warning }]} />
                        </View>
                        <Text style={styles.trendLabel}>{dayLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              </GradientCard>

              {/* Best day callout */}
              {bestDay && (
                <GradientCard colors={COLORS.gradients.accent} style={{ marginTop: SPACING.md }}>
                  <Text style={[TYPOGRAPHY.caption, { color: 'rgba(255,255,255,0.6)' }]}>
                    PEAK DAY THIS WEEK
                  </Text>
                  <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text, marginTop: SPACING.xs }]}>
                    {new Date(bestDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                  <View style={styles.peakRow}>
                    <Text style={styles.peakStat}>Focus {bestDay.output.focusRating}/10</Text>
                    <Text style={styles.peakDot}>·</Text>
                    <Text style={styles.peakStat}>Energy {bestDay.output.energyRating}/10</Text>
                    <Text style={styles.peakDot}>·</Text>
                    <Text style={styles.peakStat}>{bestDay.output.tasksCompleted} tasks</Text>
                  </View>
                  <View style={[styles.pillsWrap, { marginTop: SPACING.sm }]}>
                    {bestDay.caffeine.type !== 'none' && (
                      <View style={styles.peakPill}>
                        <Text style={styles.peakPillText}>☕ {bestDay.caffeine.type} {bestDay.caffeine.amount}mg</Text>
                      </View>
                    )}
                    {bestDay.workout.type !== 'none' && (
                      <View style={styles.peakPill}>
                        <Text style={styles.peakPillText}>💪 {bestDay.workout.type}</Text>
                      </View>
                    )}
                    {(bestDay.tags || []).slice(0, 3).map(t => (
                      <View key={t} style={styles.peakPill}>
                        <Text style={styles.peakPillText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </GradientCard>
              )}
            </>
          )}

          {/* Empty state — only when truly no data */}
          {!log && recentLogs.length === 0 && !loading && (
            <GradientCard style={{ marginTop: SPACING.xl, alignItems: 'center', paddingVertical: SPACING.xl }}>
              <Text style={{ fontSize: 40, marginBottom: SPACING.md }}>📋</Text>
              <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text, textAlign: 'center' }]}>
                No entry yet today
              </Text>
              <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs }]}>
                Head to the Log tab to track your day
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    marginBottom: SPACING.xs,
  } as object,
  statValue: {
    ...TYPOGRAPHY.hero,
    lineHeight: 40,
  } as object,
  statUnit: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.5)',
  } as object,
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  // Weekly averages
  avgCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  avgLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    fontSize: 8,
    marginBottom: SPACING.xs,
  } as object,
  avgValue: {
    ...TYPOGRAPHY.title,
    lineHeight: 28,
  } as object,
  avgUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  } as object,
  // Trend bars
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  trendCol: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  barContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: RADIUS.sm,
    minHeight: 4,
  },
  trendLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 9,
  } as object,
  // Peak day
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  peakStat: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  } as object,
  peakDot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  peakPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  peakPillText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  } as object,
});
