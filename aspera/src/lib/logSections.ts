// Helpers for the Log tab's section ordering + visibility.
//
// "Sections" in this tab are a mix of built-in (LogSectionId — Sleep,
// Caffeine, etc.) and user-defined (EventTypeDef.id strings). The helpers
// here accept either, so the same edit-mode interactions can hide a
// built-in section AND a user metric without branching.

import { LogSectionId, LOG_SECTIONS } from "../types";

export type SectionId = LogSectionId | string;

export function isSectionHidden(
  hidden: SectionId[],
  id: SectionId,
): boolean {
  return hidden.includes(id);
}

export function toggleSection(
  hidden: SectionId[],
  id: SectionId,
): SectionId[] {
  if (hidden.includes(id)) return hidden.filter((h) => h !== id);
  return [...hidden, id];
}

// Restricted variant for code paths that only care about built-in sections
// (e.g. Settings's older "default sections" toggle if it ever lands).
export function visibleSystemSections(
  hidden: SectionId[],
): typeof LOG_SECTIONS {
  return LOG_SECTIONS.filter((s) => !hidden.includes(s.id));
}

// Move an item within an ordered section list, returning a new array.
// Out-of-range indices are clamped — no exceptions thrown. The Log tab's
// edit-mode up/down arrows call this with `index - 1` / `index + 1`.
export function reorderSection<T>(
  order: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (fromIndex < 0 || fromIndex >= order.length) return order;
  const clampedTo = Math.max(0, Math.min(order.length - 1, toIndex));
  if (clampedTo === fromIndex) return order;
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampedTo, 0, moved);
  return next;
}
