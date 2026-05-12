// Quick Mood Capture modal — opened from notification taps (Phase B-mood).
//
// Renders as an expo-router modal route. Navigated to via:
//   - Notification tap handler in app/_layout.tsx
//   - Direct router.push("/quick-mood") from anywhere
//
// UX goals (Phase B-mood spec):
//   - 10-second capture: 2 sliders + 1 text input
//   - No coercion: Skip button dismisses without writing anything
//   - No stress slider here (default to 3/neutral on save)
//   - Single tap to save (checkmark icon)
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
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../src/constants/theme";

export default function QuickMoodModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
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
    const checkIn: MoodCheckIn = {
      id: new Date(now).toISOString(),
      timestamp: now,
      mood,
      energy,
      stress: 3, // neutral default — quick capture doesn't ask
      note: note.trim() || undefined,
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
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl },
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
            <Text style={[TYPOGRAPHY.title, { color: COLORS.text }]}>
              Pulse check
            </Text>
            <Text
              style={[
                TYPOGRAPHY.body,
                { color: COLORS.textSecondary, marginTop: SPACING.xs },
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
              accentColor={COLORS.accent}
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
              accentColor={COLORS.gradients.energy[0]}
            />
          </View>

          {/* What's happening */}
          <View style={styles.section}>
            <Text style={[TYPOGRAPHY.caption, styles.fieldLabel]}>
              What's happening right now? (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. focusing on the deck, stuck in traffic, just woke up"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              style={styles.input}
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
                colors={COLORS.gradients.accent as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveGradient, saving && { opacity: 0.6 }]}
              >
                <Ionicons name="checkmark" size={20} color={COLORS.text} />
                <Text style={styles.saveText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
  header: { marginBottom: SPACING.md },
  section: { marginBottom: SPACING.sm },
  fieldLabel: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: { flex: 1, borderRadius: RADIUS.lg, overflow: "hidden" },
  skipButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md + 2,
  },
  skipText: {
    color: COLORS.textSecondary,
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
  saveText: { color: COLORS.text, fontWeight: "700", fontSize: 16 },
});
