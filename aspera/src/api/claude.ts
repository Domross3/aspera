import { callClaudeViaProxy } from "./claudeProxy";
import { DailyLog, InsightsResponse, Moment } from "../types";
// Mock-data imports intentionally removed: insights, the morning briefing,
// and the anxious-reappraisal cohort line all flow off REAL user data now.
// `src/lib/mockData.ts` remains in the codebase as scaffolding for future
// real integrations (Spotify, HealthKit, Calendar) but nothing in the
// runtime should pull from it — that way the user sees the actual state
// of their data and knows exactly what's missing.
import type { CohortTelemetry } from "../lib/mockData";
import { readScreenTimeTotals } from "../lib/screenTime/bridge";
import { formatScreenTimeBlock } from "../lib/screenTime/prompt";
import type { ScreenTimeDayTotals } from "../lib/screenTime/types";
import { getRecentMoments } from "../storage/storage";

export { formatScreenTimeBlock } from "../lib/screenTime/prompt";

// Cap the moments block in the insights prompt to keep payload bounded.
// 50 short labels is comfortably under any reasonable token budget.
const MAX_MOMENTS_IN_PROMPT = 50;

function formatMomentsBlock(moments: Moment[]): string {
  if (moments.length === 0) return "";
  const recent = [...moments]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_MOMENTS_IN_PROMPT)
    .reverse(); // chronological for the prompt
  const lines = recent.map((m) => {
    const stamp = new Date(m.timestamp)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");
    const dur = m.duration ? ` (${m.duration} min)` : "";
    const note = m.note ? ` · ${m.note}` : "";
    return `${stamp} — ${m.label}${dur}${note}`;
  });
  return `\nMOMENTS (last 7 days, max ${MAX_MOMENTS_IN_PROMPT}):\n${lines.join("\n")}\n`;
}

// ── Aspera Voice ────────────────────────────────────────────────────────
// One consistent character across every AI surface. Models the "Inner Coach"
// research pattern — a benign external voice that gives the user permission
// to develop self-kindness. Intensity modulates via SELF_COMPASSION_PREFIX
// below; tone never changes.
//
// The JSON-output instructions are tacked on per-callsite because not every
// caller needs structured output (e.g., briefing returns prose).

export const ASPERA_VOICE = `You are Aspera — the user's quiet, attentive relationship manager. You speak to the user the way a thoughtful, slightly-older friend who happens to be a behavioral scientist would: warm but never effusive, specific over generic, curious not declarative.

Voice rules (always):
- Cite the user's actual data. Real numbers ("sleep was 6.2"), real times ("yesterday at 3pm"), not "lately" or "recently."
- Lead with observation, not prescription. "I noticed" not "you should." "Might be unrelated, but..." over "this means..."
- Reserved about telling them what to do. You are a benign external voice, not a coach barking orders.
- Warm without performing warmth. No emojis as decoration. No "you've got this!" energy. No "great job."
- Self-effacing about your own conclusions. Floats hypotheses, doesn't pronounce verdicts.
- Brief by default. A sentence is usually enough. Elaboration on request, not by default.
- Never moralize. Never finger-wag. Never shame a missed day.

Your job is to be the kind of inner voice the user might struggle to be for themselves — the gentle, accurate one that gives them permission to take care of themselves without scolding.`;

const INSIGHTS_JSON_DIRECTIVE = `You MUST respond with ONLY valid JSON matching the exact schema provided. Do not include markdown fences, explanations, or any text outside the JSON.`;

// ── Self-Compassion Layer ───────────────────────────────────────────────
// Applied as a prefix when the user's week was rough.
// Uses three pillars: Self-Kindness, Common Humanity, Mindfulness.

function detectBadWeek(logs: DailyLog[]): boolean {
  // Only days the user explicitly rated count — auto-seeded 5/5/0 shells
  // would otherwise drag the average toward a false "okay" reading.
  const rated = logs.filter((l) => l.outputRated !== false);
  if (rated.length < 3) return false;
  const avgFocus =
    rated.reduce((s, l) => s + l.output.focusRating, 0) / rated.length;
  const avgEnergy =
    rated.reduce((s, l) => s + l.output.energyRating, 0) / rated.length;
  // Ratings are on a 1–5 scale; below the 3 midpoint is a genuinely rough
  // stretch (was `< 5` back when the scale ran 1–10).
  return avgFocus < 3 || avgEnergy < 3;
}

