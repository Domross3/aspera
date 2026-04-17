/**
 * Returns "YYYY-MM-DD" in the user's LOCAL timezone.
 * Never use toISOString().split("T")[0] — that's UTC and shifts the date
 * for anyone west of UTC in the evening.
 */
export function localDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Offset today's local date by daysAgo. */
export function localDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return localDateStr(d);
}
