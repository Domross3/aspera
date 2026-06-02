// PatternsSection — the old Insights tab, relocated inside Today. Same
// hook + components; only the surrounding chrome changes (no full-screen
// hero, no "Insights" title — Today already owns the page header).
//
// Phase 8 sub-phase 8c. Future: 8g adds the ad-hoc "Compare" surface
// below the natural-language SearchBar.

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useInsights } from "../../hooks/useInsights";
import { useLogs } from "../../hooks/useLogs";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import CorrelationCard from "../insights/CorrelationCard";
import TrendBarsSection from "../insights/TrendBarsSection";
import SearchBar from "../insights/SearchBar";
import ComparePicker from "./ComparePicker";
import AgentFindingsCard from "./AgentFindingsCard";

// Need at least 3 days of logs for the AI to find meaningful patterns —
// mirrors the gate that lived in `insights.tsx`.
const MIN_LOGS_FOR_INSIGHTS = 3;

export default function PatternsSection() {
  const { recentLogs } = useLogs();
  const { insights, loading, error, loadCached, generate } = useInsights();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCached();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasEnoughData = recentLogs.length >= MIN_LOGS_FOR_INSIGHTS;

  const handleGenerate = async () => {
    if (!hasEnoughData) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generate(recentLogs);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Ask Aspera — the user-initiated "pull" entry. Its own labelled
          surface (not buried under Patterns) so the agency is visible: ask a
          question about your own data and get an honest, confound-aware answer.
          Works without generated insights. */}
      <SectionLabel label="Ask Aspera" style={{ marginTop: SPACING.xl }} />
      <SearchBar />

      {/* Passive confidence-gated agent — surfaces glaring patterns from the
          user's own data, on-device, no AI call. The calm, automatic layer;
          renders nothing until a finding is earned. */}
      <AgentFindingsCard />

      {/* Generate button */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={loading || !hasEnoughData}
        activeOpacity={0.85}
        style={{ marginTop: SPACING.md }}
      >
        <LinearGradient
          colors={COLORS.gradients.accent as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.genButton,
            (loading || !hasEnoughData) && { opacity: 0.5 },
          ]}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.text} size="small" />
              <Text style={styles.genButtonText}>
                Analyzing your patterns...
              </Text>
            </View>
          ) : !hasEnoughData ? (
            <Text style={styles.genButtonText}>
              Log {MIN_LOGS_FOR_INSIGHTS - recentLogs.length} more day
              {MIN_LOGS_FOR_INSIGHTS - recentLogs.length === 1 ? "" : "s"} to
              unlock insights
            </Text>
          ) : (
            <Text style={styles.genButtonText}>
              {insights ? "🔄 Regenerate Insights" : "✨ Generate AI Insights"}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {error ? (
        <GradientCard
          colors={["#2A1515", "#1A0E0E"]}
          style={{ marginTop: SPACING.md }}
        >
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.danger }]}>
            ⚠️ {error}
          </Text>
        </GradientCard>
      ) : null}

      {insights ? (
        <>
          <GradientCard
            colors={COLORS.gradients.accent}
            style={{ marginTop: SPACING.lg }}
          >
            <Text
              style={[
                TYPOGRAPHY.label,
                {
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: SPACING.xs,
                },
              ]}
            >
              SUMMARY
            </Text>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
              {insights.summary}
            </Text>
            <View style={styles.recBox}>
              <Text
                style={[
                  TYPOGRAPHY.label,
                  {
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: SPACING.xs,
                  },
                ]}
              >
                TOP ACTION
              </Text>
              <Text
                style={[
                  TYPOGRAPHY.body,
                  { color: COLORS.text, fontWeight: "600" },
                ]}
              >
                {insights.topRecommendation}
              </Text>
            </View>
          </GradientCard>

          {insights.weeklyTrends?.length > 0 ? (
            <>
              <SectionLabel
                label="7-Day Trends"
                style={{ marginTop: SPACING.lg }}
              />
              <GradientCard>
                <TrendBarsSection trends={insights.weeklyTrends} />
              </GradientCard>
            </>
          ) : null}

          <SectionLabel
            label={`${insights.correlations.length} Patterns Found`}
            style={{ marginTop: SPACING.lg }}
          />
          <View style={styles.cards}>
            {[...insights.correlations]
              .sort((a, b) => (b.isKeystone ? 1 : 0) - (a.isKeystone ? 1 : 0))
              .map((c, i) => (
                <CorrelationCard key={c.id} correlation={c} index={i} />
              ))}
          </View>

          <View style={styles.footnote}>
            <Text style={styles.footnoteText}>
              Generated {new Date(insights.generatedAt).toLocaleDateString()}
            </Text>
          </View>
        </>
      ) : null}

      {/* Ad-hoc Compare surface — uses the same bootstrap engine the
          experiment framework will use (Phase 8 sub-phase 8f). Always
          available, even before the user has generated correlations,
          because it runs against raw daily-log data. */}
      <ComparePicker />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  genButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  genButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  loadingRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  recBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  cards: { gap: SPACING.md },
  footnote: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  footnoteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: "italic",
  } as object,
});
