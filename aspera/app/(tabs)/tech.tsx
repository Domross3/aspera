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
import {
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import { useScreenTime } from "../../src/hooks/useScreenTime";

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

        {/* Screen Time authorization (Phase 8 · 8a). The auth state drives
            everything downstream — restrictions + data ingestion both gate
            on `approved`. */}
        <SectionLabel label="Screen Time" />
        <ScreenTimeAuthCard />

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

// ── Screen Time authorization card ─────────────────────────────────────────

function ScreenTimeAuthCard() {
  const { available, authStatus, requesting, connect } = useScreenTime();

  if (!available) {
    return (
      <GradientCard style={{ marginBottom: SPACING.md }}>
        <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text }]}>
          Update required
        </Text>
        <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
          Screen Time controls need the latest native build of Aspera. This
          copy of the app doesn&apos;t include the module yet.
        </Text>
      </GradientCard>
    );
  }

  if (authStatus === "approved") {
    return (
      <GradientCard style={{ marginBottom: SPACING.md }}>
        <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.success }]}>
          Connected
        </Text>
        <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
          Screen Time is authorized. You can set app limits below; per-category
          data ingestion follows in a later build.
        </Text>
      </GradientCard>
    );
  }

  if (authStatus === "denied") {
    return (
      <GradientCard style={{ marginBottom: SPACING.md }}>
        <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.danger }]}>
          Authorization denied
        </Text>
        <Text
          style={[
            TYPOGRAPHY.caption,
            { color: COLORS.textMuted, marginBottom: SPACING.sm },
          ]}
        >
          iOS won&apos;t let Aspera re-ask from inside the app. Re-enable it in
          Settings → Screen Time, then come back.
        </Text>
        <TouchableOpacity
          onPress={() => void Linking.openURL("app-settings:")}
          activeOpacity={0.8}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Open iOS Settings</Text>
        </TouchableOpacity>
      </GradientCard>
    );
  }

  // notDetermined
  return (
    <GradientCard style={{ marginBottom: SPACING.md }}>
      <Text
        style={[
          TYPOGRAPHY.subtitle,
          { color: COLORS.text, marginBottom: SPACING.xs },
        ]}
      >
        Connect Screen Time
      </Text>
      <Text
        style={[
          TYPOGRAPHY.caption,
          { color: COLORS.textMuted, marginBottom: SPACING.md },
        ]}
      >
        Authorize Aspera to manage app limits + read per-category usage. The
        choice is yours and stays on your device.
      </Text>
      <TouchableOpacity
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          void connect();
        }}
        activeOpacity={0.85}
        disabled={requesting}
      >
        <LinearGradient
          colors={COLORS.gradients.accent as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.primaryBtn, requesting && { opacity: 0.6 }]}
        >
          {requesting ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Connect Screen Time</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  primaryBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
  secondaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: "600",
  } as object,
});
