// Morning Briefing card — the headline UI of the Today tab.
//
// Used to be a one-sentence "AI Recommendation." Phase B-3 promoted it to
// a 2-3 sentence Living Briefing in the single Aspera voice. Same component
// shape so existing callers don't break; visual treatment is more generous.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOWS,
} from "../../constants/theme";

interface Props {
  recommendation: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  generatedAt?: number; // ms epoch; if provided we render a subtle timestamp
}

function formatTimeSince(ts: number): string {
  const now = Date.now();
  const diffMin = Math.floor((now - ts) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RecommendationBanner({
  recommendation,
  isLoading,
  onRefresh,
  generatedAt,
}: Props) {
  return (
    <LinearGradient
      colors={COLORS.gradients.focus as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, SHADOWS.glow]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>☀️</Text>
          <Text style={styles.title}>Morning Briefing</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          style={styles.refresh}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
          ) : (
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.7)" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <View style={styles.shimmer} />
          <View style={[styles.shimmer, { width: "92%" }]} />
          <View style={[styles.shimmer, { width: "70%" }]} />
        </View>
      ) : (
        <Text style={styles.rec}>
          {recommendation ??
            "Once we have a day or two of data, your briefing will appear here. For now, head to the Log tab and tell me about today."}
        </Text>
      )}

      {generatedAt && !isLoading && recommendation && (
        <Text style={styles.timestamp}>{formatTimeSince(generatedAt)}</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  emoji: { fontSize: 18 },
  title: {
    ...TYPOGRAPHY.label,
    color: "rgba(255,255,255,0.8)",
  } as object,
  refresh: { padding: SPACING.xs },
  loading: { gap: SPACING.xs + 2 },
  shimmer: {
    height: 14,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: RADIUS.sm,
  },
  rec: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
    fontSize: 16,
  } as object,
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    marginTop: SPACING.xs,
  } as object,
});
