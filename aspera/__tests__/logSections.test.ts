import {
  isSectionHidden,
  toggleSection,
  visibleSections,
} from "../src/lib/logSections";
import { LOG_SECTIONS, LogSectionId } from "../src/types";

describe("logSections", () => {
  it("reports a section as not hidden by default", () => {
    expect(isSectionHidden([], "caffeine")).toBe(false);
  });

  it("reports a section as hidden when present in the list", () => {
    expect(isSectionHidden(["caffeine"], "caffeine")).toBe(true);
  });

  it("toggles a section into the hidden list", () => {
    const next = toggleSection([], "drinks");
    expect(next).toContain("drinks");
  });

  it("toggles a section back out of the hidden list", () => {
    const next = toggleSection(["drinks"], "drinks");
    expect(next).not.toContain("drinks");
  });

  it("does not mutate the input array", () => {
    const original: LogSectionId[] = ["drinks"];
    toggleSection(original, "music");
    expect(original).toEqual(["drinks"]);
  });

  it("returns visible sections in the canonical order", () => {
    const hidden: LogSectionId[] = ["drinks", "music"];
    const visible = visibleSections(hidden);
    const expected = LOG_SECTIONS.filter((s) => !hidden.includes(s.id));
    expect(visible).toEqual(expected);
  });

  it("returns all sections when nothing is hidden", () => {
    expect(visibleSections([])).toEqual(LOG_SECTIONS);
  });
});
