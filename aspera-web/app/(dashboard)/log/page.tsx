"use client";
import { useState, useEffect } from "react";
import { DailyLog } from "@/types";
import { useLogs } from "@/hooks/useLogs";
import { localDateStr } from "@/lib/dateUtils";
import { GradientCard } from "@/components/ui/GradientCard";
import { Button } from "@/components/ui/Button";
import { BigRocksInput } from "@/components/log/BigRocksInput";
import { SleepInput } from "@/components/log/SleepInput";
import { DaylightInput } from "@/components/log/DaylightInput";
import { CaffeinePicker } from "@/components/log/CaffeinePicker";
import { WorkoutSelector } from "@/components/log/WorkoutSelector";
import { MusicChips } from "@/components/log/MusicChips";
import { NutritionInput } from "@/components/log/NutritionInput";
import { DrinksInput } from "@/components/log/DrinksInput";
import { RatingSlider } from "@/components/log/RatingSlider";
import { CustomTags } from "@/components/log/CustomTags";

function todayId(): string {
  return localDateStr();
}

function emptyLog(): DailyLog {
  const today = todayId();
  return {
    id: today,
    date: today,
    createdAt: Date.now(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 6 },
    drinks: 0,
    sleepHours: 7,
    daylightMinutes: 30,
    customMetrics: [],
    output: { tasksCompleted: 0, focusRating: 5, energyRating: 5 },
    tags: [],
    bigRocks: [],
  };
}

const SECTION_LABELS: Record<string, string> = {
  bigRocks: "Big Rocks 🪨",
  sleep: "Sleep 😴",
  daylight: "Daylight ☀️",
  caffeine: "Caffeine ☕",
  workout: "Workout 💪",
  music: "Music 🎵",
  nutrition: "Nutrition 🥗",
  drinks: "Alcohol 🍷",
  output: "Performance Output 📊",
  tags: "Tags 🏷️",
};

export default function LogPage() {
  const { todayLog, save, loading } = useLogs();
  const [log, setLog] = useState<DailyLog>(emptyLog);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (todayLog) setLog(todayLog);
  }, [todayLog]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await save({ ...log, createdAt: todayLog?.createdAt ?? Date.now() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Daily Log</h1>
          <p className="text-sm text-text-secondary">{today}</p>
        </div>
        {todayLog && (
          <span className="text-xs px-2 py-1 rounded-pill bg-success/20 text-success border border-success/30">
            Logged today
          </span>
        )}
      </div>

      {/* Big Rocks */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.bigRocks}
        </div>
        <BigRocksInput
          value={log.bigRocks}
          onChange={(bigRocks) => setLog((p) => ({ ...p, bigRocks }))}
        />
      </GradientCard>

      {/* Sleep & Daylight */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
          {SECTION_LABELS.sleep}
        </div>
        <SleepInput
          value={log.sleepHours}
          onChange={(v) => setLog((p) => ({ ...p, sleepHours: v }))}
        />
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
            {SECTION_LABELS.daylight}
          </div>
          <DaylightInput
            value={log.daylightMinutes}
            onChange={(v) => setLog((p) => ({ ...p, daylightMinutes: v }))}
          />
        </div>
      </GradientCard>

      {/* Caffeine */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.caffeine}
        </div>
        <CaffeinePicker
          type={log.caffeine.type}
          amount={log.caffeine.amount}
          onChange={(type, amount) =>
            setLog((p) => ({ ...p, caffeine: { type, amount } }))
          }
        />
      </GradientCard>

      {/* Workout */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.workout}
        </div>
        <WorkoutSelector
          type={log.workout.type}
          intensity={log.workout.intensity}
          onChange={(type, intensity) =>
            setLog((p) => ({ ...p, workout: { type, intensity } }))
          }
        />
      </GradientCard>

      {/* Music */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.music}
        </div>
        <MusicChips
          selected={log.music}
          onChange={(music) => setLog((p) => ({ ...p, music }))}
        />
      </GradientCard>

      {/* Nutrition */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.nutrition}
        </div>
        <NutritionInput
          mealQuality={log.nutrition.mealQuality}
          hydration={log.nutrition.hydration}
          onChange={(mealQuality, hydration) =>
            setLog((p) => ({ ...p, nutrition: { mealQuality, hydration } }))
          }
        />
      </GradientCard>

      {/* Drinks */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.drinks}
        </div>
        <DrinksInput
          value={log.drinks}
          onChange={(drinks) => setLog((p) => ({ ...p, drinks }))}
        />
      </GradientCard>

      {/* Performance Output */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
          {SECTION_LABELS.output}
        </div>
        <div className="space-y-4">
          <RatingSlider
            label="Focus rating"
            value={log.output.focusRating}
            onChange={(v) =>
              setLog((p) => ({ ...p, output: { ...p.output, focusRating: v } }))
            }
            emoji="🎯"
          />
          <RatingSlider
            label="Energy rating"
            value={log.output.energyRating}
            onChange={(v) =>
              setLog((p) => ({
                ...p,
                output: { ...p.output, energyRating: v },
              }))
            }
            emoji="⚡"
          />
          <RatingSlider
            label="Tasks completed"
            value={log.output.tasksCompleted}
            onChange={(v) =>
              setLog((p) => ({
                ...p,
                output: { ...p.output, tasksCompleted: v },
              }))
            }
            min={0}
            max={20}
            emoji="✅"
          />
        </div>
      </GradientCard>

      {/* Tags */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
          {SECTION_LABELS.tags}
        </div>
        <CustomTags
          tags={log.tags}
          onChange={(tags) => setLog((p) => ({ ...p, tags }))}
        />
      </GradientCard>

      {/* Save */}
      <div className="sticky bottom-20 md:bottom-4 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          loading={saving}
        >
          {saved ? "✓ Saved!" : "Save Today's Log"}
        </Button>
      </div>
    </div>
  );
}
