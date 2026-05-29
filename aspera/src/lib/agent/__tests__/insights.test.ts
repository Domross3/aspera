import type { DailyLog, MoodCheckIn } from "../../../types";
import { computeAgentFindings } from "../insights";

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
function dateStr(i: number): string {
  const d = new Date(2026, 0, 1 + i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("computeAgentFindings", () => {
  it("merges the sweeps, surfaces the planted finding, sorted and capped", () => {
    const moodCheckIns: MoodCheckIn[] = [];
    const logs: DailyLog[] = [];
    for (let i = 0; i < 40; i++) {
      const date = dateStr(i);
      const alc = i % 4 === 0;
      const wob = ((i % 3) - 1) * 0.2;
      moodCheckIns.push({
        id: date,
        timestamp: noon(date),
        mood: (alc ? 3 : 4) + wob,
        energy: 3 + wob,
        stress: 3,
      });
      logs.push({ date, drinks: alc ? 2 : 0 } as unknown as DailyLog);
    }
    const found = computeAgentFindings(
      { logs, moodCheckIns, moments: [], eventTypes: [] },
      { iterations: 2000, random: mulberry32(11), q: 0.1, minGroupDays: 7, maxFindings: 4 },
    );

    expect(found.length).toBeGreaterThan(0);
    expect(found.length).toBeLessThanOrEqual(4);
    expect(
      found.find((f) => f.leverId === "alcohol" && f.outcomeId === "mood"),
    ).toBeDefined();
    for (let i = 1; i < found.length; i++) {
      expect(found[i - 1].pValue).toBeLessThanOrEqual(found[i].pValue);
    }
  });

  it("returns [] for empty inputs", () => {
    expect(
      computeAgentFindings({ logs: [], moodCheckIns: [], moments: [], eventTypes: [] }),
    ).toEqual([]);
  });
});
