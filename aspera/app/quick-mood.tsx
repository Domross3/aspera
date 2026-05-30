// Quick Mood Capture modal — opened from notification taps (Phase B-mood).
//
// Renders as an expo-router modal route. Navigated to via:
//   - Notification tap handler in app/_layout.tsx
//   - Direct router.push("/quick-mood") from anywhere
//
// UX goals (Phase B-mood spec):
//   - 10-second capture: 2 sliders + 1 optional text note
//   - No coercion: Skip button dismisses without writing anything
//   - No stress slider here (default to 3/neutral on save)
//   - Single tap to save (checkmark icon)
//   - The text note is intentionally optional and unlabelled beyond a
//     placeholder — Save works fine with it blank, so the 10-second flow
//     stays intact for anyone who doesn't want to type. The text is
//     persisted to MoodCheckIn.note for the timeline; no AI interpretation
//     runs on it.
//
// Saves as a MoodCheckIn with source: "quick" so we can later distinguish
// notification-driven captures from full Mood-tab entries in analytics.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import ContinuousSlider from "../src/components/common/ContinuousSlider";
import { saveMoodCheckIn } from "../src/storage/storage";
import { insertMoodCheckIn } from "../src/lib/cloudStore";
import { useAuth } from "../src/hooks/useAuth";
import { MoodCheckIn } from "../src/types";
import { SPACING, TYPOGRAPHY, RADIUS } from "../src/constants/theme";
import { useTheme } from "../src/theme/ThemeProvider";
import { useThemedStyles } from "../src/theme/useThemedStyles";
import type { AsperaColors } from "../src/theme/ThemeProvider";

export default function QuickMoodModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Notification cold-launched the app — there's nothing in the stack
      // to go back to, so route to the Today tab.
      router.replace("/(tabs)");
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismiss();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = Date.now();
    const trimmedNote = note.trim();
    const checkIn: MoodCheckIn = {
      id: new Date(now).toISOString(),
      timestamp: now,
      mood,
      energy,
      stress: 3, // neutral default — quick capture doesn't ask
      note: trimmedNote ? trimmedNote : undefined,
      source: "quick",
    };
    // Optimistic local write first so the UI feels instant and we never
    // lose a capture to a network blip.
    await saveMoodCheckIn(checkIn);
    if (session) {
      insertMoodCheckIn(session.user.id, checkIn).catch((err) => {
        console.warn("[quick-mood] cloud sync failed; cached locally", err);
      });
    }
    dismiss();
  };

  return (
    <LinearGradient
      colors={colors.gradients.background as [string, string]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + SPACING.xl,
              paddingBottom: insets.bottom + SPACING.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          // No iOS bounce — gives the illusion of swiping the modal down
          // when the gesture-to-dismiss is intentionally disabled.
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.title, { color: colors.text }]}>
              Pulse check
            </Text>
            <Text
              style={[
                TYPOGRAPHY.body,
                { color: colors.textSecondary, marginTop: SPACING.xs },
              ]}
            >
              How are you right now?
            </Text>
          </View>

          {/* Mood slider — continuous 1.0–5.0 in 0.1 steps */}
          <View style={styles.section}>
            <ContinuousSlider
              label="Mood"
              value={mood}
              min={1}
              max={5}
              step={0.1}
              onChange={setMood}
              accentColor={colors.accent}
            />
          </View>

          {/* Energy slider — continuous 1.0–5.0 in 0.1 steps */}
          <View style={styles.section}>
            <ContinuousSlider
              label="Energy"
              value={energy}
              min={1}
              max={5}
              step={0.1}
              onChange={setEnergy}
              accentColor={colors.gradients.energy[0]}
            />
          </View>

          {/* Optional note — left blank, Save still works. No AI interpretation;
              the text is stored verbatim on MoodCheckIn.note for the timeline. */}
          <View style={styles.section}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What's happening? (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit
              style={styles.noteInput}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              style={[styles.actionButton, styles.skipButton]}
            >
              <Text style={styles.skipText}>Not now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={colors.gradients.accent as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveGradient, saving && { opacity: 0.6 }]}
              >
                <Ionicons name="checkmark" size={20} color={colors.text} />
                <Text style={styles.saveText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (c: AsperaColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
    header: { marginBottom: SPACING.md },
    section: { marginBottom: SPACING.sm },
    noteInput: {
      backgroundColor: c.surfaceElevated,
      borderColor: c.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      color: c.text,
      fontSize: 15,
      minHeight: 64,
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: SPACING.md,
      marginTop: SPACING.md,
    },
    actionButton: { flex: 1, borderRadius: RADIUS.lg, overflow: "hidden" },
    skipButton: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md + 2,
    },
    skipText: {
      color: c.textSecondary,
      fontWeight: "600",
      fontSize: 16,
    },
    saveGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      paddingVertical: SPACING.md + 2,
    },
    saveText: { color: c.text, fontWeight: "700", fontSize: 16 },
  });
