import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  EventTypeDef,
  Moment,
  MoodCheckIn,
  MOOD_EMOJIS,
  ENERGY_EMOJIS,
  STRESS_EMOJIS,
} from "../../src/types";
import {
  getRecentMoodCheckIns,
  saveMoodCheckIn,
  saveMoment,
  getRecentMoments,
  replaceCachedMoodCheckIns,
  replaceCachedMoments,
} from "../../src/storage/storage";
import {
  fetchRecentMoodCheckIns,
  fetchRecentMoments,
  insertMoodCheckIn,
  insertMoment,
} from "../../src/lib/cloudStore";
import MomentCapture from "../../src/components/mood/MomentCapture";
import MoodPad from "../../src/components/mood/MoodPad";
import { useAuth } from "../../src/hooks/useAuth";
import { useSettings } from "../../src/hooks/useSettings";
import {
  detectPromotionCandidate,
  normalizeForDismissal,
} from "../../src/lib/momentPromotion";
import SchemaBuilder from "../../src/components/log/SchemaBuilder";
import { SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useThemedStyles } from "../../src/theme/useThemedStyles";
import type { AsperaColors } from "../../src/theme/ThemeProvider";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import TrendLineCard, {
  TrendPoint,
} from "../../src/components/common/TrendLineCard";
import TimeOfDayCurve from "../../src/components/mood/TimeOfDayCurve";
import { moodPadPointToCheckIn, MoodPadPoint } from "../../src/lib/moodPad";

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
  return new Date().toISOString().split("T")[0];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatCaptureTime(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function aggregateDailySnapshots(checkins: MoodCheckIn[]): DailyMoodSnapshot[] {
  const byDate: Record<string, MoodCheckIn[]> = {};

  for (const checkin of checkins) {
    const date = new Date(checkin.timestamp).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(checkin);
  }

  return Object.entries(byDate)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-14)
    .map(([date, entries]) => ({
      date,
      dayLabel: new Date(`${date}T12:00:00`)
        .toLocaleDateString("en-US", { weekday: "short" })
        .slice(0, 2),
      avgMood: round(average(entries.map((entry) => entry.mood))),
      avgEnergy: round(average(entries.map((entry) => entry.energy))),
      avgStress: round(average(entries.map((entry) => entry.stress))),
      count: entries.length,
      notes: entries
        .map((entry) => entry.note)
        .filter((note): note is string => Boolean(note)),
    }));
}

function buildTrend(
  points: DailyMoodSnapshot[],
  key: "avgMood" | "avgEnergy" | "avgStress",
  windowDays = 7,
): TrendPoint[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);

  const result: TrendPoint[] = [];
  for (let daysAgo = windowDays - 1; daysAgo >= 0; daysAgo--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    const label = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 2);
    const snap = byDate.get(dateStr);
    result.push({
      label,
      value: snap ? snap[key] : null,
    });
  }
  return result;
}

type TimelineItem =
  | { kind: "mood"; data: MoodCheckIn }
  | { kind: "moment"; data: Moment };

