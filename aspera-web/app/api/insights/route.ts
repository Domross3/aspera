import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { DailyLog, InsightsResponse } from "@/types";
import { getMockContext, BrowsingDay, BrowsingSite } from "@/lib/mockData";
import { getDailyIntegrationSummaries } from "@/lib/integrations";

const BROWSING_FILE = "/tmp/aspera-browsing.json";

async function loadRealBrowsingData(): Promise<BrowsingDay[] | null> {
  try {
    const raw = await fs.readFile(BROWSING_FILE, "utf8");
    const stored = JSON.parse(raw) as Record<string, unknown>;
    const days: BrowsingDay[] = [];
    for (const [date, entry] of Object.entries(stored)) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const rawSites = e.sites;
      if (!rawSites || typeof rawSites !== "object" || Array.isArray(rawSites)) continue;
      const sitesObj = rawSites as Record<string, { time: number; category: string; visits: number }>;
      const sites: BrowsingSite[] = Object.entries(sitesObj).map(([hostname, s]) => ({
        hostname,
        time: typeof s.time === "number" ? s.time : 0,
        category: (s.category === "productive" || s.category === "distracting") ? s.category : "neutral",
        visits: typeof s.visits === "number" ? s.visits : 1,
      }));
      const rawTotals = e.totals as { productive?: number; neutral?: number; distracting?: number } | undefined;
      days.push({
        date,
        sites,
        totals: {
          productive: rawTotals?.productive ?? 0,
          neutral: rawTotals?.neutral ?? 0,
          distracting: rawTotals?.distracting ?? 0,
        },
        focusScore: typeof e.focusScore === "number" ? e.focusScore : 0,
      });
    }
    return days.length > 0 ? days.sort((a, b) => a.date.localeCompare(b.date)) : null;
  } catch {
    return null;
  }
}

export type CoachPersonality = "analytical" | "unserious" | "stoic";

const PERSONALITY_PROMPTS: Record<CoachPersonality, string> = {
  analytical: `You are a precise, data-driven personal optimization analyst embedded in the Aspera app.
Reference specific numbers, percentages, and correlations. Be clinical and thorough.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,

  unserious: `You are a slightly sarcastic, casual personal coach embedded in the Aspera app.
You gently call the user out on bad habits. Use casual language, throw in some humor.
Be specific with data but keep the tone like a witty friend who also reads research papers.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,

  stoic: `You are a terse, stoic personal advisor embedded in the Aspera app. Marcus Aurelius energy.
No fluff. Short, declarative sentences. Reference the data but don't over-explain.
Every insight should feel like a carved-in-stone principle.
You MUST respond with ONLY valid JSON matching the exact schema provided.
Do not include markdown fences, explanations, or any text outside the JSON.`,
};

const SELF_COMPASSION_PREFIX = `IMPORTANT TONE DIRECTIVE: The user's data indicates a difficult week with low energy or focus.
Regardless of your personality style, you must apply Self-Compassion principles:
- Self-Kindness: Acknowledge the struggle without judgment. Do NOT guilt-trip or shame.
- Common Humanity: Remind them that difficult weeks are universal — everyone goes through them.
- Mindfulness: Note the data patterns without catastrophizing or over-dramatizing.
Your summary should open with acknowledgment, your recommendation should be a single small, low-effort action to rebuild momentum. Never say "you failed" or "you need to do better."
`;

