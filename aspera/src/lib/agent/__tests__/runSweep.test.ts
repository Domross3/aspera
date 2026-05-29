import type { DailyLog, MoodCheckIn, Moment, EventTypeDef } from "../../../types";
import { runSweep, type SweepInputs } from "../runSweep";

// Deterministic PRNG (mulberry32) so the bootstrap is reproducible in tests.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Noon-local ms for a YYYY-MM-DD (parsed as local time, matching localDateKey).
function noon(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

function dateStr(dayIndex: number): string {
  const d = new Date(2026, 0, 1 + dayIndex);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("runSweep (synthetic n=1)", () => {
  it("surfaces a planted alcohol→mood effect and rejects null levers", () => {
    const N = 40;
    const moodCheckIns: MoodCheckIn[] = [];
    const logs: DailyLog[] = [];
    const moments: Moment[] = [];

    for (let i = 0; i < N; i++) {
      const date = dateStr(i);
      const isAlcohol = i % 4 === 0; // 10 of 40 days, evenly spaced
      // Planted effect: mood ~1pt lower on alcohol days. Energy is unrelated.
      // Small deterministic, non-constant wobble keeps groups out of the
      // zero-variance fast path so the real bootstrap runs.
      const wobble = ((i % 3) - 1) * 0.2; // -0.2, 0, +0.2
      const mood = (isAlcohol ? 3 : 4) + wobble;
      const energy = 3 + wobble;
      for (let k = 0; k < 3; k++) {
        moodCheckIns.push({
          id: `${date}-${k}`,
          timestamp: noon(date) + k * 3_600_000,
          mood,
          energy,
          stress: 3,
        });
      }
      // Null lever "coffee": first 20 contiguous days. Because alcohol recurs
      // every 4th day, any contiguous block of length 20 holds alcohol at the
      // population rate (25%) → coffee is balanced w.r.t. mood → no real effect.
      if (i < 20) {
        moments.push({ id: `c-${i}`, timestamp: noon(date), label: "coffee" });
      }
      logs.push({ date, drinks: isAlcohol ? 2 : 0 } as unknown as DailyLog);
    }

    const inputs: SweepInputs = {
      logs,
      moodCheckIns,
      moments,
      eventTypes: [] as EventTypeDef[],
    };

    const findings = runSweep(inputs, {
      iterations: 2000,
      random: mulberry32(12345),
      q: 0.1,
      minGroupDays: 7,
    });

    // The planted alcohol→mood effect must surface, negative and ≥ the floor.
    const alcoholMood = findings.find(
      (f) => f.leverId === "alcohol" && f.outcomeId === "mood",
    );
    expect(alcoholMood).toBeDefined();
    expect(alcoholMood!.result.effect).toBeLessThan(0);
    expect(Math.abs(alcoholMood!.result.effect)).toBeGreaterThanOrEqual(0.5);

    // Null relationships must NOT surface.
    expect(
      findings.find((f) => f.leverId === "alcohol" && f.outcomeId === "energy"),
    ).toBeUndefined();
    expect(findings.find((f) => f.leverId === "moment:coffee")).toBeUndefined();
  });

  it("returns nothing when there isn't enough data", () => {
    const moodCheckIns: MoodCheckIn[] = [];
    const logs: DailyLog[] = [];
    for (let i = 0; i < 5; i++) {
      const date = dateStr(i);
      moodCheckIns.push({
        id: date,
        timestamp: noon(date),
        mood: 4,
        energy: 3,
        stress: 3,
      });
      logs.push({ date, drinks: i % 2 } as unknown as DailyLog);
    }
    const findings = runSweep(
      { logs, moodCheckIns, moments: [], eventTypes: [] },
      { iterations: 500, random: mulberry32(1) },
    );
    expect(findings).toEqual([]);
  });

  it("rejects a consistent but sub-threshold effect (effect-size floor)", () => {
    // "tea" on 15 of 30 days; mood is perfectly consistently +0.2 on tea days
    // — clears FDR (direction never wavers) but 0.2 < the 0.5 mood floor.
    const moodCheckIns: MoodCheckIn[] = [];
    const moments: Moment[] = [];
    for (let i = 0; i < 30; i++) {
      const date = dateStr(i);
      const tea = i % 2 === 0;
      moodCheckIns.push({
        id: date,
        timestamp: noon(date),
        mood: tea ? 4.2 : 4.0,
        energy: 3,
        stress: 3,
      });
      if (tea) moments.push({ id: `t-${i}`, timestamp: noon(date), label: "tea" });
    }
    const findings = runSweep(
      { logs: [], moodCheckIns, moments, eventTypes: [] },
      { iterations: 1000, random: mulberry32(7), q: 0.1, minGroupDays: 7 },
    );
    expect(findings.find((f) => f.leverId === "moment:tea")).toBeUndefined();
  });

  it("excludes an underpowered lever (<7 days) even with a large effect", () => {
    // "rare" occurs on only 5 days with a huge mood drop — but the power gate
    // (≥7 days each side) keeps it out of the family entirely.
    const moodCheckIns: MoodCheckIn[] = [];
    const moments: Moment[] = [];
    for (let i = 0; i < 30; i++) {
      const date = dateStr(i);
      const rare = i < 5;
      moodCheckIns.push({
        id: date,
        timestamp: noon(date),
        mood: rare ? 1 : 4,
        energy: 3,
        stress: 3,
      });
      if (rare) moments.push({ id: `r-${i}`, timestamp: noon(date), label: "rare" });
    }
    const findings = runSweep(
      { logs: [], moodCheckIns, moments, eventTypes: [] },
      { iterations: 1000, random: mulberry32(9), q: 0.1, minGroupDays: 7 },
    );
    expect(findings.find((f) => f.leverId === "moment:rare")).toBeUndefined();
  });
});
