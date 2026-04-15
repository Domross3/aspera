import type { SearchResponse } from "../../types/search";

// The function under test — not yet implemented
import { parseSearchResponse } from "../searchResponseParser";

// ── Helpers ────────────────────────────────────────────────────────────

/** A minimal valid SearchResponse JSON string with all required fields. */
function validResponseJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    answer: "You focus 23% better on days you do yoga.",
    confidence: "high",
    sampleSize: 14,
    supportingDataPoints: [
      {
        date: "2026-03-10",
        relevantFields: {
          workout: { type: "yoga", intensity: 5 },
          output: { tasksCompleted: 9, focusRating: 8, energyRating: 7 },
        },
      },
    ],
    confounds: [
      { factor: "Yoga days also had higher sleep", impact: "moderate" },
    ],
    followUpQuestions: [
      "Does the type of yoga matter?",
      "How does yoga compare to running for focus?",
    ],
    ...overrides,
  });
}

/** Assert that a result is a structured error response (not a crash). */
function expectErrorResponse(result: SearchResponse): void {
  expect(result).toBeDefined();
  expect(typeof result.answer).toBe("string");
  expect(result.answer.length).toBeGreaterThan(0);
  expect(result.confidence).toBe("low");
  expect(result.sampleSize).toBe(0);
  expect(result.supportingDataPoints).toEqual([]);
  expect(result.confounds).toEqual([]);
  expect(result.followUpQuestions).toEqual([]);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("parseSearchResponse", () => {
  // ── Valid JSON ───────────────────────────────────────────────────────

  describe("valid JSON responses", () => {
    it("parses a well-formed JSON response into SearchResponse", () => {
      const raw = validResponseJson();
      const result = parseSearchResponse(raw);

      expect(result.answer).toBe("You focus 23% better on days you do yoga.");
      expect(result.confidence).toBe("high");
      expect(result.sampleSize).toBe(14);
      expect(result.supportingDataPoints).toHaveLength(1);
      expect(result.supportingDataPoints[0].date).toBe("2026-03-10");
      expect(result.confounds).toHaveLength(1);
      expect(result.confounds[0].factor).toBe(
        "Yoga days also had higher sleep",
      );
      expect(result.confounds[0].impact).toBe("moderate");
      expect(result.followUpQuestions).toHaveLength(2);
    });

    it("preserves all confidence levels", () => {
      for (const level of ["low", "medium", "high"] as const) {
        const result = parseSearchResponse(
          validResponseJson({ confidence: level }),
        );
        expect(result.confidence).toBe(level);
      }
    });

    it("handles empty arrays for optional collection fields", () => {
      const result = parseSearchResponse(
        validResponseJson({
          supportingDataPoints: [],
          confounds: [],
          followUpQuestions: [],
        }),
      );

      expect(result.supportingDataPoints).toEqual([]);
      expect(result.confounds).toEqual([]);
      expect(result.followUpQuestions).toEqual([]);
    });

    it("handles multiple supporting data points", () => {
      const points = [
        {
          date: "2026-03-10",
          relevantFields: { sleepHours: 8.2 },
        },
        {
          date: "2026-03-11",
          relevantFields: { sleepHours: 5.5 },
        },
        {
          date: "2026-03-12",
          relevantFields: { sleepHours: 7.0 },
        },
      ];
      const result = parseSearchResponse(
        validResponseJson({ supportingDataPoints: points }),
      );

      expect(result.supportingDataPoints).toHaveLength(3);
      expect(result.supportingDataPoints[0].date).toBe("2026-03-10");
      expect(result.supportingDataPoints[2].date).toBe("2026-03-12");
    });

    it("preserves confound impact levels", () => {
      const confounds = [
        { factor: "Small sample", impact: "major" },
        { factor: "Seasonal bias", impact: "minor" },
        { factor: "Weekend skew", impact: "moderate" },
      ];
      const result = parseSearchResponse(validResponseJson({ confounds }));

      expect(result.confounds).toHaveLength(3);
      expect(result.confounds[0].impact).toBe("major");
      expect(result.confounds[1].impact).toBe("minor");
      expect(result.confounds[2].impact).toBe("moderate");
    });
  });

  // ── Markdown-wrapped JSON ───────────────────────────────────────────

  describe("markdown-wrapped JSON", () => {
    it("extracts JSON from ```json ... ``` fences", () => {
      const raw = "```json\n" + validResponseJson() + "\n```";
      const result = parseSearchResponse(raw);

      expect(result.answer).toBe("You focus 23% better on days you do yoga.");
      expect(result.confidence).toBe("high");
      expect(result.sampleSize).toBe(14);
    });

    it("extracts JSON from ``` ... ``` fences without language tag", () => {
      const raw = "```\n" + validResponseJson() + "\n```";
      const result = parseSearchResponse(raw);

      expect(result.answer).toBe("You focus 23% better on days you do yoga.");
    });

    it("handles preamble text before fenced JSON", () => {
      const raw =
        "Here is the analysis:\n\n```json\n" + validResponseJson() + "\n```";
      const result = parseSearchResponse(raw);

      expect(result.answer).toBe("You focus 23% better on days you do yoga.");
      expect(result.sampleSize).toBe(14);
    });

    it("handles trailing text after fenced JSON", () => {
      const raw =
        "```json\n" +
        validResponseJson() +
        "\n```\n\nLet me know if you need more detail.";
      const result = parseSearchResponse(raw);

      expect(result.confidence).toBe("high");
    });

    it("handles JSON with surrounding whitespace", () => {
      const raw = "   \n\n  " + validResponseJson() + "  \n\n   ";
      const result = parseSearchResponse(raw);

      expect(result.answer).toBe("You focus 23% better on days you do yoga.");
    });
  });

  // ── Malformed JSON ──────────────────────────────────────────────────

  describe("malformed JSON", () => {
    it("returns error response for completely invalid text", () => {
      const result = parseSearchResponse(
        "I couldn't analyze that data, sorry!",
      );
      expectErrorResponse(result);
    });

    it("returns error response for truncated JSON", () => {
      const full = validResponseJson();
      const truncated = full.slice(0, Math.floor(full.length / 2));
      const result = parseSearchResponse(truncated);
      expectErrorResponse(result);
    });

    it("returns error response for empty string", () => {
      const result = parseSearchResponse("");
      expectErrorResponse(result);
    });

    it("returns error response for whitespace-only input", () => {
      const result = parseSearchResponse("   \n\t  ");
      expectErrorResponse(result);
    });

    it("returns error response for JSON array instead of object", () => {
      const result = parseSearchResponse('[{"answer": "test"}]');
      expectErrorResponse(result);
    });

    it("does not throw on any malformed input", () => {
      const badInputs = [
        "",
        "null",
        "undefined",
        "{{{{",
        '{"answer": }',
        "```json\nnot json\n```",
        "<html>response</html>",
        "Error: rate limited",
      ];

      for (const input of badInputs) {
        expect(() => parseSearchResponse(input)).not.toThrow();
      }
    });
  });

  // ── Missing required fields ─────────────────────────────────────────

  describe("missing required fields", () => {
    it("returns error response when answer is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.answer;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when confidence is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.confidence;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when sampleSize is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.sampleSize;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when supportingDataPoints is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.supportingDataPoints;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when confounds is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.confounds;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when followUpQuestions is missing", () => {
      const json = validResponseJson();
      const obj = JSON.parse(json);
      delete obj.followUpQuestions;
      const result = parseSearchResponse(JSON.stringify(obj));
      expectErrorResponse(result);
    });

    it("returns error response when answer is empty string", () => {
      const result = parseSearchResponse(validResponseJson({ answer: "" }));
      expectErrorResponse(result);
    });
  });

  // ── Confidence validation ───────────────────────────────────────────

  describe("confidence validation", () => {
    it("rejects invalid confidence value", () => {
      const result = parseSearchResponse(
        validResponseJson({ confidence: "very high" }),
      );
      expectErrorResponse(result);
    });

    it("rejects numeric confidence value", () => {
      const result = parseSearchResponse(
        validResponseJson({ confidence: 0.95 }),
      );
      expectErrorResponse(result);
    });

    it("rejects null confidence", () => {
      const result = parseSearchResponse(
        validResponseJson({ confidence: null }),
      );
      expectErrorResponse(result);
    });

    it("rejects capitalized confidence value", () => {
      const result = parseSearchResponse(
        validResponseJson({ confidence: "High" }),
      );
      expectErrorResponse(result);
    });
  });

  // ── Snake_case key normalization ─────────────────────────────────────
  // The prompt builder tells Claude to use camelCase, but Claude sometimes
  // returns snake_case keys. The parser should normalize them.

  describe("snake_case key normalization", () => {
    it("normalizes sample_size to sampleSize", () => {
      const json = JSON.stringify({
        answer: "Sleep correlates with focus.",
        confidence: "high",
        sample_size: 12,
        supporting_data_points: [],
        confounds: [],
        follow_up_questions: ["Try more sleep?"],
      });
      const result = parseSearchResponse(json);

      expect(result.sampleSize).toBe(12);
    });

    it("normalizes supporting_data_points to supportingDataPoints", () => {
      const json = JSON.stringify({
        answer: "You focus better after yoga.",
        confidence: "medium",
        sample_size: 7,
        supporting_data_points: [
          {
            date: "2026-03-10",
            relevant_fields: { sleepHours: 8 },
          },
        ],
        confounds: [],
        follow_up_questions: [],
      });
      const result = parseSearchResponse(json);

      expect(result.supportingDataPoints).toHaveLength(1);
      expect(result.supportingDataPoints[0].date).toBe("2026-03-10");
    });

    it("normalizes follow_up_questions to followUpQuestions", () => {
      const json = JSON.stringify({
        answer: "Caffeine helps.",
        confidence: "low",
        sample_size: 3,
        supporting_data_points: [],
        confounds: [],
        follow_up_questions: ["What about decaf?", "Does timing matter?"],
      });
      const result = parseSearchResponse(json);

      expect(result.followUpQuestions).toEqual([
        "What about decaf?",
        "Does timing matter?",
      ]);
    });

    it("handles a fully snake_case response", () => {
      const json = JSON.stringify({
        answer: "Running boosts energy by 30%.",
        confidence: "high",
        sample_size: 21,
        supporting_data_points: [
          {
            date: "2026-03-05",
            relevant_fields: {
              workout: { type: "run", intensity: 7 },
            },
          },
        ],
        confounds: [{ factor: "Weather not controlled", impact: "minor" }],
        follow_up_questions: ["Morning vs evening runs?"],
      });
      const result = parseSearchResponse(json);

      expect(result.answer).toBe("Running boosts energy by 30%.");
      expect(result.confidence).toBe("high");
      expect(result.sampleSize).toBe(21);
      expect(result.supportingDataPoints).toHaveLength(1);
      expect(result.confounds).toHaveLength(1);
      expect(result.followUpQuestions).toHaveLength(1);
    });

    it("prefers camelCase when both casings are present", () => {
      const json = JSON.stringify({
        answer: "Test.",
        confidence: "high",
        sampleSize: 10,
        sample_size: 5,
        supportingDataPoints: [],
        supporting_data_points: [{ date: "2026-01-01", relevantFields: {} }],
        confounds: [],
        followUpQuestions: ["A?"],
        follow_up_questions: ["B?"],
      });
      const result = parseSearchResponse(json);

      expect(result.sampleSize).toBe(10);
      expect(result.supportingDataPoints).toEqual([]);
      expect(result.followUpQuestions).toEqual(["A?"]);
    });
  });

  // ── sampleSize validation ───────────────────────────────────────────

  describe("sampleSize validation", () => {
    it("accepts a positive integer", () => {
      const result = parseSearchResponse(validResponseJson({ sampleSize: 7 }));
      expect(result.sampleSize).toBe(7);
    });

    it("rejects zero", () => {
      const result = parseSearchResponse(validResponseJson({ sampleSize: 0 }));
      expectErrorResponse(result);
    });

    it("rejects negative numbers", () => {
      const result = parseSearchResponse(validResponseJson({ sampleSize: -3 }));
      expectErrorResponse(result);
    });

    it("rejects floating-point numbers", () => {
      const result = parseSearchResponse(
        validResponseJson({ sampleSize: 7.5 }),
      );
      expectErrorResponse(result);
    });

    it("rejects string numbers", () => {
      const result = parseSearchResponse(
        validResponseJson({ sampleSize: "14" }),
      );
      expectErrorResponse(result);
    });

    it("rejects null sampleSize", () => {
      const result = parseSearchResponse(
        validResponseJson({ sampleSize: null }),
      );
      expectErrorResponse(result);
    });
  });
});