const SELF_COMPASSION_PREFIX = `IMPORTANT INTENSITY MODULATION: The user's data indicates a difficult stretch — low energy or focus across recent days. Soften your voice further than baseline:
- Self-Kindness: Acknowledge the struggle without judgment. Do NOT guilt-trip or shame.
- Common Humanity: Remind them that difficult stretches are universal — everyone goes through them.
- Mindfulness: Note the data patterns without catastrophizing or over-dramatizing.
Open with acknowledgment. Any recommendation must be a single small, low-effort action to rebuild momentum. Never say "you failed" or "you need to do better."
`;

const INSIGHTS_MAX_TOKENS = 2200;
const INSIGHTS_RETRY_MAX_TOKENS = 2800;

// ── Insights Generation ─────────────────────────────────────────────────

function buildInsightsPrompt(
  logs: DailyLog[],
  moments: Moment[] = [],
  screenTimeTotals: ScreenTimeDayTotals[] = [],
): string {
  const exampleResponse = {
    summary: "Exactly 2 concise sentences summarizing the user's patterns",
    correlations: [
      {
        id: "example-slug",
        emoji: "🎯",
        title: "Short catchy title",
        description: "1 concise sentence with specific numbers from the data",
        inputFactors: ["caffeine", "music"],
        outputMetric: "focus",
        delta: 2.5,
        confidence: "high",
        isKeystone: false,
      },
    ],
    topRecommendation: "Single actionable sentence starting with a verb",
    weeklyTrends: [
      {
        date: "2026-03-22",
        dayLabel: "Sun",
        focusRating: 4,
        energyRating: 4,
        tasksCompleted: 9,
      },
    ],
    generatedAt: Date.now(),
  };

  // Extract Big Rocks data for analysis
  const bigRocksContext = logs
    .filter((l) => l.bigRocks && l.bigRocks.length > 0)
    .map((l) => ({
      date: l.date,
      bigRocks: l.bigRocks,
      tasksCompleted: l.output.tasksCompleted,
      focusRating: l.output.focusRating,
    }));

  return `Analyze this user's lifestyle and performance data.
Identify 3–5 correlations between their inputs and outputs — using ONLY the
self-reported data below. Do not invent integrations (Spotify, HealthKit,
Calendar, browsing telemetry) that aren't present in the data. If the data
is too sparse to support 3 correlations, return fewer.

DAILY LOGS (self-reported):
${JSON.stringify(logs, null, 2)}

${
  bigRocksContext.length > 0
    ? `BIG ROCKS (user's stated top priorities per day):
${JSON.stringify(bigRocksContext, null, 2)}

Analyze whether the user's task output and focus scores are higher on days they set Big Rocks vs. days they didn't.
If so, note this as a correlation.
`
    : ""
}
${formatMomentsBlock(moments)}
${formatScreenTimeBlock(screenTimeTotals)}
KEYSTONE HABIT DETECTION:
Look for habits that create positive cascading effects across multiple outputs.
A Keystone Habit is a single input that, when present, correlates with improvements in 2+ output metrics simultaneously.
For example: "Morning workout" might correlate with higher focus AND higher energy AND more tasks completed.
Mark exactly ONE correlation as a Keystone Habit by setting "isKeystone": true. The rest should be false.
In that correlation's description, explicitly call out the cascading/spillover effects.

Rules for outputMetric: must be exactly one of "focus", "energy", or "tasks".
Rules for confidence: must be exactly one of "low", "medium", or "high".
Rules for isKeystone: must be a boolean (true or false). Exactly one correlation should be true.
Include 3-5 correlations and exactly 7 weeklyTrends entries (one per day of recent logs).
Keep the response concise:
- summary: exactly 2 sentences
- each correlation description: exactly 1 sentence
- no extra keys beyond the schema

Respond ONLY with valid JSON. No markdown fences. No text before or after. Here is an example of the exact JSON format:
${JSON.stringify(exampleResponse, null, 2)}`;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractTextBlocks(
  content: ReadonlyArray<{ type: string; text?: string }>,
): string {
  return content
    .filter(
      (block): block is { type: string; text: string } =>
        block.type === "text" && typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function extractBalancedJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (start === -1) {
      if (char === "{") {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function removeTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function parseJsonCandidate(text: string): unknown | null {
  const stripped = stripCodeFences(text);
  if (!stripped) return null;

  const candidates = new Set<string>();
  candidates.add(stripped);

  const balanced = extractBalancedJsonObject(stripped);
  if (balanced) candidates.add(balanced);

  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.add(stripped.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    const sanitized = removeTrailingCommas(candidate).trim();
    try {
      return JSON.parse(sanitized) as unknown;
    } catch {
      continue;
    }
  }

  return null;
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function getDayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Day";
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
}

function buildWeeklyTrendsFromLogs(
  logs: DailyLog[],
): InsightsResponse["weeklyTrends"] {
  return [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((log) => ({
      date: log.date,
      dayLabel: getDayLabel(log.date),
      focusRating: log.output.focusRating,
      energyRating: log.output.energyRating,
      tasksCompleted: log.output.tasksCompleted,
    }));
}

function normalizeCorrelations(raw: unknown): InsightsResponse["correlations"] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const entry = item as Record<string, unknown>;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const description =
        typeof entry.description === "string" ? entry.description.trim() : "";

      if (!title || !description) return null;

      const outputMetric = entry.outputMetric;
      const confidence = entry.confidence;
      const delta =
        typeof entry.delta === "number" && Number.isFinite(entry.delta)
          ? entry.delta
          : 0;

      return {
        id:
          typeof entry.id === "string" && entry.id.trim()
            ? entry.id
            : slugify(title, `correlation-${index + 1}`),
        emoji:
          typeof entry.emoji === "string" && entry.emoji.trim()
            ? entry.emoji
            : "📊",
        title,
        description,
        inputFactors: Array.isArray(entry.inputFactors)
          ? entry.inputFactors.filter(
              (factor): factor is string =>
                typeof factor === "string" && factor.trim().length > 0,
            )
          : [],
        outputMetric:
          outputMetric === "focus" ||
          outputMetric === "energy" ||
          outputMetric === "tasks"
            ? outputMetric
            : "focus",
        delta,
        confidence:
          confidence === "low" ||
          confidence === "medium" ||
          confidence === "high"
            ? confidence
            : "medium",
        isKeystone: Boolean(entry.isKeystone),
      };
    })
    .filter(Boolean) as InsightsResponse["correlations"];

  if (normalized.length === 0) return [];

  const keystoneCount = normalized.filter((item) => item.isKeystone).length;
  if (keystoneCount === 1) return normalized;

  return normalized.map((item, index) => ({
    ...item,
    isKeystone: index === 0,
  }));
}

function normalizeWeeklyTrends(
  raw: unknown,
  logs: DailyLog[],
): InsightsResponse["weeklyTrends"] {
  if (!Array.isArray(raw)) return buildWeeklyTrendsFromLogs(logs);

  const normalized = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const entry = item as Record<string, unknown>;
      const date =
        typeof entry.date === "string" && entry.date.trim() ? entry.date : "";
      if (!date) return null;

      return {
        date,
        dayLabel:
          typeof entry.dayLabel === "string" && entry.dayLabel.trim()
            ? entry.dayLabel
            : getDayLabel(date),
        focusRating:
          typeof entry.focusRating === "number" &&
          Number.isFinite(entry.focusRating)
            ? entry.focusRating
            : 0,
        energyRating:
          typeof entry.energyRating === "number" &&
          Number.isFinite(entry.energyRating)
            ? entry.energyRating
            : 0,
        tasksCompleted:
          typeof entry.tasksCompleted === "number" &&
          Number.isFinite(entry.tasksCompleted)
            ? entry.tasksCompleted
            : 0,
      };
    })
    .filter(Boolean) as InsightsResponse["weeklyTrends"];

  return normalized.length === 7 ? normalized : buildWeeklyTrendsFromLogs(logs);
}

function coerceInsightsResponse(
  raw: unknown,
  logs: DailyLog[],
): InsightsResponse | null {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Record<string, unknown>;
  const summary = typeof entry.summary === "string" ? entry.summary.trim() : "";
  const topRecommendation =
    typeof entry.topRecommendation === "string"
      ? entry.topRecommendation.trim()
      : "";
  const correlations = normalizeCorrelations(entry.correlations);

  if (!summary || !topRecommendation || correlations.length === 0) {
    return null;
  }

  return {
    summary,
    correlations,
    topRecommendation,
    weeklyTrends: normalizeWeeklyTrends(entry.weeklyTrends, logs),
    generatedAt:
      typeof entry.generatedAt === "number" &&
      Number.isFinite(entry.generatedAt)
        ? entry.generatedAt
        : Date.now(),
  };
}

function buildRetryPrompt(basePrompt: string): string {
  return `${basePrompt}

RETRY FORMAT RULES:
- Return one JSON object only
- Do not use markdown fences
- Keep the JSON compact and concise
- Keep each correlation description to one sentence`;
}

export async function generateInsights(
  logs: DailyLog[],
): Promise<InsightsResponse> {
  // Pull recent moments into the prompt so Claude can spot patterns
  // (e.g. "you nap outside on high-energy days") alongside the structured
  // daily-log data. Capped at MAX_MOMENTS_IN_PROMPT inside the formatter.
  let recentMoments: Moment[] = [];
  let screenTimeTotals: ScreenTimeDayTotals[] = [];
  try {
    recentMoments = await getRecentMoments(7);
  } catch (err) {
    console.warn("[insights] could not load recent moments", err);
  }
  try {
    screenTimeTotals = await readScreenTimeTotals();
  } catch (err) {
    console.warn("[insights] could not load Screen Time totals", err);
  }

  // Aspera voice + JSON output directive. Optional self-compassion prefix
  // engages automatically when the user's week looks rough.
  let systemPrompt = `${ASPERA_VOICE}\n\n${INSIGHTS_JSON_DIRECTIVE}`;
  if (detectBadWeek(logs)) {
    systemPrompt = SELF_COMPASSION_PREFIX + "\n\n" + systemPrompt;
  }
  if (recentMoments.length > 0) {
    systemPrompt = `${systemPrompt}\n\nIf the user's recent moments reveal patterns or notable events (long naps, social conflicts, sleep disruptions, unusual choices), surface them in your summary and reference them in correlations alongside the structured daily-log data.`;
  }
  const basePrompt = buildInsightsPrompt(logs, recentMoments, screenTimeTotals);
  const prompts = [basePrompt, buildRetryPrompt(basePrompt)];
  const maxTokens = [INSIGHTS_MAX_TOKENS, INSIGHTS_RETRY_MAX_TOKENS];
  let lastRawResponse = "";

  for (let attempt = 0; attempt < prompts.length; attempt += 1) {
    const message = await callClaudeViaProxy({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens[attempt],
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: prompts[attempt] }],
    });

    const rawText = extractTextBlocks(message.content);
    lastRawResponse = rawText;

    const parsed = coerceInsightsResponse(parseJsonCandidate(rawText), logs);
    if (parsed) {
      return parsed;
    }

    console.warn("Failed to parse Claude insights response", {
      attempt: attempt + 1,
      stopReason: message.stop_reason,
      preview: rawText.slice(0, 240),
    });
  }

  console.error(
    "Claude insights parsing failed after retry",
    lastRawResponse.slice(0, 1000),
  );
  throw new Error(
    "The AI returned an incomplete insights response. Please tap Generate again.",
  );
}

