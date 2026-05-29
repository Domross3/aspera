// AgentFindingsCard — the calm surface for the confidence-gated agent.
//
// Runs on mount over the user's own data (on-device, no AI). Shows the few
// patterns that cleared the FDR + effect-size gate, framed as hypotheses, or a
// deliberately quiet state when nothing did. No score, no streak, no dashboard.

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { useAgentInsights } from "../../hooks/useAgentInsights";

export default function AgentFindingsCard() {
  const { findings, loading, analyzed, analyze } = useAgentInsights();

  useEffect(() => {
    analyze();
  }, [analyze]);

  return (
    <View>
      <SectionLabel
        label="What Aspera noticed"
        style={{ marginTop: SPACING.xl }}
      />
      <GradientCard>
        {loading || !analyzed ? (
          <View style={styles.row}>
            <ActivityIndicator color={COLORS.text} size="small" />
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
              Looking through your own data…
            </Text>
          </View>
        ) : findings.length === 0 ? (
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textMuted }]}>
            Nothing stood out strongly enough to flag yet — and that's
            intentional. Aspera stays quiet until a pattern in your own data is
            both large and consistent. Keep logging; it watches in the
            background.
          </Text>
        ) : (
          <View style={styles.list}>
            {findings.map((f) => (
              <View key={`${f.leverId}:${f.outcomeId}`} style={styles.finding}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.text }]}>
                  {f.headline}
                </Text>
              </View>
            ))}
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: COLORS.textMuted, fontStyle: "italic", marginTop: SPACING.xs },
              ]}
            >
              Found on your device from your own logs — no AI, nothing sent
              anywhere. Hints worth noticing, not proven cause.
            </Text>
          </View>
        )}
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  list: { gap: SPACING.md },
  finding: {
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
  },
});
