import { formatScreenTimeBlock } from "../lib/screenTime/prompt";

describe("formatScreenTimeBlock", () => {
  it("gates the prompt block until seven native days are present", () => {
    expect(
      formatScreenTimeBlock([
        {
          date: "2026-05-20",
          byCategory: {
            social: 30,
            entertainment: 0,
            productivity: 0,
            communication: 0,
            other: 0,
          },
          totalMinutes: 30,
        },
      ]),
    ).toBe("");
  });

  it("formats seven synced days without app-level detail", () => {
    const totals = Array.from({ length: 7 }, (_, index) => ({
      date: `2026-05-${String(20 + index).padStart(2, "0")}`,
      byCategory: {
        social: 20 + index,
        entertainment: 10,
        productivity: 5,
        communication: 0,
        other: 0,
      },
      totalMinutes: 35 + index,
    }));

    const block = formatScreenTimeBlock(totals);

    expect(block).toContain("SCREEN_TIME (native iOS aggregates");
    expect(block).toContain("2026-05-26");
    expect(block).toContain("Social 26m");
    expect(block).not.toContain("Instagram");
    expect(block).not.toContain("TikTok");
  });
});