function detectBadWeek(logs: DailyLog[]): boolean {
  if (logs.length < 3) return false;
  const avgFocus = logs.reduce((s, l) => s + l.output.focusRating, 0) / logs.length;
  const avgEnergy = logs.reduce((s, l) => s + l.output.energyRating, 0) / logs.length;
  return avgFocus < 5 || avgEnergy < 5;
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractTextBlocks(content: ReadonlyArray<{ type: string; text?: string }>): string {
  return content
    .filter((b): b is { type: string; text: string } => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function extractBalancedJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (start === -1) {
      if (char === "{") { start = i; depth = 1; }
      continue;
    }
    if (isEscaped) { isEscaped = false; continue; }
    if (char === "\\" && inString) { isEscaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

function removeTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function parseJsonCandidate(text: string): unknown | null {
  const stripped = stripCodeFences(text);
  if (!stripped) return null;
  const candidateSet = new Set([stripped]);
  const balanced = extractBalancedJsonObject(stripped);
  if (balanced) candidateSet.add(balanced);
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start !== -1 && end > start) candidateSet.add(stripped.slice(start, end + 1));
  for (const candidate of Array.from(candidateSet)) {
    try { return JSON.parse(removeTrailingCommas(candidate).trim()); } catch { continue; }
  }
  return null;
}

function slugify(value: string, fallback: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getDayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Day";
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
}

function buildWeeklyTrendsFromLogs(logs: DailyLog[]): InsightsResponse["weeklyTrends"] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-7).map((log) => ({
    date: log.date,
    dayLabel: getDayLabel(log.date),
    focusRating: log.output.focusRating,
    energyRating: log.output.energyRating,
    tasksCompleted: log.output.tasksCompleted,
  }));
}

function normalizeCorrelations(raw: unknown): InsightsResponse["correlations"] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map((item, index) => {
    if (!item || typeof item !== "object") return null;
    const entry = item as Record<string, unknown>;
    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    const description = typeof entry.description === "string" ? entry.description.trim() : "";
    if (!title || !description) return null;
    const outputMetric = entry.outputMetric;
    const confidence = entry.confidence;
    const delta = typeof entry.delta === "number" && Number.isFinite(entry.delta) ? entry.delta : 0;
    return {
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id : slugify(title, `correlation-${index + 1}`),
      emoji: typeof entry.emoji === "string" && entry.emoji.trim() ? entry.emoji : "📊",
      title, description,
      inputFactors: Array.isArray(entry.inputFactors) ? entry.inputFactors.filter((f): f is string => typeof f === "string" && f.trim().length > 0) : [],
      outputMetric: outputMetric === "focus" || outputMetric === "energy" || outputMetric === "tasks" ? outputMetric : "focus",
      delta,
      confidence: confidence === "low" || confidence === "medium" || confidence === "high" ? confidence : "medium",
      isKeystone: Boolean(entry.isKeystone),
    };
  }).filter(Boolean) as InsightsResponse["correlations"];

  if (normalized.length === 0) return [];
  const keystoneCount = normalized.filter((item) => item.isKeystone).length;
  if (keystoneCount === 1) return normalized;
  return normalized.map((item, index) => ({ ...item, isKeystone: index === 0 }));
}

function normalizeWeeklyTrends(raw: unknown, logs: DailyLog[]): InsightsResponse["weeklyTrends"] {
  if (!Array.isArray(raw)) return buildWeeklyTrendsFromLogs(logs);
  const normalized = raw.map((item) => {
    if (!item || typeof item !== "object") return null;
    const entry = item as Record<string, unknown>;
    const date = typeof entry.date === "string" && entry.date.trim() ? entry.date : "";
    if (!date) return null;
    return {
      date,
      dayLabel: typeof entry.dayLabel === "string" && entry.dayLabel.trim() ? entry.dayLabel : getDayLabel(date),
      focusRating: typeof entry.focusRating === "number" && Number.isFinite(entry.focusRating) ? entry.focusRating : 0,
      energyRating: typeof entry.energyRating === "number" && Number.isFinite(entry.energyRating) ? entry.energyRating : 0,
      tasksCompleted: typeof entry.tasksCompleted === "number" && Number.isFinite(entry.tasksCompleted) ? entry.tasksCompleted : 0,
    };
  }).filter(Boolean) as InsightsResponse["weeklyTrends"];
  return normalized.length === 7 ? normalized : buildWeeklyTrendsFromLogs(logs);
}

function coerceInsightsResponse(raw: unknown, logs: DailyLog[]): InsightsResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const summary = typeof entry.summary === "string" ? entry.summary.trim() : "";
  const topRecommendation = typeof entry.topRecommendation === "string" ? entry.topRecommendation.trim() : "";
  const correlations = normalizeCorrelations(entry.correlations);
  if (!summary || !topRecommendation || correlations.length === 0) return null;
  return {
    summary, correlations, topRecommendation,
    weeklyTrends: normalizeWeeklyTrends(entry.weeklyTrends, logs),
    generatedAt: typeof entry.generatedAt === "number" && Number.isFinite(entry.generatedAt) ? entry.generatedAt : Date.now(),
  };
}

