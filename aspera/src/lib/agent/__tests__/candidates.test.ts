import type { DailyLog, EventTypeDef, Moment } from "../../../types";
import { buildLevers } from "../candidates";

function noon(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

const D = (i: number) => `2026-02-${String(i).padStart(2, "0")}`;

describe("buildLevers", () => {
  it("creates an alcohol lever from drinks>0 days (≥3-day threshold)", () => {
    const logs = [
      { date: D(1), drinks: 2 },
      { date: D(2), drinks: 0 },
      { date: D(3), drinks: 1 },
      { date: D(4), drinks: 3 },
    ] as unknown as DailyLog[];
    const alc = buildLevers(logs, [], []).find((l) => l.id === "alcohol");
    expect(alc).toBeDefined();
    expect(Array.from(alc!.treatmentDates).sort()).toEqual([D(1), D(3), D(4)]);
  });

  it("omits a lever that occurs on fewer than 3 days", () => {
    const logs = [
      { date: D(1), drinks: 1 },
      { date: D(2), drinks: 1 },
    ] as unknown as DailyLog[];
    expect(buildLevers(logs, [], [])).toEqual([]);
  });

  it("builds toggle + recurrent-presence levers from event types", () => {
    const eventTypes = [
      {
        id: "et1",
        name: "Meditation",
        emoji: "🧘",
        cardinality: "recurrent",
        fields: [{ id: "f1", name: "Completed", kind: "toggle" }],
      },
    ] as unknown as EventTypeDef[];
    const mk = (date: string, toggled: boolean) =>
      ({
        date,
        eventEntries: [{ typeId: "et1", fieldValues: { f1: toggled } }],
      }) as unknown as DailyLog;
    const levers = buildLevers(
      [mk(D(1), true), mk(D(2), true), mk(D(3), true), mk(D(4), false)],
      [],
      eventTypes,
    );

    const toggle = levers.find((l) => l.id === "evt:et1:f1");
    expect(toggle).toBeDefined();
    expect(Array.from(toggle!.treatmentDates).sort()).toEqual([D(1), D(2), D(3)]);

    const present = levers.find((l) => l.id === "evt-present:et1");
    expect(present).toBeDefined();
    expect(present!.treatmentDates.size).toBe(4); // an entry exists every day
  });

  it("groups recurring Moment labels case-insensitively, keeping display casing", () => {
    const moments: Moment[] = [
      { id: "1", timestamp: noon(D(1)), label: "Coffee" },
      { id: "2", timestamp: noon(D(2)), label: "coffee " },
      { id: "3", timestamp: noon(D(3)), label: "COFFEE" },
      { id: "4", timestamp: noon(D(4)), label: "gym" }, // 1 day → below threshold
    ];
    const levers = buildLevers([], moments, []);
    const coffee = levers.find((l) => l.id === "moment:coffee");
    expect(coffee).toBeDefined();
    expect(coffee!.label).toBe("Coffee");
    expect(coffee!.treatmentDates.size).toBe(3);
    expect(levers.find((l) => l.id === "moment:gym")).toBeUndefined();
  });
});
