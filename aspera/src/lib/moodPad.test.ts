import {
  aspMoodWord,
  moodPadPointToCheckIn,
  moodPadPointToScale,
} from "./moodPad";

describe("mood pad", () => {
  it.each([
    [0.5, 0.5, "Steady"],
    [0.72, 0.6, "Bright"],
    [0.7, 0.9, "Alive"],
    [0.68, 0.4, "At ease"],
    [0.7, 0.1, "Calm"],
    [0.3, 0.6, "Tense"],
    [0.3, 0.9, "Restless"],
    [0.3, 0.4, "Low"],
    [0.3, 0.1, "Heavy"],
  ])("maps (%s,%s) to %s", (x, y, word) => {
    expect(aspMoodWord(x, y)).toBe(word);
  });

  it("maps 0..1 pad coordinates to the stored 1..5 scale", () => {
    expect(moodPadPointToScale(0)).toBe(1);
    expect(moodPadPointToScale(0.5)).toBe(3);
    expect(moodPadPointToScale(1)).toBe(5);
  });

  it("creates a MoodCheckIn with neutral stress", () => {
    expect(moodPadPointToCheckIn({ x: 0.62, y: 0.34 }, 1000)).toMatchObject({
      timestamp: 1000,
      mood: 3,
      energy: 2,
      stress: 3,
      source: "full",
    });
  });
});
