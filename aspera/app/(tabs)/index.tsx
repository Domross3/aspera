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
import SectionLabel from "../../src/components/common/SectionLabel";
import TodayBigRocks from "../../src/components/today/TodayBigRocks";
import PatternsSection from "../../src/components/today/PatternsSection";
import QuickLogTiles from "../../src/components/today/QuickLogTiles";
import { DailyLog } from "../../src/types";
import { asperaDayId } from "../../src/lib/day";

function todayId() {
  return asperaDayId();
}

function defaultLogShell(): DailyLog {
  const id = asperaDayId();
  return {
    id,
    date: id,
    createdAt: Date.now(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    output: { tasksCompleted: 0, focusRating: 3, energyRating: 3 },
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
  const { todayLog, recentLogs, loading, save } = useLogs();
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
      // getMorningBriefing degrades to a local fallback when the proxy is
      // down, so this normally resolves even offline. The catch is a last
      // resort for an unexpected local error — keep it quiet, not alarmist.
      const rec = await getMorningBriefing(todayLog, recentLogs);
      setRecommendation(rec);
      await saveTodayRec(todayId(), rec);
    } catch {
      setRecommendation("");
    } finally {
      setRecLoading(false);
    }
  };

  const log = todayLog;

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

          {/* Today's Focus — the morning anchor and first thing the user
              sees. Leads the screen (above the AI briefing) so first sight is
              "here's what you said matters", and it renders from local data
              regardless of whether the Claude proxy is reachable. */}
          <TodayBigRocks
            todayRocks={log?.bigRocks ?? []}
            recentLogs={recentLogs}
            onChange={async (rocks) => {
              const base = log ?? defaultLogShell();
              await save({ ...base, bigRocks: rocks });
            }}
          />

          {/* AI briefing — enrichment below the focuses. Degrades to a local
              fallback when the proxy is down (see getMorningBriefing). */}
          <RecommendationBanner
            recommendation={recommendation}
            isLoading={recLoading}
            onRefresh={fetchRecommendation}
          />

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
});
