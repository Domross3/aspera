import type { CheatPolicy } from "../types";

const DEFAULT_WEEKLY_CAP = 1;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface CheatChallenge {
  restrictionId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

export interface CheatSpendResult {
  allowed: boolean;
  policy: CheatPolicy;
  reason?: "empty_pool";
}

function dateFromInput(now: Date | number = Date.now()): Date {
  return now instanceof Date ? new Date(now.getTime()) : new Date(now);
}

export function isoMondayString(now: Date | number = Date.now()): string {
  const monday = dateFromInput(now);
  const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

function nextIsoMondayString(now: Date | number = Date.now()): string {
  const next = dateFromInput(now);
  const daysUntilNextMonday = next.getDay() === 0 ? 1 : 8 - next.getDay();
  next.setDate(next.getDate() + daysUntilNextMonday);
  next.setHours(0, 0, 0, 0);
  return isoMondayString(next);
}

function cleanCap(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_WEEKLY_CAP;
  return Math.max(0, Math.round(value ?? DEFAULT_WEEKLY_CAP));
}

export function normalizeCheatPolicy(
  policy: CheatPolicy | undefined,
  now: Date | number = Date.now(),
): CheatPolicy {
  const currentWeek = isoMondayString(now);
  const base: CheatPolicy = {
    weeklyCap: cleanCap(policy?.weeklyCap),
    pendingCap: policy?.pendingCap,
    pendingCapEffectiveWeek: policy?.pendingCapEffectiveWeek,
    weekStart: policy?.weekStart ?? currentWeek,
    spentThisWeek: Math.max(0, Math.round(policy?.spentThisWeek ?? 0)),
  };

  if (
    base.pendingCap != null &&
    base.pendingCapEffectiveWeek != null &&
    base.pendingCapEffectiveWeek <= currentWeek
  ) {
    return {
      weeklyCap: cleanCap(base.pendingCap),
      weekStart: currentWeek,
      spentThisWeek: 0,
    };
  }

  if (base.weekStart !== currentWeek) {
    return {
      ...base,
      weekStart: currentWeek,
      spentThisWeek: 0,
    };
  }

  return {
    ...base,
    weeklyCap: cleanCap(base.weeklyCap),
    pendingCap: base.pendingCap == null ? undefined : cleanCap(base.pendingCap),
  };
}

export function spendCheat(
  policy: CheatPolicy | undefined,
  now: Date | number = Date.now(),
): CheatSpendResult {
  const normalized = normalizeCheatPolicy(policy, now);
  if (normalized.spentThisWeek >= normalized.weeklyCap) {
    return { allowed: false, policy: normalized, reason: "empty_pool" };
  }

  return {
    allowed: true,
    policy: {
      ...normalized,
      spentThisWeek: normalized.spentThisWeek + 1,
    },
  };
}

export function updateCheatWeeklyCap(
  policy: CheatPolicy | undefined,
  nextCap: number,
  now: Date | number = Date.now(),
): CheatPolicy {
  const normalized = normalizeCheatPolicy(policy, now);
  const cleanNext = cleanCap(nextCap);

  if (cleanNext <= normalized.weeklyCap) {
    return {
      weeklyCap: cleanNext,
      weekStart: normalized.weekStart,
      spentThisWeek: normalized.spentThisWeek,
    };
  }

  return {
    ...normalized,
    pendingCap: cleanNext,
    pendingCapEffectiveWeek: nextIsoMondayString(now),
  };
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = Array.from({ length: 10 }, () => {
    const index = Math.floor(Math.random() * alphabet.length);
    return alphabet[index];
  });
  return `ASPERA-${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}

export function createCheatChallenge(
  restrictionId: string,
  now: Date | number = Date.now(),
  code = randomCode(),
): CheatChallenge {
  const createdAt = dateFromInput(now).getTime();
  return {
    restrictionId,
    code,
    createdAt,
    expiresAt: createdAt + CHALLENGE_TTL_MS,
  };
}

export function verifyCheatCode(
  challenge: CheatChallenge | null,
  input: string,
  now: Date | number = Date.now(),
): boolean {
  if (!challenge) return false;
  if (dateFromInput(now).getTime() > challenge.expiresAt) return false;
  return input === challenge.code;
}
