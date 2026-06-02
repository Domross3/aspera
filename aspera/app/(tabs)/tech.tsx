// Tech tab — the technological-relationship surface introduced in Phase 8.
//
// v1 (this commit, sub-phase 8c) hosts:
//   - BrowsingFocus card (relocated from Today's __DEV__ block)
//   - Screen Time auth + native aggregate warmup
//   - Restriction CRUD + native app-limit enforcement
//   - Placeholder card for Experiments — implemented in 8f
//
// Future sub-phases fill in:
//   - 8f → ExperimentList replaces the Experiments placeholder

import React, { useState } from "react";
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
import CheatUnlockSheet from "../../src/components/tech/CheatUnlockSheet";
import BreathPauseSheet from "../../src/components/tech/BreathPauseSheet";
import RestrictionEditor from "../../src/components/tech/RestrictionEditor";
import RestrictionList from "../../src/components/tech/RestrictionList";
import ScreenTimeWarmupCard from "../../src/components/tech/ScreenTimeWarmupCard";
import { useRestrictions } from "../../src/hooks/useRestrictions";
import { useScreenTime } from "../../src/hooks/useScreenTime";
import { useSettings } from "../../src/hooks/useSettings";
import { grantCheat } from "../../modules/screen-time/src";
import type { CheatPolicy, Restriction } from "../../src/types";

export default function TechScreen() {
  const insets = useSafeAreaInsets();
  const screenTime = useScreenTime();
  const restrictionState = useRestrictions();
  const settingsState = useSettings();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingRestriction, setEditingRestriction] =
    useState<Restriction | null>(null);
  const [cheatRestriction, setCheatRestriction] = useState<Restriction | null>(
    null,
  );
  const [pauseRestriction, setPauseRestriction] = useState<Restriction | null>(
    null,
  );

  const openCreateRestriction = () => {
    void Haptics.selectionAsync();
    setEditingRestriction(null);
    setEditorVisible(true);
  };

  const openEditRestriction = (restriction: Restriction) => {
    void Haptics.selectionAsync();
    setEditingRestriction(restriction);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditingRestriction(null);
  };

  const handleSaveRestriction = async (restriction: Restriction) => {
    try {
      await restrictionState.saveRestriction(restriction);
      closeEditor();
    } catch {
      // The hook surfaces the message on the list. Keep the sheet open so the
      // draft is still editable after a failed save.
    }
  };

  const handleDeleteRestriction = async (id: string) => {
    try {
      await restrictionState.deleteRestriction(id);
      closeEditor();
    } catch {
      // Same as save: leave the draft visible and surface the hook error.
    }
  };

  const handleCheatUnlock = async (
    restriction: Restriction,
    nextPolicy: CheatPolicy,
  ) => {
    await grantCheat(restriction.id, 30);
    await settingsState.update({ cheatPolicy: nextPolicy });
  };

  const handleDelayUnlock = async (_restriction: Restriction) => {
    // Delay mode is currently an Aspera-mediated pause, not an in-shield
    // unlock. Applying Apple's native shield would hard-lock the selected app
    // unless we add a ManagedSettingsUI Shield Action extension.
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPauseRestriction(null);
  };

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
        <ScreenTimeAuthCard screenTime={screenTime} />
        {screenTime.authStatus === "approved" ? (
          <ScreenTimeWarmupCard screenTime={screenTime} />
        ) : null}

        <SectionLabel label="Restrictions" />
        {screenTime.authStatus === "approved" ? (
          <RestrictionList
            restrictions={restrictionState.restrictions}
            loading={restrictionState.loading}
            saving={restrictionState.saving}
            error={restrictionState.error}
            onCreate={openCreateRestriction}
            onEdit={openEditRestriction}
            onCheat={(restriction) => {
              void Haptics.selectionAsync();
              if (restriction.spec.kind === "delay") {
                setPauseRestriction(restriction);
              } else {
                setCheatRestriction(restriction);
              }
            }}
            onRefresh={() => void restrictionState.refresh()}
          />
        ) : (
          <GradientCard style={{ marginBottom: SPACING.md }}>
            <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text }]}>
              Connect Screen Time first
            </Text>
            <Text
              style={[
                TYPOGRAPHY.caption,
                { color: COLORS.textMuted, marginTop: SPACING.xs },
              ]}
            >
              Once authorization is approved, you can choose apps and save
              active limits from this tab.
            </Text>
          </GradientCard>
        )}

        <SectionLabel label="Experiments" />
        <GradientCard>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
            Self-experimentation UI ships in Phase 8 · 8f. The bootstrap
            comparison engine + confidence labeling is already in place
            (`src/lib/experiments/`), 37 jest tests passing — you can already
            use the ad-hoc Compare surface on Today's Patterns section to feed
            it real data.
          </Text>
        </GradientCard>
      </ScrollView>

      <RestrictionEditor
        visible={editorVisible}
        initial={editingRestriction}
        saving={restrictionState.saving}
        onCancel={closeEditor}
        onSave={handleSaveRestriction}
        onDelete={handleDeleteRestriction}
        onPickApps={(restriction) => restrictionState.pickApps(restriction)}
      />
      <CheatUnlockSheet
        visible={cheatRestriction != null}
        restriction={cheatRestriction}
        policy={settingsState.settings.cheatPolicy}
        onCancel={() => setCheatRestriction(null)}
        onUnlock={handleCheatUnlock}
      />
      <BreathPauseSheet
        visible={pauseRestriction != null}
        restriction={pauseRestriction}
        onCancel={() => setPauseRestriction(null)}
        onUnlock={handleDelayUnlock}
      />
    </LinearGradient>
  );
}

// ── Screen Time authorization card ─────────────────────────────────────────

function ScreenTimeAuthCard({
  screenTime,
}: {
  screenTime: ReturnType<typeof useScreenTime>;
}) {
  const { available, authStatus, requesting, connect } = screenTime;
  if (!available) {
    return (
      <GradientCard style={{ marginBottom: SPACING.md }}>
        <Text style={[TYPOGRAPHY.subtitle, { color: COLORS.text }]}>
          Update required
        </Text>
        <Text style={[TYPOGRAPHY.caption, { color: COLORS.textMuted }]}>
          Screen Time controls need the latest native build of Aspera. This copy
          of the app doesn&apos;t include the module yet.
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
          Screen Time is authorized. You can choose apps, save active limits,
          and open Aspera to spend a cheat when you need a 30-minute lift.
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
