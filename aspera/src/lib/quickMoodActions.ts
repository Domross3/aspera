// Interactive "2FA-style" quick-mood capture: long-press the pulse notification
// and log mood + energy from the lock/home screen WITHOUT opening the app.
//
// iOS notification actions are a flat button row, so two-tap mood+energy is a
// two-stage chain:
//   1. The quick-mood pulse carries category "quick_mood_mood" → 4 mood faces.
//   2. Tapping a mood logs a partial MoodCheckIn in the BACKGROUND and fires a
//      SILENT follow-up notification (category "quick_mood_energy", no sound)
//      asking energy → 3 buttons.
//   3. Tapping an energy button finalizes the same check-in with energy set.
//
// All handled by the root response listener (handleQuickMoodAction) — no app
// foreground required. If the user instead taps the notification BODY, the
// existing handler still opens /quick-mood for the full flow.
//
// The expo-notifications category API is the OTA-able half; no native target.

import * as Notifications from "expo-notifications";
import { saveMoodCheckIn } from "../storage/storage";
import type { MoodCheckIn } from "../types";

export const MOOD_CATEGORY = "quick_mood_mood";
export const ENERGY_CATEGORY = "quick_mood_energy";

// Action identifiers encode their value as the suffix, e.g. "mood_4".
const MOOD_PREFIX = "mood_";
const ENERGY_PREFIX = "energy_";

// 1–5 mood, but we expose 4 faces (skip the neutral midpoint) to keep the row
// readable on the lock screen; energy is the classic low/med/high → 2/3/4.
const MOOD_ACTIONS = [
  { id: `${MOOD_PREFIX}5`, title: "🙂 Great" },
  { id: `${MOOD_PREFIX}4`, title: "🙂 Good" },
  { id: `${MOOD_PREFIX}2`, title: "😕 Low" },
  { id: `${MOOD_PREFIX}1`, title: "😣 Rough" },
];
const ENERGY_ACTIONS = [
  { id: `${ENERGY_PREFIX}4`, title: "⚡ High" },
  { id: `${ENERGY_PREFIX}3`, title: "🔋 Medium" },
  { id: `${ENERGY_PREFIX}2`, title: "🪫 Low" },
];

/**
 * Register the mood + energy notification categories. Idempotent — safe to call
 * on every launch. Call before scheduling any quick-mood pulse.
 */
export async function registerQuickMoodCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(
    MOOD_CATEGORY,
    MOOD_ACTIONS.map((a) => ({
      identifier: a.id,
      buttonTitle: a.title,
      options: { opensAppToForeground: false },
    })),
  );
  await Notifications.setNotificationCategoryAsync(
    ENERGY_CATEGORY,
    ENERGY_ACTIONS.map((a) => ({
      identifier: a.id,
      buttonTitle: a.title,
      options: { opensAppToForeground: false },
    })),
  );
}

/** Parse "mood_4" / "energy_3" → 4 / 3, or null if not one of ours. */
export function parseActionValue(
  actionId: string,
): { kind: "mood" | "energy"; value: number } | null {
  if (actionId.startsWith(MOOD_PREFIX)) {
    const v = Number(actionId.slice(MOOD_PREFIX.length));
    return Number.isFinite(v) ? { kind: "mood", value: v } : null;
  }
  if (actionId.startsWith(ENERGY_PREFIX)) {
    const v = Number(actionId.slice(ENERGY_PREFIX.length));
    return Number.isFinite(v) ? { kind: "energy", value: v } : null;
  }
  return null;
}

/**
 * Handle a tapped mood/energy action in the background.
 * - mood tap: save a check-in with the chosen mood (energy provisional = 3),
 *   then fire a SILENT energy follow-up carrying the new check-in's id.
 * - energy tap: update that check-in's energy.
 * Returns true if it handled the action (so the caller can skip app routing).
 */
export async function handleQuickMoodAction(
  actionId: string,
  data: { checkInId?: string } | undefined,
): Promise<boolean> {
  const parsed = parseActionValue(actionId);
  if (!parsed) return false;

  if (parsed.kind === "mood") {
    const now = Date.now();
    const checkIn: MoodCheckIn = {
      id: new Date(now).toISOString(),
      timestamp: now,
      mood: parsed.value,
      energy: 3, // provisional until the energy step; neutral midpoint
      stress: 3,
      source: "quick" as MoodCheckIn["source"],
    };
    await saveMoodCheckIn(checkIn);

    // Silent energy follow-up — no sound, immediate.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "And your energy?",
        body: "One more tap.",
        data: { kind: ENERGY_CATEGORY, checkInId: checkIn.id },
        categoryIdentifier: ENERGY_CATEGORY,
        sound: false,
      },
      trigger: null, // deliver now
    });
    return true;
  }

  // energy tap — patch the referenced check-in's energy.
  if (parsed.kind === "energy" && data?.checkInId) {
    await patchCheckInEnergy(data.checkInId, parsed.value);
    return true;
  }
  return false;
}

// Update a stored mood check-in's energy in place (within its day bucket).
async function patchCheckInEnergy(
  checkInId: string,
  energy: number,
): Promise<void> {
  const { getMoodCheckIns, replaceCachedMoodCheckIns } = await import(
    "../storage/storage"
  );
  // checkInId is the ISO timestamp; its day bucket is the date prefix.
  const date = checkInId.split("T")[0];
  const dayCheckIns = await getMoodCheckIns(date);
  const next = dayCheckIns.map((c) =>
    c.id === checkInId ? { ...c, energy } : c,
  );
  // replaceCachedMoodCheckIns buckets by day internally — pass just the array.
  await replaceCachedMoodCheckIns(next);
}
