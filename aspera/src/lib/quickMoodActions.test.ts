// Note: only parseActionValue is unit-tested here — the rest of
// quickMoodActions touches expo-notifications + storage (exercised on-device).
import { parseActionValue } from "./quickMoodActions";

describe("parseActionValue", () => {
  it("parses mood action ids", () => {
    expect(parseActionValue("mood_5")).toEqual({ kind: "mood", value: 5 });
    expect(parseActionValue("mood_1")).toEqual({ kind: "mood", value: 1 });
  });

  it("parses energy action ids", () => {
    expect(parseActionValue("energy_4")).toEqual({ kind: "energy", value: 4 });
    expect(parseActionValue("energy_2")).toEqual({ kind: "energy", value: 2 });
  });

  it("returns null for non-action identifiers", () => {
    // expo uses a default identifier for plain body taps.
    expect(parseActionValue("expo.modules.notifications.actions.DEFAULT")).toBeNull();
    expect(parseActionValue("")).toBeNull();
    expect(parseActionValue("something_else")).toBeNull();
  });

  it("returns null for a malformed value", () => {
    expect(parseActionValue("mood_abc")).toBeNull();
  });
});