function buildPromotionSeed(label: string): EventTypeDef {
  return {
    id: `t-${Math.random().toString(36).slice(2, 10)}`,
    name: label,
    cardinality: "recurrent",
    fields: [],
    createdAt: Date.now(),
  };
}

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [recentCheckins, setRecentCheckins] = useState<MoodCheckIn[]>([]);
  const [recentMoments, setRecentMoments] = useState<Moment[]>([]);
  const [momentSheetVisible, setMomentSheetVisible] = useState(false);
  const [moodPadSaving, setMoodPadSaving] = useState(false);
  const [promotionDraft, setPromotionDraft] = useState<EventTypeDef | null>(
    null,
  );

  const loadCheckins = useCallback(async () => {
    if (!session) {
      const [recent, moments] = await Promise.all([
        getRecentMoodCheckIns(14),
        getRecentMoments(14),
      ]);
      setRecentCheckins(recent);
      setRecentMoments(moments);
      return;
    }

    try {
      const [cloudCheckins, cloudMoments] = await Promise.all([
        fetchRecentMoodCheckIns(session.user.id, 100),
        fetchRecentMoments(session.user.id, 100),
      ]);
      setRecentCheckins(cloudCheckins);
      setRecentMoments(cloudMoments);
      void Promise.all([
        replaceCachedMoodCheckIns(cloudCheckins),
        replaceCachedMoments(cloudMoments),
      ]).catch((err) =>
        console.warn("[mood] cache warm failed (non-fatal)", err),
      );
    } catch (err) {
      console.warn("[mood] cloud fetch failed, falling back to cache", err);
      const [recent, moments] = await Promise.all([
        getRecentMoodCheckIns(14),
        getRecentMoments(14),
      ]);
      setRecentCheckins(recent);
      setRecentMoments(moments);
    }
  }, [session]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  const snapshots = useMemo(
    () => aggregateDailySnapshots(recentCheckins),
    [recentCheckins],
  );
  const summary = useMemo(() => {
    if (snapshots.length === 0) return null;

    return {
      mood: round(average(snapshots.map((snapshot) => snapshot.avgMood))),
      energy: round(average(snapshots.map((snapshot) => snapshot.avgEnergy))),
      stress: round(average(snapshots.map((snapshot) => snapshot.avgStress))),
    };
  }, [snapshots]);

  const todayCaptureCount = useMemo(
    () =>
      recentCheckins.filter(
        (checkin) =>
          new Date(checkin.timestamp).toISOString().split("T")[0] === todayId(),
      ).length,
    [recentCheckins],
  );

  const promotionCandidate = useMemo(
    () =>
      detectPromotionCandidate(
        recentMoments,
        settings.dismissedPromotions ?? [],
      ),
    [recentMoments, settings.dismissedPromotions],
  );

  const handlePromotionAccept = () => {
    if (!promotionCandidate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPromotionDraft(buildPromotionSeed(promotionCandidate.label));
  };

  const handlePromotionDismiss = async () => {
    if (!promotionCandidate) return;
    const dismissed = settings.dismissedPromotions ?? [];
    const next = [
      ...dismissed,
      normalizeForDismissal(promotionCandidate.label),
    ];
    await updateSettings({ dismissedPromotions: next });
  };

  const handlePromotionSave = async (next: EventTypeDef) => {
    const existing = settings.eventTypes ?? [];
    await updateSettings({ eventTypes: [...existing, next] });
    setPromotionDraft(null);
    router.navigate("/(tabs)/log" as never);
  };

  const recentEntries = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...recentCheckins.map((c) => ({ kind: "mood" as const, data: c })),
      ...recentMoments.map((m) => ({ kind: "moment" as const, data: m })),
    ];
    items.sort((a, b) => b.data.timestamp - a.data.timestamp);
    return items.slice(0, 6);
  }, [recentCheckins, recentMoments]);

  const moodTrend = useMemo(
    () => buildTrend(snapshots, "avgMood"),
    [snapshots],
  );
  const energyTrend = useMemo(
    () => buildTrend(snapshots, "avgEnergy"),
    [snapshots],
  );
  const stressTrend = useMemo(
    () => buildTrend(snapshots, "avgStress"),
    [snapshots],
  );

  const handleMomentSave = async (moment: Moment) => {
    await saveMoment(moment);
    if (session) {
      insertMoment(session.user.id, moment).catch((err) => {
        console.warn("[mood] cloud moment sync failed; cached locally", err);
      });
    }
    setMomentSheetVisible(false);
    await loadCheckins();
  };

  const handleMoodPadSave = async (point: MoodPadPoint) => {
    if (moodPadSaving) return;
    setMoodPadSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const checkIn = moodPadPointToCheckIn(point);
      await saveMoodCheckIn(checkIn);
      if (session) {
        insertMoodCheckIn(session.user.id, checkIn).catch((err) => {
          console.warn("[mood-pad] cloud sync failed; cached locally", err);
        });
      }
      await loadCheckins();
    } finally {
      setMoodPadSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={colors.gradients.background as [string, string]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.lg,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            TYPOGRAPHY.hero,
            { color: colors.text, marginBottom: SPACING.xs },
          ]}
        >
          Mood
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: colors.textSecondary, marginBottom: SPACING.xl },
          ]}
        >
          Track how you trend over time, then capture moments when something
          shifts.
        </Text>

        <MoodPad saving={moodPadSaving} onSave={handleMoodPadSave} />

        {summary ? (
          <>
            <GradientCard colors={colors.gradients.accent}>
              <Text style={styles.overviewEyebrow}>OVER TIME</Text>
              <Text style={styles.overviewTitle}>
                {todayCaptureCount > 0
                  ? `${todayCaptureCount} capture${todayCaptureCount > 1 ? "s" : ""} logged today`
                  : "No capture yet today"}
              </Text>
              <Text style={styles.overviewBody}>
                The averages below update from your recent check-ins so the page
                reads like a trend dashboard, not a one-off form.
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>
                    {summary.mood.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg mood</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>
                    {summary.energy.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg energy</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.summaryValue}>
                    {summary.stress.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg stress</Text>
                </View>
              </View>
            </GradientCard>

            <SectionLabel
              label="Mood Over Time"
              style={{ marginTop: SPACING.xl }}
            />
            <TrendLineCard
              title="Mood"
              subtitle="Daily average across your recent captures"
              accentColor={colors.success}
              points={moodTrend}
              maxValue={5}
              formatValue={(value) => value.toFixed(1)}
            />
            <TrendLineCard
              title="Energy"
              subtitle="Where your momentum has been landing"
              accentColor={colors.warning}
              points={energyTrend}
              maxValue={5}
              formatValue={(value) => value.toFixed(1)}
            />
            <TrendLineCard
              title="Stress"
              subtitle="Pressure level over the same stretch"
              accentColor={colors.danger}
              points={stressTrend}
              maxValue={5}
              formatValue={(value) => value.toFixed(1)}
            />

            <SectionLabel
              label="Time of Day"
              style={{ marginTop: SPACING.xl }}
            />
            <TimeOfDayCurve checkins={recentCheckins} />
          </>
        ) : (
          <GradientCard style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>No mood trend yet</Text>
            <Text style={styles.emptyBody}>
              Add a few quick captures below and this tab will turn into a
              time-based dashboard.
            </Text>
          </GradientCard>
        )}

        {promotionCandidate ? (
          <View style={styles.promotionBanner}>
            <View style={styles.promotionRow}>
              <Ionicons
                name="trending-up"
                size={18}
                color={colors.accent}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.promotionTitle}>Track this for real?</Text>
                <Text style={styles.promotionBody}>
                  You've logged{" "}
                  <Text style={styles.promotionLabel}>
                    "{promotionCandidate.label}"
                  </Text>{" "}
                  {promotionCandidate.count} times in the last 2 weeks. Want to
                  turn it into a structured metric on your daily log?
                </Text>
              </View>
            </View>
            <View style={styles.promotionActions}>
              <TouchableOpacity
                onPress={() => void handlePromotionDismiss()}
                activeOpacity={0.7}
                style={styles.promotionSecondary}
                hitSlop={4}
              >
                <Text style={styles.promotionSecondaryText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePromotionAccept}
                activeOpacity={0.85}
                style={styles.promotionPrimary}
                hitSlop={4}
              >
                <Text style={styles.promotionPrimaryText}>Set it up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.recentHeaderRow}>
          <SectionLabel
            label="Recent Captures"
            style={{ marginTop: SPACING.xl }}
          />
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMomentSheetVisible(true);
            }}
            activeOpacity={0.7}
            style={styles.momentButton}
          >
            <Ionicons name="add-circle" size={16} color={colors.accent} />
            <Text style={styles.momentButtonText}>Moment</Text>
          </TouchableOpacity>
        </View>
        {recentEntries.length === 0 ? (
          <GradientCard style={{ marginBottom: SPACING.sm }}>
            <Text style={styles.captureNote}>
              No captures yet. Log a mood pulse below or tap "Moment" to note
              something that just happened.
            </Text>
          </GradientCard>
        ) : (
          recentEntries.map((item) => {
            if (item.kind === "mood") {
              const entry = item.data;
              return (
                <GradientCard
                  key={`mood-${entry.id}`}
                  style={{ marginBottom: SPACING.sm }}
                >
                  <View style={styles.captureRow}>
                    <View style={styles.captureMoodRow}>
                      <Text style={styles.captureEmoji}>
                        {MOOD_EMOJIS[Math.round(entry.mood)]}
                      </Text>
                      <Text style={styles.captureEmoji}>
                        {ENERGY_EMOJIS[Math.round(entry.energy)]}
                      </Text>
                      <Text style={styles.captureEmoji}>
                        {STRESS_EMOJIS[Math.round(entry.stress)]}
                      </Text>
                    </View>
                    <Text style={styles.captureTime}>
                      {formatCaptureTime(entry.timestamp)}
                    </Text>
                  </View>
                  {entry.note ? (
                    <Text style={styles.captureNote}>{entry.note}</Text>
                  ) : null}
                </GradientCard>
              );
            }
            const m = item.data;
            return (
              <GradientCard
                key={`moment-${m.id}`}
                style={{ marginBottom: SPACING.sm }}
              >
                <View style={styles.captureRow}>
                  <View style={styles.momentLabelRow}>
                    <Ionicons name="bookmark" size={14} color={colors.accent} />
                    <Text style={styles.momentLabel}>{m.label}</Text>
                    {typeof m.duration === "number" ? (
                      <Text style={styles.momentDuration}>
                        · {formatDuration(m.duration)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.captureTime}>
                    {formatCaptureTime(m.timestamp)}
                  </Text>
                </View>
                {m.note ? (
                  <Text style={styles.captureNote}>{m.note}</Text>
                ) : null}
              </GradientCard>
            );
          })
        )}
      </ScrollView>

      <MomentCapture
        visible={momentSheetVisible}
        onCancel={() => setMomentSheetVisible(false)}
        onSave={handleMomentSave}
      />

      <SchemaBuilder
        visible={promotionDraft !== null}
        initial={promotionDraft}
        fieldsWithData={new Set<string>()}
        hasEntries={false}
        onCancel={() => setPromotionDraft(null)}
        onSave={(next) => void handlePromotionSave(next)}
      />
    </LinearGradient>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: SPACING.lg },
    overviewEyebrow: {
      ...TYPOGRAPHY.label,
      color: "rgba(255,255,255,0.65)",
      marginBottom: SPACING.xs,
    } as object,
    overviewTitle: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
    } as object,
    overviewBody: {
      ...TYPOGRAPHY.body,
      color: "rgba(255,255,255,0.78)",
      marginTop: SPACING.sm,
      lineHeight: 20,
    } as object,
    summaryRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    summaryTile: {
      flex: 1,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    summaryValue: {
      ...TYPOGRAPHY.title,
      color: c.text,
    } as object,
    summaryLabel: {
      ...TYPOGRAPHY.caption,
      color: "rgba(255,255,255,0.72)",
      marginTop: 2,
    } as object,
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
    },
    emptyEmoji: {
      fontSize: 42,
      marginBottom: SPACING.md,
    },
    emptyTitle: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
      textAlign: "center",
    } as object,
    emptyBody: {
      ...TYPOGRAPHY.body,
      color: c.textSecondary,
      textAlign: "center",
      marginTop: SPACING.xs,
    } as object,
    captureRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: SPACING.md,
    },
    captureMoodRow: {
      flexDirection: "row",
      gap: SPACING.xs,
    },
    momentLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      flex: 1,
    },
    momentLabel: {
      ...TYPOGRAPHY.body,
      color: c.text,
      fontWeight: "600",
      fontSize: 14,
    } as object,
    momentDuration: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
      fontSize: 12,
    } as object,
    recentHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    momentButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      marginTop: SPACING.xl,
    },
    momentButtonText: {
      ...TYPOGRAPHY.caption,
      color: c.accent,
      fontWeight: "700",
      fontSize: 12,
    } as object,
    promotionBanner: {
      marginTop: SPACING.xl,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: "rgba(108,99,255,0.35)",
      backgroundColor: "rgba(108,99,255,0.08)",
      gap: SPACING.md,
    },
    promotionRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
    },
    promotionTitle: {
      ...TYPOGRAPHY.subtitle,
      color: c.text,
      fontSize: 14,
      marginBottom: 2,
    } as object,
    promotionBody: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    } as object,
    promotionLabel: {
      color: c.accent,
      fontWeight: "700",
    } as object,
    promotionActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: SPACING.sm,
    },
    promotionSecondary: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    promotionSecondaryText: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      fontWeight: "600",
      fontSize: 12,
    } as object,
    promotionPrimary: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
      backgroundColor: c.accent,
    },
    promotionPrimaryText: {
      ...TYPOGRAPHY.caption,
      color: c.text,
      fontWeight: "700",
      fontSize: 12,
    } as object,
    captureEmoji: {
      fontSize: 18,
    },
    captureTime: {
      ...TYPOGRAPHY.caption,
      color: c.textMuted,
    } as object,
    captureNote: {
      ...TYPOGRAPHY.body,
      color: c.textSecondary,
      marginTop: SPACING.sm,
      lineHeight: 20,
    } as object,
  });
