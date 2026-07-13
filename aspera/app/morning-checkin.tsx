// Morning check-in modal — the fixed-time morning prompt (distinct from the
// random quick-mood pulses that pop up through the day).
//
// Captures, in one short flow:
//   - Mood + Energy (continuous 1–5 sliders, same feel as the pulse)
//   - Subjective sleep quality (1–5)
//   - Sleep duration (hours)
//
// On save it writes two things:
//   - A MoodCheckIn (source "full") so the morning reading lands in the
//     mood timeline + trends like any other capture.
//   - Today's DailyLog sleepHours + sleepQuality, merged into whatever the
//     day's log already holds (creating an unrated shell if none exists, so
//     the sleep data persists without fabricating focus/energy ratings).
//
// Reached via the morning notification tap (app/_layout.tsx) or a direct
// router.push("/morning-checkin").

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
import { saveMoodCheckIn, getLog, saveLog } from "../src/storage/storage";
import {
  insertMoodCheckIn,
  fetchTodayLog,
  upsertDailyLog,
} from "../src/lib/cloudStore";
import { useAuth } from "../src/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MoodCheckIn, DailyLog, STORAGE_KEYS } from "../src/types";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../src/constants/theme";
import { asperaDayId } from "../src/lib/day";

// Canonical local 4am-cutoff day id (see src/lib/day.ts) — must match the Log
// tab so a morning check-in and the evening log land on the same DailyLog.
function todayId(): string {
  return asperaDayId();
}

// Minimal unrated shell — used only if the user has no log for today yet.
// outputRated:false keeps the default focus/energy out of trends/averages.
function blankShell(date: string): DailyLog {
  return {
    id: date,
    date,
    createdAt: Date.now(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    output: { tasksCompleted: 0, focusRating: 3, energyRating: 3 },
    tags: [],
    bigRocks: [],
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
    eventEntries: [],
    outputRated: false,
  };
}

const SLEEP_PRESETS = [5, 6, 6.5, 7, 7.5, 8, 9];

export default function MorningCheckinModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const adjustHours = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSleepHours((prev) =>
      Math.max(0, Math.min(14, Math.round((prev + delta) * 10) / 10)),
    );
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

    // 1. Mood reading → timeline + trends.
    const checkIn: MoodCheckIn = {
      id: new Date(now).toISOString(),
      timestamp: now,
      mood,
      energy,
      stress: 3, // morning check-in doesn't ask for stress
      note: trimmedNote ? trimmedNote : undefined,
      source: "full",
    };
    await saveMoodCheckIn(checkIn);
    if (session) {
      insertMoodCheckIn(session.user.id, checkIn).catch((err) => {
        console.warn("[morning] mood cloud sync failed; cached locally", err);
      });
    }

    // 2. Sleep → today's DailyLog, merged into whatever's already there.
    const today = todayId();
    let log: DailyLog | null = null;
    if (session) {
      try {
        log = await fetchTodayLog(session.user.id, today);
      } catch {
        log = await getLog(today);
      }
    } else {
      log = await getLog(today);
    }
    // Merge (not replace) so an evening-first logger doesn't lose their other
    // fields. `today` is the canonical asperaDayId (local, 4am cutoff) — the
    // SAME key the Log tab hydrates from — so sleep entered here shows
    // pre-filled + editable in the evening Log with no divergence.
    const merged: DailyLog = {
      ...(log ?? blankShell(today)),
      sleepHours,
      sleepQuality,
    };
    await saveLog(merged);
    if (session) {
      upsertDailyLog(session.user.id, merged).catch((err) => {
        console.warn("[morning] sleep cloud sync failed; cached locally", err);
      });
    }

    // Record when the morning log happened so the random quick-mood window can
    // start ~1h later (instead of spamming pulses right after the morning log).
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_MORNING_LOG_AT,
      String(Date.now()),
    );

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
            {
              paddingTop: insets.top + SPACING.xl,
              paddingBottom: insets.bottom + SPACING.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <View style={styles.header}>
            <Text style={[TYPOGRAPHY.title, { color: COLORS.text }]}>
              Good morning
            </Text>
            <Text
              style={[
                TYPOGRAPHY.body,
                { color: COLORS.textSecondary, marginTop: SPACING.xs },
              ]}
            >
              How are you starting the day, and how did you sleep?
            </Text>
          </View>

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

          <View style={styles.section}>
            <ContinuousSlider
              label="Sleep quality"
              value={sleepQuality}
              min={1}
              max={5}
              step={0.1}
              onChange={setSleepQuality}
              accentColor={COLORS.success}
            />
          </View>

          {/* Sleep duration stepper */}
          <View style={styles.section}>
            <Text style={styles.sleepLabel}>Time in bed</Text>
            <View style={styles.sleepRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustHours(-0.5)}
                hitSlop={6}
              >
                <Ionicons name="remove" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.sleepCountWrap}>
                <Text style={styles.sleepCount}>{sleepHours.toFixed(1)}</Text>
                <Text style={styles.sleepUnit}>hours</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustHours(0.5)}
                hitSlop={6}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.chips}>
              {SLEEP_PRESETS.map((h) => {
                const active = Math.abs(h - sleepHours) < 0.01;
                return (
                  <TouchableOpacity
                    key={h}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSleepHours(h);
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {h}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Anything notable about last night? (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit
              style={styles.noteInput}
            />
          </View>

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
  sleepLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  } as object,
  sleepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sleepCountWrap: { alignItems: "center", minWidth: 80 },
  sleepCount: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 32,
  } as object,
  sleepUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  } as object,
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    justifyContent: "center",
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  } as object,
  chipTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  } as object,
  noteInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
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
