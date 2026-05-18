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
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import BrowsingFocus from "../../src/components/today/BrowsingFocus";
import ScreenTimeCard from "../../src/components/today/ScreenTimeCard";

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

        {/* Screen Time status — placeholder until 8a wires real auth state.
            The real card surfaces one of:
              - "Connect Screen Time" CTA when not authorized
              - "Collecting data (3 / 7 days)" during warmup
              - "Connected · last updated 2h ago" once authorized + warmed up */}
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text
            style={[TYPOGRAPHY.subtitle, { color: COLORS.text, marginBottom: SPACING.xs }]}
          >
            Screen Time
          </Text>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Family Controls authorization + 7-day data warmup ships in
            Phase 8 sub-phase 8a/8b. Mock data appears below for now.
          </Text>
        </GradientCard>

        {/* Browsing focus + screen time mocks — relocated from Today's
            __DEV__ block. Once 8b lands, ScreenTimeCard switches to the
            real per-category data source. */}
        <View style={{ marginBottom: SPACING.md }}>
          <BrowsingFocus />
        </View>

        <View style={{ marginBottom: SPACING.lg }}>
          <ScreenTimeCard />
        </View>

        {/* Restrictions placeholder — 8d builds the real list + editor. */}
        <SectionLabel label="Restrictions" />
        <GradientCard style={{ marginBottom: SPACING.md }}>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Time-window blocks + daily-limit caps land in Phase 8 sub-phase
            8d. Persistence is already wired (Supabase `restrictions` table
            + cloudStore helpers).
          </Text>
        </GradientCard>

        {/* Experiments placeholder — 8f builds the real list + editor. */}
        <SectionLabel label="Experiments" />
        <GradientCard>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Self-experimentation framework ships in Phase 8 sub-phase 8f.
            The statistical comparison engine + confidence labeling is
            already in place (`src/lib/experiments/`), 37 jest tests
            passing.
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