// ── Morning Briefing ────────────────────────────────────────────────────
// Living Briefing v1: 2-3 sentence narrative in the Aspera voice that opens
// the user's day. Cites actual data from the last 24h, references today's
// Big Rocks if set, and floats a gentle pattern heads-up. Replaces the
// previous one-sentence "Today recommendation."

export async function getMorningBriefing(
  log: DailyLog | null,
  recentLogs: DailyLog[],
): Promise<string> {
  const context = log ?? recentLogs[0];
  if (!context) {
    return "Once we have a day or two of data, your briefing will appear here. For now, head to the Log tab and tell me about today.";
  }

  const isBadWeek = detectBadWeek(recentLogs);
  const baseVoice = ASPERA_VOICE;
  const systemPrompt = isBadWeek
    ? `${baseVoice}\n\n${SELF_COMPASSION_PREFIX}`
    : baseVoice;

  const bigRocksInfo =
    context.bigRocks && context.bigRocks.length > 0
      ? `Today's focus: ${context.bigRocks.join(" · ")}`
      : "No focus set today yet.";

  const yesterday = recentLogs.find((l) => l.id !== context.id) ?? null;
  const yesterdaySummary = yesterday
    ? `Yesterday — sleep: ${yesterday.sleepHours}h, focus: ${yesterday.output.focusRating}/5, energy: ${yesterday.output.energyRating}/5, tasks: ${yesterday.output.tasksCompleted}.`
    : "No prior-day log to reference.";

  const reflectionNote = (
    yesterday as (DailyLog & { reflectionNote?: string }) | null
  )?.reflectionNote;
  const reflection = reflectionNote
    ? `Yesterday's wrap note: "${reflectionNote}"`
    : "";

  // Completion tracking (bigRockOutcomes) was removed in the Log redesign —
  // relevance, not completion. The briefing no longer references per-focus
  // done/partial/missed.

  try {
    const message = await callClaudeViaProxy({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Write today's morning briefing (2–3 sentences) for the user. Open by grounding in real data from the last 24 hours. Reference Big Rocks if they're set. Float at most one gentle heads-up about a likely pattern, only if the data supports it.

Context:
${bigRocksInfo}
${yesterdaySummary}
${reflection}
Today's log so far: ${JSON.stringify({
            sleep: context.sleepHours,
            daylight: context.daylightMinutes,
            mood: context.output,
          })}

Format: 2–3 sentences. Speak only from the data above — do NOT mention integrations (Spotify, HealthKit, Calendar) we don't have. No headers, no markdown, no preamble like "Here's your briefing." Just speak as Aspera.`,
        },
      ],
    });

    return (message.content[0] as { type: string; text: string }).text.trim();
  } catch {
    // Proxy unreachable (the key/proxy is currently flaky in prod). The
    // morning must not break — fall back to a local, deterministic briefing
    // composed from the same local data. Focuses lead the screen regardless;
    // this just keeps the briefing card sensible instead of an error.
    return localMorningBriefing(context, recentLogs);
  }
}

