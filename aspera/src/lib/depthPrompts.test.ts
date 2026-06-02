import { selectDepthPrompt, DEPTH_PROMPTS } from "./depthPrompts";
import type { DailyLog, DepthPillar, DepthValue } from "../types";

function log(
  id: string,
  opts: { rocks?: string[]; note?: string; depth?: Partial<Record<DepthPillar, DepthValue>> } = {},
): DailyLog {
  return {
    id,
    bigRocks: opts.rocks ?? [],
    reflectionNote: opts.note,
    depth: opts.depth,
  } as unknown as DailyLog;
}

const today = () => log("2026-06-02", { rocks: ["focus"] });

describe("selectDepthPrompt", () => {
  it("returns null when there is no today log", () => {
    expect(selectDepthPrompt([], null)).toBeNull();
  });

  it("returns null when core reflection hasn't started (no note, no focus)", () => {
    expect(selectDepthPrompt([], log("2026-06-02", {}))).toBeNull();
  });

  it("asks a pillar once core reflection is underway (focus set)", () => {
    const p = selectDepthPrompt([], today());
    expect(p).not.toBeNull();
    expect(DEPTH_PROMPTS[p!]).toBeTruthy();
  });

  it("asks when a reflection note is present even without a focus", () => {
    expect(
      selectDepthPrompt([], log("2026-06-02", { note: "tomorrow: deck" })),
    ).not.toBeNull();
  });

  it("returns null once a pillar has been answered today (<=1 per evening)", () => {
    const t = log("2026-06-02", { rocks: ["f"], depth: { meaning: "yes" } });
    expect(selectDepthPrompt([], t)).toBeNull();
  });

  it("rotates away from a recently-asked pillar (cooldown)", () => {
    // meaning asked yesterday + day before → within cooldown → pick another.
    const recent = [
      log("2026-06-01", { depth: { meaning: "yes" } }),
      log("2026-05-31", { depth: { meaning: "no" } }),
    ];
    const p = selectDepthPrompt(recent, today());
    expect(p).not.toBe("meaning");
    expect(["connection", "growth"]).toContain(p);
  });

  it("prefers the least-recently-asked eligible pillar", () => {
    // connection asked 4 days ago, growth asked 5 days ago, meaning never.
    // All are >= cooldown(3); meaning (Infinity gap) wins.
    const recent = [
      log("d0", {}),
      log("d1", {}),
      log("d2", {}),
      log("d3", { depth: { connection: "yes" } }),
      log("d4", { depth: { growth: "yes" } }),
    ];
    expect(selectDepthPrompt(recent, today())).toBe("meaning");
  });
});
