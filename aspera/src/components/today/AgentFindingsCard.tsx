// AgentFindingsCard — the calm surface for the confidence-gated agent.
//
// Runs on mount over the user's own data (on-device, no AI). Shows the few
// patterns that cleared the FDR + effect-size gate, framed as hypotheses, or a
// deliberately quiet state when nothing did. No score, no streak, no dashboard.

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useAgentInsights } from "../../hooks/useAgentInsights";

export default function AgentFindingsCard() {
  const { findings, loading, analyzed, analyze } = useAgentInsights();

  useEffect(() => {
    analyze();
  }, [analyze]);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.label}>Pattern</Text>
        <Text style={styles.tentative}>tentative</Text>
      </View>
        {loading || !analyzed ? (
          <View style={styles.row}>
            <ActivityIndicator color={COLORS.text} size="small" />
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
              Looking through your own data…
            </Text>
          </View>
        ) : findings.length === 0 ? (
          <Text style={styles.bodyText}>
            Nothing stood out strongly enough to flag yet — and that's
            intentional. Aspera stays quiet until a pattern in your own data is
            both large and consistent. Keep logging; it watches in the
            background.
          </Text>
        ) : (
          <View style={styles.list}>
            <Text style={styles.bodyText}>{findings[0].headline}</Text>
            <TickTexture />
            <Text style={styles.footnote}>
              Possible link — still watching from your own logs.
            </Text>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: RADIUS.instrument,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    marginTop: SPACING.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.aspLabel,
    letterSpacing: 1.98,
    color: COLORS.textMuted,
  } as object,
  tentative: {
    ...TYPOGRAPHY.aspLabel,
    letterSpacing: 1.1,
    color: COLORS.faint,
  } as object,
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  list: { gap: SPACING.md },
  bodyText: {
    ...TYPOGRAPHY.body,
    fontSize: 17,
    lineHeight: 25.5,
    color: COLORS.text,
  } as object,
  footnote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic",
  } as object,
  tickRow: {
    height: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  tick: {
    width: 4,
    borderRadius: 1,
    backgroundColor: COLORS.faint,
  },
});

function TickTexture() {
  const heights = [8, 13, 7, 16, 10, 5, 6];
  return (
    <View style={styles.tickRow}>
      {heights.map((height, index) => (
        <View
          key={`${height}:${index}`}
          style={[
            styles.tick,
            {
              height,
              backgroundColor:
                index === heights.length - 1 ? COLORS.textSecondary : COLORS.faint,
            },
          ]}
        />
      ))}
    </View>
  );
}