// Local, no-network briefing used when the Claude proxy is unreachable.
// Deterministic and grounded in the same local data the prompt would use.
function localMorningBriefing(
  context: DailyLog,
  recentLogs: DailyLog[],
): string {
  const rocks = context.bigRocks?.filter((r) => r.trim().length > 0) ?? [];
  const yesterday = recentLogs.find((l) => l.id !== context.id) ?? null;

  const opener =
    yesterday && typeof yesterday.sleepHours === "number" && yesterday.sleepHours > 0
      ? `You logged about ${yesterday.sleepHours}h of sleep.`
      : "A fresh day to work with.";

  const focusLine =
    rocks.length > 0
      ? ` Your focus today: ${rocks.join(" · ")}.`
      : " Nothing set as today's focus yet — name one or two things that would make today feel worthwhile.";

  return `${opener}${focusLine}`;
}

// Backward-compat shim. Existing callers can keep using this name; it
// just delegates to the new briefing function. Remove in a follow-up.
export const getTodayRecommendation = getMorningBriefing;

// ── Anxious Reappraisal ──────────────────────────────────────────────────

export async function generateAnxiousReappraisal(
  feeling: string,
  bigRocks: string[],
  // Cohort telemetry was previously synthesized from mock data — kept as
  // optional so callers can still pass real cohort context when we have
  // it. Today's caller passes undefined and the line is dropped.
  cohortTelemetry?: CohortTelemetry,
): Promise<string> {
  const cohortLine = cohortTelemetry
    ? `Cohort context: ${cohortTelemetry.missedBigRockCount > 0 ? `${cohortTelemetry.missedBigRockCount} other users also missed a Big Rock today.` : ""} ${cohortTelemetry.commonStruggle}. ${cohortTelemetry.streakContext}.`
    : "";
  const message = await callClaudeViaProxy({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    temperature: 0.3,
    system: `You are a somatic-aware cognitive reappraisal coach. The user is stuck in a procrastination/anxiety loop.
Your job is NOT to motivate. It is to help them NAME the feeling, then give them ONE tiny physical action to break the loop.
Respond with exactly two sentences:
1. A compassionate reframe of their feeling (use "Common Humanity" — remind them this is universal)
2. A single micro-action they can do in the next 60 seconds (e.g., "Stand up, walk to the window, and take three breaths.")
Do NOT mention productivity, goals, or optimization. This is about breaking the somatic freeze response.`,
    messages: [
      {
        role: "user",
        content: `I'm feeling: "${feeling}"

My Big Rocks for today: ${bigRocks.length > 0 ? bigRocks.join(", ") : "None set"}
${cohortLine}

Help me break out of this loop.`,
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text.trim();
}
