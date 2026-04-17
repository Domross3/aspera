import { LogSectionId, LOG_SECTIONS } from "../types";

export function isSectionHidden(hidden: LogSectionId[], id: LogSectionId): boolean {
  return hidden.includes(id);
}

export function toggleSection(hidden: LogSectionId[], id: LogSectionId): LogSectionId[] {
  if (hidden.includes(id)) return hidden.filter((h) => h !== id);
  return [...hidden, id];
}

export function visibleSections(hidden: LogSectionId[]): typeof LOG_SECTIONS {
  return LOG_SECTIONS.filter((s) => !hidden.includes(s.id));
}
