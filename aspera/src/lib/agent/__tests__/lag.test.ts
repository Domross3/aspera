import type { DailyLog, MoodCheckIn } from "../../../types";
import { runLagSweep } from "../lag";
import type { SweepInputs } from "../runSweep";

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

describe("runLagSweep (next-day effects)", () => {
  it("surfaces a lagged alcohol→next-day-energy drop, not a same-day one", () => {
    const N = 40;
    const moodCheckIns: MoodCheckIn[] = [];
    const logs: DailyLog[] = [];
    for (let i = 0; i < N; i++) {
      const date = dateStr(i);
      const alcoholToday = i % 4 === 0; // days 0,4,8,…
      const afterAlcohol = i % 4 === 1; // the day AFTER an alcohol day
      moodCheckIns.push({
        id: date,
        timestamp: noon(date),
        mood: 4 + ((i % 3) - 1) * 0.2, // unrelated wobble
        energy: afterAlcohol ? 2 : 4, // planted next-day drop
        stress: 3,
      });
      logs.push({ date, drinks: alcoholToday ? 2 : 0 } as unknown as DailyLog);
    }
    const inputs: SweepInputs = {
      logs,
      moodCheckIns,
      moments: [],
      eventTypes: [],
    };
    const findings = runLagSweep(inputs, {
      iterations: 2000,
      random: mulberry32(3),
      q: 0.1,
      minGroupDays: 7,
    });

    const lagged = findings.find(
      (f) => f.leverId === "alcohol" && f.outcomeId === "energy",
    );
    expect(lagged).toBeDefined();
    expect(lagged!.result.effect).toBeLessThan(0);
    expect(Math.abs(lagged!.result.effect)).toBeGreaterThanOrEqual(0.5);
    expect(lagged!.headline).toContain("The day after");

    // mood was unrelated to the alcohol schedule → no lagged mood finding
    expect(
      findings.find((f) => f.leverId === "alcohol" && f.outcomeId === "mood"),
    ).toBeUndefined();
  });

  it("returns nothing without enough data", () => {
    const moodCheckIns: MoodCheckIn[] = [];
    const logs: DailyLog[] = [];
    for (let i = 0; i < 4; i++) {
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
    expect(
      runLagSweep(
        { logs, moodCheckIns, moments: [], eventTypes: [] },
        { iterations: 500, random: mulberry32(1) },
      ),
    ).toEqual([]);
  });
});
