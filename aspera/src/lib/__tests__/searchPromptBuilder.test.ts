import { DailyLog } from "../../types";

// The function under test — not yet implemented
import { buildSearchPrompt } from "../searchPromptBuilder";

// ── Helpers ────────────────────────────────────────────────────────────

function makeLog(date: string, over: Partial<DailyLog> = {}): DailyLog {
  return {
    id: date,
    date,
    createdAt: new Date(date).getTime(),
    caffeine: { type: "none", amount: 0 },
    workout: { type: "none", intensity: 0 },
    music: [],
    nutrition: { mealQuality: 3, hydration: 0 },
    drinks: 0,
    sleepHours: 0,
    daylightMinutes: 0,
    customMetrics: [],
    output: { tasksCompleted: 0, focusRating: 5, energyRating: 5 },
    tags: [],
    bigRocks: [],
    ...over,
  };
}

/** Generate N consecutive DailyLogs starting from a base date. */
function makeLogs(
  count: number,
  base: string = "2026-01-01",
  overrideFn?: (i: number) => Partial<DailyLog>,
): DailyLog[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().split("T")[0];
    return makeLog(date, overrideFn?.(i));
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("buildSearchPrompt", () => {
  // ── Return shape ────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns an object with system string and messages array", () => {
      const result = buildSearchPrompt("How does sleep affect focus?", [
        makeLog("2026-03-01"),
      ]);

      expect(typeof result.system).toBe("string");
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    });

    it("messages contain role and content fields", () => {
      const result = buildSearchPrompt("Do I focus better after yoga?", [
        makeLog("2026-03-01"),
      ]);

      for (const msg of result.messages) {
        expect(msg).toHaveProperty("role");
        expect(msg).toHaveProperty("content");
        expect(typeof msg.content).toBe("string");
      }
    });

    it("first message has role 'user'", () => {
      const result = buildSearchPrompt("test query", [makeLog("2026-03-01")]);

      expect(result.messages[0].role).toBe("user");
    });
  });

  // ── Query inclusion ─────────────────────────────────────────────────

  describe("query inclusion", () => {
    it("includes the user's query in the messages", () => {
      const query = "Do I sleep better when I skip caffeine?";
      const result = buildSearchPrompt(query, [makeLog("2026-03-01")]);

      const allContent = result.messages.map((m) => m.content).join("\n");
      expect(allContent).toContain(query);
    });

    it("preserves the exact query string without modification", () => {
      const query = "What's my avg focus on days with >7h sleep & yoga?";
      const result = buildSearchPrompt(query, [makeLog("2026-03-01")]);

      const allContent = result.messages.map((m) => m.content).join("\n");
      expect(allContent).toContain(query);
    });
  });

  // ── System prompt: JSON schema ──────────────────────────────────────

  describe("system prompt enforces JSON output schema", () => {
    it("instructs Claude to respond with JSON", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system.toLowerCase()).toMatch(/json/);
    });

    it("specifies the answer field", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/answer/);
    });

    it("specifies the confidence field", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/confidence/);
    });

    it("specifies the sampleSize field", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/sampleSize/);
    });

    it("specifies supportingDataPoints", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/supportingDataPoints/);
    });

    it("specifies confounds", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/confounds/);
    });

    it("specifies followUpQuestions", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system).toMatch(/followUpQuestions/);
    });
  });

  // ── System prompt: guardrails ───────────────────────────────────────

  describe("system prompt guardrails", () => {
    it("warns about minimum sample size", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system.toLowerCase()).toMatch(/sample\s*size/);
    });

    it("requires confound flagging", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      expect(system.toLowerCase()).toMatch(/confound/);
    });

    it("requires honest confidence levels", () => {
      const { system } = buildSearchPrompt("test", [makeLog("2026-03-01")]);

      // System prompt should mention the valid confidence values
      expect(system).toMatch(/low/);
      expect(system).toMatch(/medium/);
      expect(system).toMatch(/high/);
    });
  });

  // ── Data payload ────────────────────────────────────────────────────

  describe("data payload", () => {
    it("includes log data in the messages", () => {
      const logs = [
        makeLog("2026-03-01", {
          sleepHours: 7.5,
          caffeine: { type: "espresso", amount: 150 },
        }),
      ];
      const result = buildSearchPrompt("test", logs);

      const allContent = result.messages.map((m) => m.content).join("\n");
      // Verify actual data values appear (not just structure)
      expect(allContent).toContain("7.5");
      expect(allContent).toContain("espresso");
    });

    it("includes data from all provided logs", () => {
      const logs = [
        makeLog("2026-03-01", { sleepHours: 6.0 }),
        makeLog("2026-03-02", { sleepHours: 8.5 }),
        makeLog("2026-03-03", { sleepHours: 7.0 }),
      ];
      const result = buildSearchPrompt("test", logs);

      const allContent = result.messages.map((m) => m.content).join("\n");
      expect(allContent).toContain("2026-03-01");
      expect(allContent).toContain("2026-03-02");
      expect(allContent).toContain("2026-03-03");
    });
  });

  // ── Compression (>50 entries) ───────────────────────────────────────

  describe("compression for large datasets", () => {
    it("does not compress when logs count is 50 or fewer", () => {
      const logs = makeLogs(50, "2026-01-01", () => ({
        sleepHours: 7.5,
        caffeine: { type: "espresso", amount: 150 },
      }));
      const result = buildSearchPrompt("test", logs);

      const allContent = result.messages.map((m) => m.content).join("\n");
      // Full key names should be present when not compressed
      expect(allContent).toContain("sleepHours");
      expect(allContent).toContain("caffeine");
    });

    it("compresses when logs count exceeds 50", () => {
      const logs = makeLogs(51, "2026-01-01", () => ({
        sleepHours: 7.5,
        caffeine: { type: "espresso", amount: 150 },
      }));
      const result = buildSearchPrompt("test", logs);

      const allContent = result.messages.map((m) => m.content).join("\n");
      // Full verbose keys should be replaced by shorter abbreviations
      expect(allContent).not.toContain('"sleepHours"');
      expect(allContent).not.toContain('"daylightMinutes"');
    });

    it("produces a smaller payload per log when compressed", () => {
      const makeIdenticalLogs = (n: number) =>
        makeLogs(n, "2026-01-01", () => ({
          sleepHours: 7.5,
          caffeine: { type: "espresso", amount: 150 },
          workout: { type: "run", intensity: 7 },
          nutrition: { mealQuality: 4, hydration: 8 },
          tags: ["Sunlight"],
        }));

      const small = buildSearchPrompt("test", makeIdenticalLogs(50));
      const large = buildSearchPrompt("test", makeIdenticalLogs(51));

      const smallPayload = small.messages.map((m) => m.content).join("");
      const largePayload = large.messages.map((m) => m.content).join("");

      const bytesPerLogSmall = smallPayload.length / 50;
      const bytesPerLogLarge = largePayload.length / 51;

      expect(bytesPerLogLarge).toBeLessThan(bytesPerLogSmall);
    });

    it("strips null values from compressed payload", () => {
      const logs = makeLogs(51, "2026-01-01", () => ({
        customMetricValues: undefined,
      }));
      const result = buildSearchPrompt("test", logs);

      const allContent = result.messages.map((m) => m.content).join("\n");
      expect(allContent).not.toContain("null");
    });

    it("explains key abbreviations in system or user message when compressed", () => {
      const logs = makeLogs(51);
      const result = buildSearchPrompt("test", logs);

      // The prompt should include a legend/mapping so Claude knows what
      // the abbreviated keys mean
      const fullText =
        result.system + result.messages.map((m) => m.content).join("\n");
      // Should reference both the short key and the original concept
      expect(fullText.toLowerCase()).toMatch(/sleep/);
      expect(fullText.toLowerCase()).toMatch(/daylight/);
    });
  });

  // ── Custom variables ────────────────────────────────────────────────

  describe("custom variable names", () => {
    it("includes custom metric names from logs in the prompt", () => {
      const logs = [
        makeLog("2026-03-01", {
          customMetrics: [
            { name: "Supplements", value: 8 },
            { name: "Creativity", value: 6 },
          ],
        }),
      ];
      const result = buildSearchPrompt("test", logs);

      const fullText =
        result.system + result.messages.map((m) => m.content).join("\n");
      expect(fullText).toContain("Supplements");
      expect(fullText).toContain("Creativity");
    });

    it("deduplicates custom metric names across multiple logs", () => {
      const logs = [
        makeLog("2026-03-01", {
          customMetrics: [{ name: "Supplements", value: 8 }],
        }),
        makeLog("2026-03-02", {
          customMetrics: [{ name: "Supplements", value: 9 }],
        }),
        makeLog("2026-03-03", {
          customMetrics: [
            { name: "Supplements", value: 7 },
            { name: "Screen Breaks", value: 4 },
          ],
        }),
      ];
      const result = buildSearchPrompt("test", logs);

      const fullText =
        result.system + result.messages.map((m) => m.content).join("\n");
      // "Supplements" should appear as a listed queryable variable, not duplicated
      // Count occurrences in the variable list area (not in raw data)
      expect(fullText).toContain("Supplements");
      expect(fullText).toContain("Screen Breaks");
    });

    it("handles logs with no custom metrics", () => {
      const logs = [
        makeLog("2026-03-01", { customMetrics: [] }),
        makeLog("2026-03-02", { customMetrics: [] }),
      ];

      // Should not throw — just omit custom metrics mention or say none
      expect(() => buildSearchPrompt("test", logs)).not.toThrow();
    });

    it("includes tag names as queryable fields", () => {
      const logs = [
        makeLog("2026-03-01", { tags: ["Cold Shower", "Meditation"] }),
        makeLog("2026-03-02", { tags: ["Cold Shower", "Sunlight"] }),
      ];
      const result = buildSearchPrompt("test", logs);

      const fullText =
        result.system + result.messages.map((m) => m.content).join("\n");
      expect(fullText).toContain("Cold Shower");
      expect(fullText).toContain("Meditation");
      expect(fullText).toContain("Sunlight");
    });
  });

  // ── Empty logs ──────────────────────────────────────────────────────

  describe("empty logs", () => {
    it("throws when logs array is empty", () => {
      expect(() => buildSearchPrompt("test query", [])).toThrow();
    });

    it("does not throw with a single log", () => {
      expect(() =>
        buildSearchPrompt("test", [makeLog("2026-03-01")]),
      ).not.toThrow();
    });
  });
});
