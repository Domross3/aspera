// Logic for the "delay" restriction mode — a gratification delay.
//
// The app stays reachable, and Aspera can ask for a short calm pause (10–60s)
// before intentional use. On iOS this is currently a manual in-app pause:
// Apple's default ManagedSettings shield is a hard block and cannot show this
// React Native UI. A true "delay inside the shield" requires a native
// ManagedSettingsUI Shield Action extension.

export const DELAY_MIN_SECONDS = 10;
export const DELAY_MAX_SECONDS = 60;
export const DELAY_DEFAULT_SECONDS = 30;
// Minutes of access granted after a completed pause, before the shield re-arms.
export const DELAY_ACCESS_WINDOW_MINUTES = 10;

/** Clamp an arbitrary number into the valid delay range (default on garbage). */
export function clampDelaySeconds(value: number): number {
  if (!Number.isFinite(value)) return DELAY_DEFAULT_SECONDS;
  return Math.min(DELAY_MAX_SECONDS, Math.max(DELAY_MIN_SECONDS, Math.round(value)));
}

// ─── Commitment device ──────────────────────────────────────────────────────
// Raising the delay (more friction) applies immediately. LOWERING it (less
// friction) is deferred to the next local day, so it can't be weakened in the
// craving moment. A pending weaker value matures at `pendingEffectiveAt`.

export interface DelayChange {
  effectiveSeconds: number; // enforced right now
  pendingSeconds?: number; // a weaker value queued for later
  pendingEffectiveAt?: number; // ms epoch when the pending value takes effect
}

/** Start of the next local calendar day, in ms epoch. */
function startOfNextLocalDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Apply any pending (weakening) change whose effective time has arrived. */
export function resolveDelay(change: DelayChange, now: number = Date.now()): DelayChange {
  if (
    change.pendingSeconds != null &&
    change.pendingEffectiveAt != null &&
    now >= change.pendingEffectiveAt
  ) {
    return { effectiveSeconds: clampDelaySeconds(change.pendingSeconds) };
  }
  return change;
}

/**
 * Request a new delay value. Strengthening (>= current) applies now and clears
 * any pending change. Weakening (< current) keeps the stronger value in force
 * and queues the weaker one for the next local day.
 */
export function requestDelayChange(
  change: DelayChange,
  nextSeconds: number,
  now: number = Date.now(),
): DelayChange {
  const resolved = resolveDelay(change, now);
  const next = clampDelaySeconds(nextSeconds);
  if (next >= resolved.effectiveSeconds) {
    return { effectiveSeconds: next };
  }
  return {
    effectiveSeconds: resolved.effectiveSeconds,
    pendingSeconds: next,
    pendingEffectiveAt: startOfNextLocalDay(now),
  };
}

// ─── Reflective prompts ───────────────────────────────────────────────────
// One rotates beneath the breath circle during the pause. Warm, never shaming;
// connection / gratitude / presence / gentle intention. No productivity guilt.

export const PAUSE_PROMPTS: readonly string[] = [
  // connection
  "Who's it been too long since you reached out to?",
  "When did you last tell someone you love that you love them?",
  "Whose day could you make with one message?",
  // gratitude
  "What's already gone right today?",
  "What's one thing here you'd miss if it were gone?",
  // presence
  "What can you hear right now, if you stop and listen?",
  "Where is your body holding tension? Can you let it soften?",
  "Take one slow breath. Then one more.",
  "Look up — what have you stopped noticing around you?",
  // gentle intention
  "What were you actually looking for when you reached for this?",
  "What would you be glad you spent the next hour on?",
  "If this moment were yours to keep, what would you do with it?",
  "Is there something small you've meant to do that you could do now?",
  "What matters more to you than this, right now?",
  "What would the calmest version of you do next?",
];

/** Deterministically pick a prompt (seed by time or open-count to rotate). */
export function pickPrompt(
  seed: number = Date.now(),
  pool: readonly string[] = PAUSE_PROMPTS,
): string {
  if (pool.length === 0) return "";
  const i = Math.abs(Math.floor(seed)) % pool.length;
  return pool[i];
}
