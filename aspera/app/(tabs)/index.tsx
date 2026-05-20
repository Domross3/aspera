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
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import SomaticInterceptor from "../../src/components/interceptor/SomaticInterceptor";
import GradientCard from "../../src/components/common/GradientCard";
import SummaryPill from "../../src/components/today/SummaryPill";
import RecommendationBanner from "../../src/components/today/RecommendationBanner";
import StreakCounter from "../../src/components/today/StreakCounter";
import SectionLabel from "../../src/components/common/SectionLabel";
import TodayBigRocks from "../../src/components/today/TodayBigRocks";
import PatternsSection from "../../src/components/today/PatternsSection";
import QuickLogTiles from "../../src/components/today/QuickLogTiles";
import TrendLineCard, {
  TrendPoint,
} from "../../src/components/common/TrendLineCard";
import { DailyLog } from "../../src/types";

function todayId() {
  return new Date().toISOString().split("T")[0];
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
    // Not a real rating — this shell exists only so a Big Rock can be
    // attached before the user has opened the Log tab. Excluded from
    // trends/averages until the user rates the day explicitly.
    outputRated: false,
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

  // 5-minute idle timer — triggers interceptor if no task activity.
  // Skipped entirely when the user has disabled the Somatic Interceptor
  // in notification settings (default on).
  const somaticInterceptorEnabled =
    settings.notificationSettings.somaticInterceptorEnabled;
  useEffect(() => {
    if (!somaticInterceptorEnabled) return;
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
  }, [todayLog?.output.tasksCompleted, somaticInterceptorEnabled]);

  const handleInterceptorFeeling = async (feeling: string) => {
    setReappraisalLoading(true);
    try {
      const bigRocks = todayLog?.bigRocks ?? [];
      // Cohort telemetry was a mock data structure ("X other users also
      // missed a Big Rock today"). Until we have a real cohort signal,
      // call the reappraisal without it and let the model speak only
      // from the user's own state.
      const result = await generateAnxiousReappraisal(feeling, bigRocks);
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

  // Only days the user actually rated count toward trends/averages/peak.
  // Auto-seeded shells (Big Rock, quick-log tile) carry `outputRated: false`
  // and their default 5/5/0 values would otherwise pollute every metric.
  // Legacy rows (undefined) are treated as rated so real history survives.
  const ratedLogs = recentLogs.filter((l) => l.outputRated !== false);

  // Compute weekly averages from rated logs
  const weekAvg =
    ratedLogs.length > 0
      ? {
          focus: +(
            ratedLogs.reduce((s, l) => s + l.output.focusRating, 0) /
            ratedLogs.length
          ).toFixed(1),
          energy: +(
            ratedLogs.reduce((s, l) => s + l.output.energyRating, 0) /
            ratedLogs.length
          ).toFixed(1),
          tasks: +(
            ratedLogs.reduce((s, l) => s + l.output.tasksCompleted, 0) /
            ratedLogs.length
          ).toFixed(1),
        }
      : null;

  // Best and worst days
  const bestDay =
    ratedLogs.length > 0
      ? ratedLogs.reduce((best, l) =>
          l.output.focusRating + l.output.energyRating >
          best.output.focusRating + best.output.energyRating
            ? l
            : best,
        )
      : null;

  // Build fixed 7-day rolling windows for the trend cards. Days without a
  // log land as `value: null` so TrendLineCard renders a true gap rather
  // than stretching a sparse trend across the full chart width.
  const logsByDate = new Map(ratedLogs.map((l) => [l.id, l]));
  const trendAnchor = new Date();
  trendAnchor.setHours(12, 0, 0, 0);
  const focusTrend: TrendPoint[] = [];
  const energyTrend: TrendPoint[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = new Date(trendAnchor);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split("T")[0];
    const label = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 2);
    const log = logsByDate.get(dateStr);
    focusTrend.push({
      label,
      value: log ? log.output.focusRating : null,
    });
    energyTrend.push({
      label,
      value: log ? log.output.energyRating : null,
    });
  }

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
            {/* Hidden demo trigger for Somatic Interceptor — invisible 44x44 tap target.
                Disabled (long-press does nothing) when the user has switched the
                interceptor off in settings, so the off-toggle is fully honored. */}
            <TouchableOpacity
              onLongPress={() => {
                if (!somaticInterceptorEnabled) return;
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

          {/* Weekly metrics — render whenever there's at least one logged
              day. The TrendLineCard itself handles 0/1/2+ day rendering, so
              we just need any log in the window. */}
          {recentLogs.length > 0 && weekAvg && (
            <>
              <SectionLabel
                label="This Week's Metrics"
                style={{ marginTop: SPACING.xl }}
              />
              <TrendLineCard
                title="Focus"
                subtitle={`${recentLogs.length}-day trendline with weekly average`}
                accentColor={COLORS.accent}
                points={focusTrend}
                maxValue={10}
                formatValue={(value) => value.toFixed(1)}
              />
              <TrendLineCard
                title="Energy"
                subtitle={`${recentLogs.length}-day trendline with weekly average`}
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

          {/* Quick Log — one-tap loggers for the user's recurrent event
              types. Surfaced here so multiply-occurring things ("had
              coffee", "took a dose") don't require scrolling to the
              bottom of the Log tab. Silent when no recurrent types exist. */}
          <QuickLogTiles />

          {/* Patterns — was the Insights tab. Relocated here in Phase 8c
              so the bottom bar can host the new Tech tab without exceeding
              5 slots. Same hook + components; only the header chrome
              changed. */}
          <PatternsSection />

          {/* Spotify recents + genre insight previously rendered here off
              mock data. Removed so the Today surface reflects only real
              data; the cards return once a real Spotify integration lands. */}

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
