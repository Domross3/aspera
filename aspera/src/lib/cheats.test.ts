import type { CheatPolicy } from "../types";
import {
  createCheatChallenge,
  isoMondayString,
  normalizeCheatPolicy,
  spendCheat,
  updateCheatWeeklyCap,
  verifyCheatCode,
} from "./cheats";

const MONDAY = new Date("2026-05-25T12:00:00-04:00");
const NEXT_MONDAY = new Date("2026-06-01T08:00:00-04:00");

describe("cheat policy helpers", () => {
  it("computes ISO Monday anchors", () => {
    expect(isoMondayString(MONDAY)).toBe("2026-05-25");
    expect(isoMondayString(new Date("2026-05-31T23:00:00-04:00"))).toBe(
      "2026-05-25",
    );
  });

  it("resets spent cheats on a new ISO week", () => {
    const policy: CheatPolicy = {
      weeklyCap: 2,
      weekStart: "2026-05-18",
      spentThisWeek: 2,
    };

    expect(normalizeCheatPolicy(policy, MONDAY)).toEqual({
      weeklyCap: 2,
      weekStart: "2026-05-25",
      spentThisWeek: 0,
    });
  });

  it("spending increments spentThisWeek and blocks beyond the cap", () => {
    const policy: CheatPolicy = {
      weeklyCap: 1,
      weekStart: "2026-05-25",
      spentThisWeek: 0,
    };

    const first = spendCheat(policy, MONDAY);
    expect(first).toEqual({
      allowed: true,
      policy: {
        weeklyCap: 1,
        weekStart: "2026-05-25",
        spentThisWeek: 1,
      },
    });

    expect(spendCheat(first.policy, MONDAY)).toEqual({
      allowed: false,
      policy: first.policy,
      reason: "empty_pool",
    });
  });

  it("lowers weekly cap immediately", () => {
    const policy: CheatPolicy = {
      weeklyCap: 3,
      pendingCap: 5,
      pendingCapEffectiveWeek: "2026-06-01",
      weekStart: "2026-05-25",
      spentThisWeek: 2,
    };

    expect(updateCheatWeeklyCap(policy, 1, MONDAY)).toEqual({
      weeklyCap: 1,
      weekStart: "2026-05-25",
      spentThisWeek: 2,
    });
  });

  it("delays cap increases until next week", () => {
    const policy: CheatPolicy = {
      weeklyCap: 1,
      weekStart: "2026-05-25",
      spentThisWeek: 0,
    };

    const pending = updateCheatWeeklyCap(policy, 4, MONDAY);
    expect(pending).toEqual({
      weeklyCap: 1,
      pendingCap: 4,
      pendingCapEffectiveWeek: "2026-06-01",
      weekStart: "2026-05-25",
      spentThisWeek: 0,
    });

    expect(normalizeCheatPolicy(pending, NEXT_MONDAY)).toEqual({
      weeklyCap: 4,
      weekStart: "2026-06-01",
      spentThisWeek: 0,
    });
  });

  it("requires the exact fresh random-code paste", () => {
    const challenge = createCheatChallenge(
      "restriction-a",
      MONDAY,
      "ASPERA-ABCDE-23456",
    );

    expect(verifyCheatCode(challenge, "ASPERA-ABCDE-23456", MONDAY)).toBe(true);
    expect(verifyCheatCode(challenge, "ABCDE-23456", MONDAY)).toBe(false);
    expect(verifyCheatCode(challenge, " ASPERA-ABCDE-23456", MONDAY)).toBe(
      false,
    );
    expect(
      verifyCheatCode(
        challenge,
        "ASPERA-ABCDE-23456",
        new Date(MONDAY.getTime() + 6 * 60 * 1000),
      ),
    ).toBe(false);
  });
});
