import type {
  ConfidenceLevel,
  Confound,
  SearchResponse,
  SupportingDataPoint,
} from "../types/search";

const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>(["low", "medium", "high"]);
const CONFOUND_IMPACTS = new Set<Confound["impact"]>([
  "minor",
  "moderate",
  "major",
]);

function createErrorResponse(
  message: string = "I couldn't interpret the search results. Please try again.",
): SearchResponse {
  return {
    answer: message,
    confidence: "low",
    sampleSize: 0,
    supportingDataPoints: [],
    confounds: [],
    followUpQuestions: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function takeField(
  record: Record<string, unknown>,
  camelCaseKey: string,
  snakeCaseKey?: string,
): unknown {
  if (camelCaseKey in record) return record[camelCaseKey];
  if (snakeCaseKey && snakeCaseKey in record) return record[snakeCaseKey];
  return undefined;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractBalancedJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (start === -1) {
      if (character === "{") {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return null;
}

function parseJsonCandidate(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = new Set<string>();
  candidates.add(trimmed);
  candidates.add(stripCodeFences(trimmed));

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    candidates.add(fencedMatch[1].trim());
  }

  for (const candidate of Array.from(candidates)) {
    const balanced = extractBalancedJsonObject(candidate);
    if (balanced) {
      candidates.add(balanced);
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      continue;
    }
  }

  return null;
}

const RESERVED_DATA_POINT_KEYS = new Set([
  "date",
  "relevantFields",
  "relevant_fields",
  "moodCheckIns",
  "mood_check_ins",
  "note",
  "notes",
]);

function normalizeSupportingDataPoint(
  value: unknown,
): SupportingDataPoint | null {
  if (!isRecord(value)) return null;

  const date = takeField(value, "date");
  const explicitRelevantFields = takeField(
    value,
    "relevantFields",
    "relevant_fields",
  );
  const moodCheckIns = takeField(value, "moodCheckIns", "mood_check_ins");

  if (typeof date !== "string" || date.trim().length === 0) return null;

  // Accept either the nested `relevantFields` shape or a flat object where
  // data-point fields sit alongside `date`. Claude often produces the flat form.
  let relevantFields: Record<string, unknown> | null = null;
  if (isRecord(explicitRelevantFields)) {
    relevantFields = explicitRelevantFields;
  } else if (explicitRelevantFields === undefined) {
    const flattened: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (RESERVED_DATA_POINT_KEYS.has(key)) continue;
      flattened[key] = child;
    }
    if (Object.keys(flattened).length > 0) {
      relevantFields = flattened;
    }
  }

  if (!relevantFields) return null;

  const normalized: SupportingDataPoint = {
    date,
    relevantFields: relevantFields as SupportingDataPoint["relevantFields"],
  };

  if (moodCheckIns !== undefined) {
    if (!Array.isArray(moodCheckIns)) return null;

    const parsedMoodCheckIns = moodCheckIns.map((entry) => {
      if (!isRecord(entry)) return null;

      const mood = takeField(entry, "mood");
      const energy = takeField(entry, "energy");
      const stress = takeField(entry, "stress");
      const note = takeField(entry, "note");

      if (
        typeof mood !== "number" ||
        typeof energy !== "number" ||
        typeof stress !== "number"
      ) {
        return null;
      }

      if (note !== undefined && typeof note !== "string") {
        return null;
      }

      return {
        mood,
        energy,
        stress,
        ...(note !== undefined ? { note } : {}),
      };
    });

    if (parsedMoodCheckIns.some((entry) => entry === null)) return null;

    normalized.moodCheckIns = parsedMoodCheckIns as NonNullable<
      SupportingDataPoint["moodCheckIns"]
    >;
  }

  return normalized;
}

function normalizeConfound(value: unknown): Confound | null {
  if (!isRecord(value)) return null;

  const factor = takeField(value, "factor");
  const impact = takeField(value, "impact");
  const explanation = takeField(value, "explanation", "detail");

  if (typeof factor !== "string" || factor.trim().length === 0) return null;
  if (
    typeof impact !== "string" ||
    !CONFOUND_IMPACTS.has(impact as Confound["impact"])
  ) {
    return null;
  }

  const normalized: Confound = {
    factor,
    impact: impact as Confound["impact"],
  };
  if (typeof explanation === "string" && explanation.trim().length > 0) {
    normalized.explanation = explanation.trim();
  }

  return normalized;
}

function coerceSearchResponse(value: unknown): SearchResponse | null {
  if (!isRecord(value)) return null;

  const answer = takeField(value, "answer");
  const confidence = takeField(value, "confidence");
  const sampleSize = takeField(value, "sampleSize", "sample_size");
  const supportingDataPoints = takeField(
    value,
    "supportingDataPoints",
    "supporting_data_points",
  );
  const confounds = takeField(value, "confounds");
  const followUpQuestions = takeField(
    value,
    "followUpQuestions",
    "follow_up_questions",
  );

  if (typeof answer !== "string" || answer.trim().length === 0) return null;
  if (
    typeof confidence !== "string" ||
    !CONFIDENCE_LEVELS.has(confidence as ConfidenceLevel)
  ) {
    return null;
  }
  if (!Number.isInteger(sampleSize) || (sampleSize as number) <= 0) return null;
  if (!Array.isArray(supportingDataPoints)) return null;
  if (!Array.isArray(confounds)) return null;
  if (!Array.isArray(followUpQuestions)) return null;

  const normalizedPoints = supportingDataPoints.map((point) =>
    normalizeSupportingDataPoint(point),
  );
  const normalizedConfounds = confounds.map((confound) =>
    normalizeConfound(confound),
  );

  if (normalizedPoints.some((point) => point === null)) return null;
  if (normalizedConfounds.some((confound) => confound === null)) return null;
  if (followUpQuestions.some((question) => typeof question !== "string"))
    return null;

  return {
    answer,
    confidence: confidence as ConfidenceLevel,
    sampleSize: sampleSize as number,
    supportingDataPoints: normalizedPoints as SupportingDataPoint[],
    confounds: normalizedConfounds as Confound[],
    followUpQuestions: followUpQuestions as string[],
  };
}

export function parseSearchResponse(raw: string): SearchResponse {
  try {
    const parsed = parseJsonCandidate(raw);
    const normalized = coerceSearchResponse(parsed);
    return normalized ?? createErrorResponse();
  } catch {
    return createErrorResponse();
  }
}
