import type { DailyLog } from "../types";

type SearchPromptMessage = {
  role: "user";
  content: string;
};

export interface SearchPromptConfig {
  system: string;
  /** Stable, cacheable prefix (log payload + framing). Send with cache_control. */
  logsContent: string;
  /** Per-query suffix (the user's question). Do not cache. */
  questionContent: string;
  /** Legacy single-string shape kept for tests and non-cached callers. */
  messages: SearchPromptMessage[];
}

const COMPRESSION_THRESHOLD = 50;

function stripNullishDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripNullishDeep(item))
      .filter((item) => item !== null && item !== undefined);
  }

  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (child === null || child === undefined) continue;
      cleaned[key] = stripNullishDeep(child);
    }
    return cleaned;
  }

  return value;
}

function compressLog(log: DailyLog): Record<string, unknown> {
  return stripNullishDeep({
    d: log.date,
    c: { t: log.caffeine.type, a: log.caffeine.amount },
    w: { t: log.workout.type, i: log.workout.intensity },
    m: log.music,
    n: { q: log.nutrition.mealQuality, h: log.nutrition.hydration },
    dr: log.drinks,
    sh: log.sleepHours,
    dm: log.daylightMinutes,
    cm: log.customMetrics.map((metric) => ({
      n: metric.name,
      v: metric.value,
    })),
    cv: log.customMetricValues,
    o: {
      t: log.output.tasksCompleted,
      f: log.output.focusRating,
      e: log.output.energyRating,
    },
    tg: log.tags,
    br: log.bigRocks,
  }) as Record<string, unknown>;
}

function collectUniqueValues(
  logs: DailyLog[],
  selector: (log: DailyLog) => string[],
): string[] {
  return Array.from(
    new Set(
      logs.flatMap((log) =>
        selector(log)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function buildSystemPrompt(
  customMetricNames: string[],
  tagNames: string[],
  compressed: boolean,
): string {
  const lines = [
    "You are a careful analyst of personal daily logs.",
    "Answer the user's question using ONLY the provided data.",
    "Respond with ONLY valid JSON. Do not use markdown fences or any preamble.",
    "Return exactly these camelCase keys:",
    "- answer",
    "- confidence",
    "- sampleSize",
    "- supportingDataPoints",
    "- confounds",
    "- followUpQuestions",
    'confidence must be exactly one of "low", "medium", or "high".',
    "sampleSize must be a positive integer equal to the number of days actually used.",
    "If the sample size is small, evidence is mixed, or confounds are meaningful, lower confidence and say so.",
    "Always include confounds when there is a realistic alternative explanation.",
    'Each confound must use an impact of "minor", "moderate", or "major".',
    'Each confound should also include an "explanation" string (1–2 sentences) that cites the specific dates or fields supporting the alternative cause.',
    'Each supportingDataPoint must have this exact shape: { "date": "YYYY-MM-DD", "relevantFields": { ...only the fields relevant to the answer... } }. Do NOT flatten the fields alongside `date` — always nest them inside `relevantFields`.',
  ];

  if (customMetricNames.length > 0) {
    lines.push(
      `Custom metrics available in the logs: ${customMetricNames.join(", ")}.`,
    );
  }

  if (tagNames.length > 0) {
    lines.push(`Tag values available in the logs: ${tagNames.join(", ")}.`);
  }

  if (compressed) {
    lines.push(
      "The log payload is compressed for token efficiency. Legend: d=date, c=caffeine, w=workout, m=music, n=nutrition, dr=drinks, sh=sleep hours, dm=daylight minutes, cm=custom metrics, cv=custom metric values, o=output, tg=tags, br=big rocks.",
    );
    lines.push(
      "Nested legend: c.t/type, c.a/amount, w.t/type, w.i/intensity, n.q/meal quality, n.h/hydration, o.t/tasks completed, o.f/focus rating, o.e/energy rating.",
    );
  }

  return lines.join("\n");
}

function serializeLogs(logs: DailyLog[]): {
  compressed: boolean;
  payload: string;
} {
  if (logs.length > COMPRESSION_THRESHOLD) {
    const compressedLogs = logs.map((log) => compressLog(log));
    return {
      compressed: true,
      payload: JSON.stringify(compressedLogs),
    };
  }

  return {
    compressed: false,
    payload: JSON.stringify(stripNullishDeep(logs), null, 2),
  };
}

export function buildSearchPrompt(
  query: string,
  logs: DailyLog[],
): SearchPromptConfig {
  if (logs.length === 0) {
    throw new Error("buildSearchPrompt requires at least one log.");
  }

  const customMetricNames = collectUniqueValues(logs, (log) =>
    log.customMetrics.map((metric) => metric.name),
  );
  const tagNames = collectUniqueValues(logs, (log) => log.tags);
  const { compressed, payload } = serializeLogs(logs);

  const system = buildSystemPrompt(customMetricNames, tagNames, compressed);

  // Structure content so the cacheable prefix comes first. Prompt caching
  // requires an exact-match prefix, and the logs are stable across queries
  // in the same session while the question varies per call.
  const logsContent = [
    `Days provided: ${logs.length}`,
    compressed
      ? "Logs are compressed JSON using the legend from the system prompt."
      : "Logs are provided as full JSON.",
    "Daily logs:",
    payload,
  ].join("\n\n");

  const questionContent = `User question: ${query}`;
  const combinedContent = `${logsContent}\n\n${questionContent}`;

  return {
    system,
    logsContent,
    questionContent,
    messages: [{ role: "user", content: combinedContent }],
  };
}
