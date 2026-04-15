import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Correlation } from "../../types";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";

interface Props {
  correlation: Correlation;
  index: number;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  low: COLORS.warning,
  medium: COLORS.accentAlt,
  high: COLORS.success,
};

const METRIC_COLORS: Record<string, string> = {
  focus: COLORS.accent,
  energy: COLORS.warning,
  tasks: COLORS.success,
};

export default function CorrelationCard({ correlation: c, index }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const deltaPositive = c.delta >= 0;
  const metricColor = METRIC_COLORS[c.outputMetric] ?? COLORS.accent;

  const cardColors = c.isKeystone
    ? (["#1A1040", "#0F0A2A"] as [string, string]) // deeper purple for keystone
    : undefined;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <GradientCard
        style={[styles.card, c.isKeystone && styles.keystoneCard]}
        colors={cardColors}
      >
        {/* Keystone banner */}
        {c.isKeystone && (
          <LinearGradient
            colors={COLORS.gradients.accent as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.keystoneBanner}
          >
            <Text style={styles.keystoneIcon}>🔑</Text>
            <Text style={styles.keystoneLabel}>KEYSTONE HABIT</Text>
            <Text style={styles.keystoneHint}>
              Cascading positive effects detected
            </Text>
          </LinearGradient>
        )}

        <View style={styles.topRow}>
          <Text style={styles.emoji}>{c.emoji}</Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${CONFIDENCE_COLORS[c.confidence]}22`,
                  borderColor: CONFIDENCE_COLORS[c.confidence],
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: CONFIDENCE_COLORS[c.confidence] },
                ]}
              >
                {c.confidence} confidence
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${metricColor}22`,
                  borderColor: metricColor,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: metricColor }]}>
                {c.outputMetric}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.description}>{c.description}</Text>

        <View style={styles.deltaRow}>
          <Text
            style={[
              styles.delta,
              { color: deltaPositive ? COLORS.success : COLORS.danger },
            ]}
          >
            {deltaPositive ? "+" : ""}
            {c.delta.toFixed(1)}
          </Text>
          <Text style={styles.deltaLabel}> avg {c.outputMetric} score</Text>
        </View>

        <View style={styles.factorsRow}>
          {c.inputFactors.map((f) => (
            <View
              key={f}
              style={[styles.factor, c.isKeystone && styles.keystoneFactor]}
            >
              <Text
                style={[
                  styles.factorText,
                  c.isKeystone && { color: COLORS.accent },
                ]}
              >
                {f}
              </Text>
            </View>
          ))}
        </View>
      </GradientCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  keystoneCard: {
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  keystoneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  keystoneIcon: { fontSize: 12 },
  keystoneLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    fontSize: 9,
  } as object,
  keystoneHint: {
    ...TYPOGRAPHY.caption,
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    flex: 1,
    textAlign: "right",
  } as object,
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emoji: { fontSize: 28 },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as object,
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  } as object,
  deltaRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  delta: {
    ...TYPOGRAPHY.title,
    fontWeight: "800",
  } as object,
  deltaLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  factorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  factor: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keystoneFactor: {
    borderColor: COLORS.borderAccent,
    backgroundColor: COLORS.accentGlow,
  },
  factorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  } as object,
});
