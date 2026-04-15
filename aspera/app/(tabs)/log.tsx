import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useLogs } from "../../src/hooks/useLogs";
import {
  DailyLog,
  CaffeineType,
  WorkoutType,
  MusicGenre,
  MealQuality,
} from "../../src/types";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../src/constants/theme";
import GradientCard from "../../src/components/common/GradientCard";
import SectionLabel from "../../src/components/common/SectionLabel";
import CaffeinePicker from "../../src/components/log/CaffeinePicker";
import WorkoutSelector from "../../src/components/log/WorkoutSelector";
import IntensitySlider from "../../src/components/log/IntensitySlider";
import MusicChips from "../../src/components/log/MusicChips";
import NutritionInput from "../../src/components/log/NutritionInput";
import RatingSlider from "../../src/components/log/RatingSlider";
import CustomTags from "../../src/components/log/CustomTags";
import BigRocksInput from "../../src/components/log/BigRocksInput";
import DrinksInput from "../../src/components/log/DrinksInput";
import SleepInput from "../../src/components/log/SleepInput";
import DaylightInput from "../../src/components/log/DaylightInput";
import CustomMetrics from "../../src/components/log/CustomMetrics";

function todayId(): string {
  return new Date().toISOString().split("T")[0];
}

function defaultLog(): DailyLog {
  const id = todayId();
  return {
    id,
    date: id,
    createdAt: Date.now(),
    caffeine: { type: "espresso", amount: 150 },
    workout: { type: "none", intensity: 0 },
    music: ["lofi"],
    nutrition: { mealQuality: 3, hydration: 6 },
    output: { tasksCompleted: 5, focusRating: 7, energyRating: 7 },
    tags: [],
    bigRocks: [],
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
  };
}

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const { todayLog, save } = useLogs();
  const [form, setForm] = useState<DailyLog>(defaultLog);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (todayLog) setForm(todayLog);
  }, [todayLog]);

  const patch = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const log: DailyLog = { ...form, createdAt: Date.now() };
    await save(log);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <LinearGradient
      colors={COLORS.gradients.background as [string, string]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + SPACING.lg,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[
              TYPOGRAPHY.hero,
              { color: COLORS.text, marginBottom: SPACING.xs },
            ]}
          >
            Daily Log
          </Text>
          <Text
            style={[
              TYPOGRAPHY.body,
              { color: COLORS.textSecondary, marginBottom: SPACING.xl },
            ]}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>

          {/* Big Rocks — morning intention */}
          <SectionLabel label="Big Rocks" style={{ marginTop: SPACING.sm }} />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <BigRocksInput
              rocks={form.bigRocks ?? []}
              onChange={(rocks) => patch("bigRocks", rocks)}
            />
          </GradientCard>

          {/* Sleep — auto-filled from HealthKit */}
          <SectionLabel label="Sleep" style={{ marginTop: SPACING.sm }} />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <SleepInput
              value={form.sleepHours ?? 0}
              onChange={(v) => patch("sleepHours", v)}
            />
          </GradientCard>

          {/* Daylight — auto-filled from HealthKit */}
          <SectionLabel label="Daylight" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <DaylightInput
              value={form.daylightMinutes ?? 0}
              onChange={(v) => patch("daylightMinutes", v)}
            />
          </GradientCard>

          {/* Caffeine */}
          <SectionLabel label="Caffeine" style={{ marginTop: SPACING.sm }} />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <CaffeinePicker
              value={form.caffeine.type}
              amount={form.caffeine.amount}
              onChange={(type, amount) => patch("caffeine", { type, amount })}
            />
          </GradientCard>

          {/* Workout */}
          <SectionLabel label="Workout" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <WorkoutSelector
              value={form.workout.type}
              onChange={(type) =>
                patch("workout", {
                  type,
                  intensity:
                    type === "none" ? 0 : Math.max(1, form.workout.intensity),
                })
              }
            />
            {form.workout.type !== ("none" as string) && (
              <View style={{ marginTop: SPACING.md }}>
                <Text
                  style={[
                    TYPOGRAPHY.caption,
                    { color: COLORS.textMuted, marginBottom: SPACING.sm },
                  ]}
                >
                  INTENSITY
                </Text>
                <IntensitySlider
                  value={form.workout.intensity || 5}
                  onChange={(intensity) =>
                    patch("workout", { ...form.workout, intensity })
                  }
                />
              </View>
            )}
          </GradientCard>

          {/* Music */}
          <SectionLabel label="Music" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <MusicChips
              selected={form.music}
              onChange={(music) => patch("music", music as MusicGenre[])}
            />
          </GradientCard>

          {/* Nutrition */}
          <SectionLabel label="Nutrition" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <NutritionInput
              mealQuality={form.nutrition.mealQuality}
              hydration={form.nutrition.hydration}
              onChangeMeal={(q) =>
                patch("nutrition", { ...form.nutrition, mealQuality: q })
              }
              onChangeHydration={(h) =>
                patch("nutrition", { ...form.nutrition, hydration: h })
              }
            />
          </GradientCard>

          {/* Drinks */}
          <SectionLabel label="Alcohol" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <DrinksInput
              value={form.drinks ?? 0}
              onChange={(v) => patch("drinks", v)}
            />
          </GradientCard>

          {/* Output */}
          <SectionLabel label="Performance Output" />
          <GradientCard style={{ marginBottom: SPACING.lg, gap: SPACING.lg }}>
            <RatingSlider
              label="Focus Rating"
              value={form.output.focusRating}
              onChange={(v) =>
                patch("output", { ...form.output, focusRating: v })
              }
              accentColor={COLORS.accent}
            />
            <RatingSlider
              label="Energy Rating"
              value={form.output.energyRating}
              onChange={(v) =>
                patch("output", { ...form.output, energyRating: v })
              }
              accentColor={COLORS.warning}
            />
            <RatingSlider
              label="Tasks Completed"
              value={form.output.tasksCompleted}
              max={20}
              onChange={(v) =>
                patch("output", { ...form.output, tasksCompleted: v })
              }
              accentColor={COLORS.success}
            />
          </GradientCard>

          {/* Custom Metrics */}
          <SectionLabel label="Your Metrics" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <CustomMetrics
              metrics={form.customMetrics ?? []}
              onChange={(m) => patch("customMetrics", m)}
            />
          </GradientCard>

          {/* Tags */}
          <SectionLabel label="Tags" />
          <GradientCard style={{ marginBottom: SPACING.lg }}>
            <CustomTags
              selected={form.tags}
              onChange={(tags) => patch("tags", tags)}
            />
          </GradientCard>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
            <LinearGradient
              colors={
                saved
                  ? (COLORS.gradients.success as [string, string])
                  : (COLORS.gradients.accent as [string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {saved ? "✓ Saved to Log" : "Save Today's Log"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg },
  saveButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
  },
  saveButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.text,
    fontWeight: "700",
  } as object,
});
