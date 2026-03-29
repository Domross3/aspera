import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MoodCheckIn, MOOD_EMOJIS, ENERGY_EMOJIS, STRESS_EMOJIS } from '../../src/types';
import { saveMoodCheckIn, getRecentMoodCheckIns } from '../../src/storage/storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';
import GradientCard from '../../src/components/common/GradientCard';
import SectionLabel from '../../src/components/common/SectionLabel';
import TrendLineCard, { TrendPoint } from '../../src/components/common/TrendLineCard';

interface DailyMoodSnapshot {
  date: string;
  dayLabel: string;
  avgMood: number;
  avgEnergy: number;
  avgStress: number;
  count: number;
  notes: string[];
}

function todayId(): string {
  return new Date().toISOString().split('T')[0];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function aggregateDailySnapshots(checkins: MoodCheckIn[]): DailyMoodSnapshot[] {
  const byDate: Record<string, MoodCheckIn[]> = {};

  for (const checkin of checkins) {
    const date = new Date(checkin.timestamp).toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(checkin);
  }

  return Object.entries(byDate)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-14)
    .map(([date, entries]) => ({
      date,
      dayLabel: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      avgMood: round(average(entries.map(entry => entry.mood))),
      avgEnergy: round(average(entries.map(entry => entry.energy))),
      avgStress: round(average(entries.map(entry => entry.stress))),
      count: entries.length,
      notes: entries.map(entry => entry.note).filter((note): note is string => Boolean(note)),
    }));
}

