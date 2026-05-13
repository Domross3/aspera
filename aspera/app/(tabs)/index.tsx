import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogs } from "../../src/hooks/useLogs";
import { useSettings } from "../../src/hooks/useSettings";
import { getTodayRec, saveTodayRec } from "../../src/storage/storage";
import {
  getMorningBriefing,
  generateAnxiousReappraisal,
} from "../../src/api/claude";
import { generateCohortTelemetry } from "../../src/lib/mockData";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import SomaticInterceptor from "../../src/components/interceptor/SomaticInterceptor";
import GradientCard from "../../src/components/common/GradientCard";
import SummaryPill from "../../src/components/today/SummaryPill";
import RecommendationBanner from "../../src/components/today/RecommendationBanner";
import StreakCounter from "../../src/components/today/StreakCounter";
import SectionLabel from "../../src/components/common/SectionLabel";
import SpotifyRecent from "../../src/components/today/SpotifyRecent";
import BrowsingFocus from "../../src/components/today/BrowsingFocus";
import ScreenTimeCard from "../../src/components/today/ScreenTimeCard";
import MusicGenreInsight from "../../src/components/today/MusicGenreInsight";
import TodayBigRocks from "../../src/components/today/TodayBigRocks";
import TrendLineCard, {
  TrendPoint,
} from "../../src/components/common/TrendLineCard";
import { DailyLog } from "../../src/types";

function todayId() {
  return new Date().toISOString().split("T")[0];
}
function shortDayLabel(date: string) {
  return new Date(`${date}T12:00:00`)
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 2);
}

