// momentPromotion — detect when a free-form Moment label has appeared
// often enough to suggest promoting it to a structured EventTypeDef in
// the daily log. Threshold is 3 occurrences within the last 14 days
// (per the design discussion).
//
// Matching is intentionally loose: case-insensitive, whitespace-trimmed.
// Stemming or NLP-style normalization would catch more cases but
// introduces false positives ("walked the dog" ≠ "dog walk") so we keep
// the comparison literal for v1.

import type { Moment } from "../types";

export interface PromotionCandidate {
  // Display label — original casing of the most-recent occurrence, so
  // the banner reads like the user wrote it.
  label: string;
  count: number;
}

const PROMOTION_WINDOW_DAYS = 14;
const PROMOTION_THRESHOLD = 3;

function normalize(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Find a label that has been logged at least `PROMOTION_THRESHOLD` times
 * in the last `PROMOTION_WINDOW_DAYS` days and isn't already in the
 * user's dismissed list. Returns the highest-count candidate; ties go to
 * the most-recently-seen label.
 *
 * `dismissed` is expected to contain normalized labels (lowercase +
 * trimmed) — see `AppSettings.dismissedPromotions`.
 */
export function detectPromotionCandidate(
  moments: Moment[],
  dismissed: string[] = [],
): PromotionCandidate | null {
  const now = Date.now();
  const cutoff = now - PROMOTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const dismissedSet = new Set(dismissed.map(normalize));

  // Group by normalized label, keeping the latest timestamp + original
  // casing for display.
  const groups = new Map<
    string,
    { count: number; latest: number; display: string }
  >();
  for (const m of moments) {
    if (m.timestamp < cutoff) continue;
    const key = normalize(m.label);
    if (!key) continue;
    if (dismissedSet.has(key)) continue;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { count: 1, latest: m.timestamp, display: m.label });
    } else {
      existing.count += 1;
      if (m.timestamp > existing.latest) {
        existing.latest = m.timestamp;
        existing.display = m.label;
      }
    }
  }

  let best: PromotionCandidate | null = null;
  let bestLatest = 0;
  for (const group of groups.values()) {
    if (group.count < PROMOTION_THRESHOLD) continue;
    if (
      !best ||
      group.count > best.count ||
      (group.count === best.count && group.latest > bestLatest)
    ) {
      best = { label: group.display, count: group.count };
      bestLatest = group.latest;
    }
  }
  return best;
}

// Return the normalized form of a label — caller pushes this onto
// `AppSettings.dismissedPromotions` when the user opts not to promote.
export function normalizeForDismissal(label: string): string {
  return normalize(label);
}