function buildTrend(points: DailyMoodSnapshot[], key: 'avgMood' | 'avgEnergy' | 'avgStress'): TrendPoint[] {
  return points.map(point => ({
    label: point.dayLabel,
    value: point[key],
  }));
}

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(1);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<MoodCheckIn[]>([]);

  const loadCheckins = useCallback(async () => {
    const recent = await getRecentMoodCheckIns(14);
    setRecentCheckins(recent);
  }, []);

  useEffect(() => { loadCheckins(); }, [loadCheckins]);

  const snapshots = useMemo(() => aggregateDailySnapshots(recentCheckins), [recentCheckins]);
  const summary = useMemo(() => {
    if (snapshots.length === 0) return null;

    return {
      mood: round(average(snapshots.map(snapshot => snapshot.avgMood))),
      energy: round(average(snapshots.map(snapshot => snapshot.avgEnergy))),
      stress: round(average(snapshots.map(snapshot => snapshot.avgStress))),
    };
  }, [snapshots]);

  const todayCaptureCount = useMemo(
    () => recentCheckins.filter(checkin => new Date(checkin.timestamp).toISOString().split('T')[0] === todayId()).length,
    [recentCheckins]
  );

  const recentEntries = useMemo(
    () => [...recentCheckins].sort((left, right) => right.timestamp - left.timestamp).slice(0, 4),
    [recentCheckins]
  );

  const moodTrend = useMemo(() => buildTrend(snapshots, 'avgMood'), [snapshots]);
  const energyTrend = useMemo(() => buildTrend(snapshots, 'avgEnergy'), [snapshots]);
  const stressTrend = useMemo(() => buildTrend(snapshots, 'avgStress'), [snapshots]);

  const handleSave = async () => {
    const checkIn: MoodCheckIn = {
      id: new Date().toISOString(),
      timestamp: Date.now(),
      mood,
      energy,
      stress,
      note: note.trim() || undefined,
    };

    await saveMoodCheckIn(checkIn);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setNote('');
    await loadCheckins();
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <LinearGradient colors={COLORS.gradients.background as [string, string]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: insets.top + SPACING.lg,
          paddingBottom: insets.bottom + 120,
        }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[TYPOGRAPHY.hero, { color: COLORS.text, marginBottom: SPACING.xs }]}>Mood</Text>
        <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginBottom: SPACING.xl }]}>
          Track how you trend over time, then capture moments when something shifts.
        </Text>

        {summary ? (
          <>
            <GradientCard colors={COLORS.gradients.accent}>
              <Text style={styles.overviewEyebrow}>OVER TIME</Text>
              <Text style={styles.overviewTitle}>
                {todayCaptureCount > 0
                  ? `${todayCaptureCount} capture${todayCaptureCount > 1 ? 's' : ''} logged today`
                  : 'No capture yet today'}
              </Text>
              <Text style={styles.overviewBody}>
                The averages below update from your recent check-ins so the page reads like a trend dashboard, not a one-off form.
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>{summary.mood.toFixed(1)}</Text>
                  <Text style={styles.summaryLabel}>Avg mood</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>{summary.energy.toFixed(1)}</Text>
                  <Text style={styles.summaryLabel}>Avg energy</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>{summary.stress.toFixed(1)}</Text>
                  <Text style={styles.summaryLabel}>Avg stress</Text>
                </View>
              </View>
            </GradientCard>

            <SectionLabel label="Mood Over Time" style={{ marginTop: SPACING.xl }} />
            <TrendLineCard
              title="Mood"
              subtitle="Daily average across your recent captures"
              accentColor={COLORS.success}
              points={moodTrend}
              maxValue={5}
              formatValue={value => value.toFixed(1)}
            />
            <TrendLineCard
              title="Energy"
              subtitle="Where your momentum has been landing"
              accentColor={COLORS.warning}
              points={energyTrend}
              maxValue={5}
              formatValue={value => value.toFixed(1)}
            />
            <TrendLineCard
              title="Stress"
              subtitle="Pressure level over the same stretch"
              accentColor={COLORS.danger}
              points={stressTrend}
              maxValue={5}
              formatValue={value => value.toFixed(1)}
            />
          </>
        ) : (
          <GradientCard style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>No mood trend yet</Text>
            <Text style={styles.emptyBody}>
              Add a few quick captures below and this tab will turn into a time-based dashboard.
            </Text>
          </GradientCard>
        )}

        {recentEntries.length > 0 && (
          <>
            <SectionLabel label="Recent Captures" style={{ marginTop: SPACING.xl }} />
            {recentEntries.map(entry => (
              <GradientCard key={entry.id} style={{ marginBottom: SPACING.sm }}>
                <View style={styles.captureRow}>
                  <View style={styles.captureMoodRow}>
                    <Text style={styles.captureEmoji}>{MOOD_EMOJIS[entry.mood]}</Text>
                    <Text style={styles.captureEmoji}>{ENERGY_EMOJIS[entry.energy]}</Text>
                    <Text style={styles.captureEmoji}>{STRESS_EMOJIS[entry.stress]}</Text>
                  </View>
                  <Text style={styles.captureTime}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    · {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                {entry.note ? <Text style={styles.captureNote}>{entry.note}</Text> : null}
              </GradientCard>
            ))}
          </>
        )}

        <SectionLabel label="Quick Capture" style={{ marginTop: SPACING.xl }} />
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text style={styles.quickIntro}>
            Use this to feed the timeline without treating the whole tab like a log.
          </Text>

          <Text style={styles.scaleSectionLabel}>Mood</Text>
          <EmojiScale
            value={mood}
            onChange={setMood}
            emojis={MOOD_EMOJIS}
            labels={['Awful', 'Low', 'Okay', 'Good', 'Great']}
          />

          <View style={styles.divider} />

          <Text style={styles.scaleSectionLabel}>Energy</Text>
          <EmojiScale
            value={energy}
            onChange={setEnergy}
            emojis={ENERGY_EMOJIS}
            labels={['Drained', 'Tired', 'Steady', 'Fired up', 'Peak']}
          />

          <View style={styles.divider} />

          <Text style={styles.scaleSectionLabel}>Stress</Text>
          <EmojiScale
            value={stress}
            onChange={setStress}
            emojis={STRESS_EMOJIS}
            labels={['Calm', 'Relaxed', 'Tense', 'Anxious', 'Overwhelmed']}
          />

          <View style={styles.divider} />

          <Text style={styles.scaleSectionLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What shifted?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </GradientCard>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
          <LinearGradient
            colors={saved ? COLORS.gradients.success as [string, string] : COLORS.gradients.accent as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {saved ? '✓ Capture Saved' : 'Save Quick Capture'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function EmojiScale({
  value,
  onChange,
  emojis,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  emojis: Record<number, string>;
  labels: string[];
}) {
  return (
    <View>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map(option => {
          const active = option === value;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => {
                onChange(option);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.emojiButton, active && styles.emojiButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.emojiText, active && styles.emojiTextActive]}>
                {emojis[option]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.scaleLabel}>{labels[value - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  overviewEyebrow: {
    ...TYPOGRAPHY.label,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: SPACING.xs,
  } as object,
  overviewTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
  } as object,
  overviewBody: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.78)',
    marginTop: SPACING.sm,
    lineHeight: 20,
  } as object,
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  summaryTile: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  summaryValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
  } as object,
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  } as object,
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    textAlign: 'center',
  } as object,
  emptyBody: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as object,
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  captureMoodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  captureEmoji: {
    fontSize: 18,
  },
  captureTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  captureNote: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  } as object,
  quickIntro: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  } as object,
  scaleSectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  } as object,
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  emojiButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  emojiButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  emojiText: {
    fontSize: 24,
    opacity: 0.5,
  },
  emojiTextActive: {
    fontSize: 28,
    opacity: 1,
  },
  scaleLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as object,
  noteInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 80,
  } as object,
  saveButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: '700',
  } as object,
});