async function buildInsightsPrompt(logs: DailyLog[]): Promise<string> {
  const mockContext = getMockContext();
  const realBrowsing = await loadRealBrowsingData();
  const browsingData = realBrowsing ?? mockContext.browsing;
  const usingRealBrowsing = realBrowsing !== null;
  const integrationSummaries = getDailyIntegrationSummaries().slice(-7);
  const bigRocksContext = logs.filter((l) => l.bigRocks && l.bigRocks.length > 0).map((l) => ({
    date: l.date, bigRocks: l.bigRocks, tasksCompleted: l.output.tasksCompleted, focusRating: l.output.focusRating,
  }));

  const exampleResponse = {
    summary: "Exactly 2 concise sentences summarizing the user's patterns",
    correlations: [{ id: "example-slug", emoji: "🎯", title: "Short catchy title", description: "1 concise sentence with specific numbers from the data", inputFactors: ["caffeine", "music"], outputMetric: "focus", delta: 2.5, confidence: "high", isKeystone: false }],
    topRecommendation: "Single actionable sentence starting with a verb",
    weeklyTrends: [{ date: "2026-03-22", dayLabel: "Sun", focusRating: 7, energyRating: 8, tasksCompleted: 9 }],
    generatedAt: Date.now(),
  };

  return `Analyze this user's lifestyle and performance data from multiple sources.
Identify 3–5 correlations between their inputs and outputs.

DAILY LOGS (self-reported):
${JSON.stringify(logs, null, 2)}

${bigRocksContext.length > 0 ? `BIG ROCKS (user's stated top priorities per day):
${JSON.stringify(bigRocksContext, null, 2)}

Analyze whether the user's task output and focus scores are higher on days they set Big Rocks vs. days they didn't.
If so, note this as a correlation.
` : ""}

SPOTIFY RECENTLY PLAYED:
${JSON.stringify(mockContext.spotify, null, 2)}

HEALTHKIT SLEEP (7 days):
${JSON.stringify(mockContext.sleep, null, 2)}

HEALTHKIT TIME IN DAYLIGHT (7 days, minutes of outdoor UV exposure):
${JSON.stringify(mockContext.daylight, null, 2)}

HEALTHKIT WORKOUTS:
${JSON.stringify(mockContext.workouts, null, 2)}

GOOGLE CALENDAR (today):
${JSON.stringify(mockContext.calendar, null, 2)}

GOOGLE TASKS:
${JSON.stringify(mockContext.tasks, null, 2)}

STATE OF MIND (7 days):
${JSON.stringify(mockContext.mood, null, 2)}

BROWSING FOCUS TELEMETRY${usingRealBrowsing ? " (live from Chrome extension)" : " (mock data)"}:
${JSON.stringify(browsingData, null, 2)}

NORMALIZED INTEGRATION SUMMARIES:
${JSON.stringify(integrationSummaries, null, 2)}

IMPORTANT: One insight MUST reference the user's music listening patterns (Spotify data).
Notice that their highest-focus sessions correlate with grunge/alt-rock (Nirvana, Alice in Chains, RHCP).
You should also look for attention patterns across productive, neutral, and distracting time where relevant.

KEYSTONE HABIT DETECTION:
Look for habits that create positive cascading effects across multiple outputs.
A Keystone Habit is a single input that, when present, correlates with improvements in 2+ output metrics simultaneously.
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { logs: DailyLog[]; personality?: CoachPersonality };
    const { logs, personality = "analytical" } = body;

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: "No logs provided" }, { status: 400 });
    }

    const apiKey = process.env.CLAUDE_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CLAUDE_KEY not configured on server" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    let systemPrompt = PERSONALITY_PROMPTS[personality];
    if (detectBadWeek(logs)) {
      systemPrompt = SELF_COMPASSION_PREFIX + "\n\n" + systemPrompt;
    }

    const basePrompt = await buildInsightsPrompt(logs);
    const retryPrompt = `${basePrompt}\n\nRETRY FORMAT RULES:\n- Return one JSON object only\n- Do not use markdown fences\n- Keep the JSON compact and concise\n- Keep each correlation description to one sentence`;
    const prompts = [basePrompt, retryPrompt];
    const maxTokens = [2200, 2800];

    for (let attempt = 0; attempt < prompts.length; attempt++) {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens[attempt],
        temperature: personality === "unserious" ? 0.2 : 0,
        system: systemPrompt,
        messages: [{ role: "user", content: prompts[attempt] }],
      });

      const rawText = extractTextBlocks(message.content);
      const parsed = coerceInsightsResponse(parseJsonCandidate(rawText), logs);
      if (parsed) {
        return NextResponse.json(parsed);
      }
    }

    return NextResponse.json(
      { error: "The AI returned an incomplete insights response. Please try again." },
      { status: 502 },
    );
  } catch (err: unknown) {
    console.error("[/api/insights] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
