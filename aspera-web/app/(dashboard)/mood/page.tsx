"use client";
import { useState, useEffect } from "react";
import {
  MoodCheckIn,
  MOOD_EMOJIS,
  ENERGY_EMOJIS,
  STRESS_EMOJIS,
} from "@/types";
import {
  getMoodCheckIns,
  saveMoodCheckIn,
  getRecentMoodCheckIns,
} from "@/lib/storage";
import { localDateStr } from "@/lib/dateUtils";
import { GradientCard } from "@/components/ui/GradientCard";
import { Button } from "@/components/ui/Button";
import { TimeOfDayCurve } from "@/components/mood/TimeOfDayCurve";

function todayId(): string {
  return localDateStr();
}

export default function MoodPage() {
  const [todayCheckIns, setTodayCheckIns] = useState<MoodCheckIn[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<MoodCheckIn[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const [today, recent] = await Promise.all([
      getMoodCheckIns(todayId()),
      getRecentMoodCheckIns(7),
    ]);
    setTodayCheckIns(today);
    setRecentCheckIns(recent);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const checkIn: MoodCheckIn = {
      id: new Date().toISOString(),
      timestamp: Date.now(),
      mood,
      energy,
      stress,
      note: note.trim() || undefined,
    };
    await saveMoodCheckIn(checkIn);
    setNote("");
    setSaved(true);
    await load();
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const EmojiScale = ({
    label,
    value,
    onChange,
    emojis,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    emojis: Record<number, string>;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-2xl">{emojis[value]}</span>
      </div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 h-10 rounded-lg text-lg transition-all ${
              value === v
                ? "bg-accent/20 border border-accent/50 shadow-glow-sm"
                : "bg-elevated border border-border hover:border-border-accent"
            }`}
          >
            {emojis[v]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Mood Tracker</h1>
        <p className="text-sm text-text-secondary">
          {todayCheckIns.length} check-in{todayCheckIns.length !== 1 ? "s" : ""}{" "}
          today
        </p>
      </div>

      {/* Quick check-in */}
      <GradientCard>
        <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
          How are you right now?
        </div>
        <div className="space-y-5">
          <EmojiScale
            label="Mood"
            value={mood}
            onChange={setMood}
            emojis={MOOD_EMOJIS}
          />
          <EmojiScale
            label="Energy"
            value={energy}
            onChange={setEnergy}
            emojis={ENERGY_EMOJIS}
          />
          <EmojiScale
            label="Stress"
            value={stress}
            onChange={setStress}
            emojis={STRESS_EMOJIS}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note…"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSave}
            loading={saving}
          >
            {saved ? "✓ Logged!" : "Log Check-in"}
          </Button>
        </div>
      </GradientCard>

      {/* Today's curve */}
      {todayCheckIns.length > 0 && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
            Today's Pattern
          </div>
          <TimeOfDayCurve checkIns={todayCheckIns} />
        </GradientCard>
      )}

      {/* Recent captures */}
      {todayCheckIns.length > 0 && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
            Today's Check-ins
          </div>
          <div className="space-y-2">
            {[...todayCheckIns].reverse().map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2.5 bg-background/50 rounded-lg"
              >
                <div className="text-xs text-text-muted w-12 flex-shrink-0">
                  {new Date(c.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex gap-3 text-base">
                  <span title="Mood">{MOOD_EMOJIS[c.mood]}</span>
                  <span title="Energy">{ENERGY_EMOJIS[c.energy]}</span>
                  <span title="Stress">{STRESS_EMOJIS[c.stress]}</span>
                </div>
                {c.note && (
                  <span className="text-xs text-text-secondary flex-1 truncate">
                    {c.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </GradientCard>
      )}

      {/* 7-day summary */}
      {recentCheckIns.length > 3 && (
        <GradientCard>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
            7-Day Average
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["mood", "energy", "stress"] as const).map((key) => {
              const avg =
                recentCheckIns.reduce((s, c) => s + c[key], 0) /
                recentCheckIns.length;
              const emojis =
                key === "mood"
                  ? MOOD_EMOJIS
                  : key === "energy"
                    ? ENERGY_EMOJIS
                    : STRESS_EMOJIS;
              return (
                <div key={key} className="bg-elevated rounded-lg p-3">
                  <div className="text-xs text-text-muted capitalize mb-1">
                    {key}
                  </div>
                  <div className="text-2xl">{emojis[Math.round(avg)]}</div>
                  <div className="text-sm font-bold text-text mt-1">
                    {avg.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </GradientCard>
      )}
    </div>
  );
}
