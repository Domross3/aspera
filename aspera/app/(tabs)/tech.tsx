// Tech tab — the technological-relationship surface introduced in Phase 8.
//
// v1 (this commit, sub-phase 8c) hosts:
//   - BrowsingFocus card (relocated from Today's __DEV__ block)
//   - ScreenTimeCard (relocated; still mock-fed until 8b wires the real
//     native data source)
//   - Placeholder cards for Screen Time auth, Restrictions, and
//     Experiments — implemented in 8a/8b/8d/8f
//
// Future sub-phases fill in:
//   - 8a → FamilyControls auth flow lives in the top status card
//   - 8b → ScreenTimeCard switches to real per-category data + warmup count
//   - 8d → RestrictionList replaces the Restrictions placeholder
//   - 8f → ExperimentList replaces the Experiments placeholder

import React from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";

export default function TechScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
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
        <Text
          style={[
            TYPOGRAPHY.hero,
            { color: COLORS.text, marginBottom: SPACING.xs },
          ]}
        >
          Tech
        </Text>
        <Text
          style={[
            TYPOGRAPHY.body,
            { color: COLORS.textSecondary, marginBottom: SPACING.lg },
          ]}
        >
          Your relationship with your devices — data, boundaries, experiments.
        </Text>

        {/* Screen Time — not connected yet. The mock cards (BrowsingFocus,
            ScreenTimeCard, MOCK badges) were removed so this tab reflects
            the real state. Real data needs the local FamilyControls
            module + extension targets (Phase 8 sub-phases 8a + 8b). */}
        <SectionLabel label="Screen Time" />
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text
            style={[
              TYPOGRAPHY.subtitle,
              { color: COLORS.text, marginBottom: SPACING.xs },
            ]}
          >
            Not connected yet
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Family Controls authorization + per-category data ingestion
            (Phase 8 · 8a/8b) ship in the next native build. Until then
            there is no on-device data to read.
          </Text>
        </GradientCard>

        <SectionLabel label="Restrictions" />
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Time-window blocks + daily-limit caps land in Phase 8 · 8d.
            Persistence is wired (Supabase `restrictions` table +
            cloudStore helpers) but the UI + native shield bridge are
            not built yet.
          </Text>
        </GradientCard>

        <SectionLabel label="Experiments" />
        <GradientCard>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Self-experimentation UI ships in Phase 8 · 8f. The bootstrap
            comparison engine + confidence labeling is already in place
            (`src/lib/experiments/`), 37 jest tests passing — you can
            already use the ad-hoc Compare surface on Today's Patterns
            section to feed it real data.
          </Text>
        </GradientCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
});