function defaultLogShell(): DailyLog {
  const id = new Date().toISOString().split("T")[0];
  return {
    id,
    date: id,
    createdAt: Date.now(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    output: { tasksCompleted: 0, focusRating: 5, energyRating: 5 },
    tags: [],
    bigRocks: [],
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
  };
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todayLog, recentLogs, loading, save, streak, reservesRemaining } =
    useLogs();
  const { settings } = useSettings();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Somatic Interceptor state
  const [interceptorVisible, setInterceptorVisible] = useState(false);
  const [reappraisal, setReappraisal] = useState<string | null>(null);
  const [reappraisalLoading, setReappraisalLoading] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5-minute idle timer — triggers interceptor if no task activity
  useEffect(() => {
    const IDLE_MS = 5 * 60 * 1000;
    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!interceptorVisible) setInterceptorVisible(true);
      }, IDLE_MS);
    };
    resetTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [todayLog?.output.tasksCompleted]);

  const handleInterceptorFeeling = async (feeling: string) => {
    setReappraisalLoading(true);
    try {
      const bigRocks = todayLog?.bigRocks ?? [];
      const cohort = generateCohortTelemetry({
        missedBigRock:
          bigRocks.length > 0 && (todayLog?.output.tasksCompleted ?? 0) === 0,
        avgFocus: todayLog?.output.focusRating ?? 5,
        avgSleep: 7,
        streak,
        avgEnergy: todayLog?.output.energyRating ?? 5,
      });
      const result = await generateAnxiousReappraisal(
        feeling,
        bigRocks,
        cohort,
      );
      setReappraisal(result);
    } catch {
      setReappraisal(
        "What you are feeling is shared by thousands right now. Place both feet flat on the floor, press your palms together for five seconds, then release.",
      );
    } finally {
      setReappraisalLoading(false);
    }
  };

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
    getTodayRec(todayId()).then((r) => {
      if (r) setRecommendation(r);
    });
  }, []);

  const fetchRecommendation = async () => {
    setRecLoading(true);
    try {
      const rec = await getMorningBriefing(todayLog, recentLogs);
      setRecommendation(rec);
      await saveTodayRec(todayId(), rec);
    } catch {
      setRecommendation(
        "Couldn't reach the AI just now. Try again in a moment.",
      );
    } finally {
      setRecLoading(false);
    }
  };

  const log = todayLog;

  // Compute weekly averages from recentLogs
  const weekAvg =
    recentLogs.length > 0
      ? {
          focus: +(
            recentLogs.reduce((s, l) => s + l.output.focusRating, 0) /
            recentLogs.length
          ).toFixed(1),
          energy: +(
            recentLogs.reduce((s, l) => s + l.output.energyRating, 0) /
            recentLogs.length
          ).toFixed(1),
          tasks: +(
            recentLogs.reduce((s, l) => s + l.output.tasksCompleted, 0) /
            recentLogs.length
          ).toFixed(1),
        }
      : null;

  // Best and worst days
  const bestDay =
    recentLogs.length > 0
      ? recentLogs.reduce((best, l) =>
          l.output.focusRating + l.output.energyRating >
          best.output.focusRating + best.output.energyRating
            ? l
            : best,
        )
      : null;

  const trendDays = [...recentLogs].sort((a, b) => a.id.localeCompare(b.id));
  const focusTrend: TrendPoint[] = trendDays.map((day) => ({
    label: shortDayLabel(day.date),
    value: day.output.focusRating,
  }));
  const energyTrend: TrendPoint[] = trendDays.map((day) => ({
    label: shortDayLabel(day.date),
    value: day.output.energyRating,
  }));

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + SPACING.lg,
              paddingBottom: insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text
            style={[
              TYPOGRAPHY.label,
              { color: COLORS.textMuted, marginBottom: SPACING.xs },
            ]}
          >
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: SPACING.xl,
            }}
          >
            <Text style={[TYPOGRAPHY.hero, { color: COLORS.text }]}>Today</Text>
            {/* Hidden demo trigger for Somatic Interceptor — invisible 44x44 tap target */}
            <TouchableOpacity
              onLongPress={() => {
                setReappraisal(null);
                setInterceptorVisible(true);
              }}
              delayLongPress={500}
              style={{ width: 44, height: 44, opacity: 0 }}
              activeOpacity={0}
            />
          </View>

          {/* AI Recommendation */}
          <RecommendationBanner
            recommendation={recommendation}
            isLoading={recLoading}
            onRefresh={fetchRecommendation}
          />

          {/* Big Rocks — morning anchor, editable inline */}
          <TodayBigRocks
            todayRocks={log?.bigRocks ?? []}
            recentLogs={recentLogs}
            onChange={async (rocks) => {
              const base = log ?? defaultLogShell();
              await save({ ...base, bigRocks: rocks });
            }}
          />

          {/* Weekly metrics */}
          {trendDays.length > 0 && weekAvg && (
            <>
              <SectionLabel
                label="This Week's Metrics"
                style={{ marginTop: SPACING.xl }}
              />
              <TrendLineCard
                title="Focus"
                subtitle={`${trendDays.length}-day trendline with weekly average`}
                accentColor={COLORS.accent}
                points={focusTrend}
                maxValue={10}
                formatValue={(value) => value.toFixed(1)}
              />
              <TrendLineCard
                title="Energy"
                subtitle={`${trendDays.length}-day trendline with weekly average`}
                accentColor={COLORS.warning}
                points={energyTrend}
                maxValue={10}
                formatValue={(value) => value.toFixed(1)}
              />
            </>
          )}

          {/* Best day callout */}
          {bestDay && (
            <GradientCard
              colors={COLORS.gradients.accent}
              style={{ marginTop: SPACING.md }}
            >
              <Text
                style={[TYPOGRAPHY.caption, { color: "rgba(255,255,255,0.6)" }]}
              >
                PEAK DAY THIS WEEK
              </Text>
              <Text
                style={[
                  TYPOGRAPHY.subtitle,
                  { color: COLORS.text, marginTop: SPACING.xs },
                ]}
              >
                {new Date(bestDay.date + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "short", day: "numeric" },
                )}
              </Text>
              <View style={styles.peakRow}>
                <Text style={styles.peakStat}>
                  Focus {bestDay.output.focusRating}/10
                </Text>
                <Text style={styles.peakDot}>·</Text>
                <Text style={styles.peakStat}>
                  Energy {bestDay.output.energyRating}/10
                </Text>
                <Text style={styles.peakDot}>·</Text>
                <Text style={styles.peakStat}>
                  {bestDay.output.tasksCompleted} tasks
                </Text>
              </View>
              <View style={[styles.pillsWrap, { marginTop: SPACING.sm }]}>
                {bestDay.caffeine.type !== "none" && (
                  <View style={styles.peakPill}>
                    <Text style={styles.peakPillText}>
                      ☕ {bestDay.caffeine.type} {bestDay.caffeine.amount}mg
                    </Text>
                  </View>
                )}
                {bestDay.workout.type !== "none" && (
                  <View style={styles.peakPill}>
                    <Text style={styles.peakPillText}>
                      💪 {bestDay.workout.type}
                    </Text>
                  </View>
                )}
                {(bestDay.tags || []).slice(0, 3).map((t) => (
                  <View key={t} style={styles.peakPill}>
                    <Text style={styles.peakPillText}>{t}</Text>
                  </View>
                ))}
              </View>
            </GradientCard>
          )}

          {/* Integration mocks (Spotify, browsing, screen time) are demo-only
              scaffolding for real API connections that haven't shipped yet.
              Hide in production builds; show in dev so we can keep iterating
              on the cards. Real integrations will gate by connection status. */}
          {__DEV__ && (
            <>
              <View style={{ marginTop: SPACING.xl }}>
                <SpotifyRecent />
              </View>

              {/* Genre insight — derived from recent logs, always shown if music data exists */}
              {(() => {
                const genres =
                  log?.music ??
                  recentLogs
                    .flatMap((l) => l.music)
                    .filter((g) => g !== "none");
                const unique = [...new Set(genres)];
                return unique.length > 0 ? (
                  <MusicGenreInsight
                    currentGenres={unique}
                    recentLogs={recentLogs}
                  />
                ) : null;
              })()}

              <View style={{ marginTop: SPACING.lg }}>
                <BrowsingFocus />
              </View>

              <View style={{ marginTop: SPACING.lg }}>
                <ScreenTimeCard />
              </View>
            </>
          )}

          {/* Inputs go lower in the layout */}
          {log && (
            <>
              <SectionLabel
                label="Today's Inputs"
                style={{ marginTop: SPACING.xl }}
              />
              <View style={styles.pillsWrap}>
                <SummaryPill
                  icon="cafe-outline"
                  label="Caffeine"
                  value={
                    log.caffeine.type === "none"
                      ? "None"
                      : `${log.caffeine.type} · ${log.caffeine.amount}mg`
                  }
                  color={COLORS.warning}
                />
                <SummaryPill
                  icon="barbell-outline"
                  label="Workout"
                  value={
                    log.workout.type === "none"
                      ? "Rest"
                      : `${log.workout.type} · ${log.workout.intensity}/10`
                  }
                  color={COLORS.accent}
                />
                <SummaryPill
                  icon="musical-notes-outline"
                  label="Music"
                  value={log.music.join(", ")}
                  color={COLORS.accentAlt}
                />
              </View>

              <View style={styles.pillsWrap}>
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
                {(log.sleepHours ?? 0) > 0 && (
                  <SummaryPill
                    icon="moon-outline"
                    label="Sleep"
                    value={`${log.sleepHours}h`}
                    color={COLORS.accentAlt}
                  />
                )}
                {(log.daylightMinutes ?? 0) > 0 && (
                  <SummaryPill
                    icon="sunny-outline"
                    label="Daylight"
                    value={`${log.daylightMinutes}m`}
                    color={COLORS.warning}
                  />
                )}
                {(log.drinks ?? 0) > 0 && (
                  <SummaryPill
                    icon="wine-outline"
                    label="Drinks"
                    value={`${log.drinks}`}
                    color={COLORS.danger}
                  />
                )}
              </View>
            </>
          )}

          {/* Empty state — only when truly no data */}
          {!log && recentLogs.length === 0 && !loading && (
            <GradientCard
              style={{
                marginTop: SPACING.xl,
                alignItems: "center",
                paddingVertical: SPACING.xl,
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: SPACING.md }}>📋</Text>
              <Text
                style={[
                  TYPOGRAPHY.subtitle,
                  { color: COLORS.text, textAlign: "center" },
                ]}
              >
                No entry yet today
              </Text>
              <Text
                style={[
                  TYPOGRAPHY.body,
                  {
                    color: COLORS.textSecondary,
                    textAlign: "center",
                    marginTop: SPACING.xs,
                  },
                ]}
              >
                Head to the Log tab to track your day
              </Text>
            </GradientCard>
          )}

          {(log || recentLogs.length > 0) && (
            <View style={{ marginTop: SPACING.xl }}>
              <StreakCounter
                streak={streak}
                reservesRemaining={reservesRemaining}
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <SomaticInterceptor
        visible={interceptorVisible}
        onDismiss={() => {
          setInterceptorVisible(false);
          setReappraisal(null);
        }}
        onSubmitFeeling={handleInterceptorFeeling}
        reappraisal={reappraisal}
        reappraisalLoading={reappraisalLoading}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  // Peak day
  peakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  peakStat: {
    ...TYPOGRAPHY.caption,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  } as object,
  peakDot: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  peakPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  peakPillText: {
    ...TYPOGRAPHY.caption,
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
  } as object,
});
