import Anthropic from '@anthropic-ai/sdk';
import { DailyLog, InsightsResponse } from '../types';
import { getMockContext, MockContext } from '../lib/mockData';

// ── Coaching Personalities ──────────────────────────────────────────────

export type CoachPersonality = 'analytical' | 'unserious' | 'stoic';

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

// ── Insights Generation ─────────────────────────────────────────────────

function buildInsightsPrompt(logs: DailyLog[], mockContext: MockContext): string {
  return `Analyze this user's lifestyle and performance data from multiple sources.
Identify 3–5 correlations between their inputs and outputs.

DAILY LOGS (self-reported):
${JSON.stringify(logs, null, 2)}

SPOTIFY RECENTLY PLAYED:
${JSON.stringify(mockContext.spotify, null, 2)}

HEALTHKIT SLEEP (7 days):
${JSON.stringify(mockContext.sleep, null, 2)}

HEALTHKIT WORKOUTS:
${JSON.stringify(mockContext.workouts, null, 2)}

GOOGLE CALENDAR (today):
${JSON.stringify(mockContext.calendar, null, 2)}

GOOGLE TASKS:
${JSON.stringify(mockContext.tasks, null, 2)}

STATE OF MIND (7 days):
${JSON.stringify(mockContext.mood, null, 2)}

IMPORTANT: One insight MUST reference the user's music listening patterns (Spotify data).
Notice that their highest-focus sessions correlate with grunge/alt-rock (Nirvana, Alice in Chains, RHCP).

Respond ONLY with JSON matching this exact schema:
{
  "summary": "string (2-3 sentences)",
  "correlations": [
    {
      "id": "string (unique slug)",
      "emoji": "string (single emoji)",
      "title": "string (short, catchy)",
      "description": "string (1-2 sentences with specific numbers)",
      "inputFactors": ["string"],
      "outputMetric": "focus" | "energy" | "tasks",
      "delta": number,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "topRecommendation": "string (single actionable sentence starting with a verb)",
  "weeklyTrends": [
    {
      "date": "YYYY-MM-DD",
      "dayLabel": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
      "focusRating": number,
      "energyRating": number,
      "tasksCompleted": number
    }
  ],
  "generatedAt": ${Date.now()}
}`;
}

export async function generateInsights(
  apiKey: string,
  logs: DailyLog[],
  personality: CoachPersonality = 'analytical'
): Promise<InsightsResponse> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const mockContext = getMockContext();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    temperature: personality === 'unserious' ? 0.3 : 0,
    system: PERSONALITY_PROMPTS[personality],
    messages: [{ role: 'user', content: buildInsightsPrompt(logs, mockContext) }],
  });

  let text = (message.content[0] as { type: string; text: string }).text;
  // Strip markdown fences if Claude wraps the JSON
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(text) as InsightsResponse;
  return parsed;
}

// ── Today Recommendation ────────────────────────────────────────────────

export async function getTodayRecommendation(
  apiKey: string,
  log: DailyLog | null,
  recentLogs: DailyLog[]
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const mockContext = getMockContext();

  const context = log ?? recentLogs[0];
  if (!context) return "Log your first day to get personalized recommendations.";

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    system: "You are a terse personal performance coach. Give one concrete, actionable recommendation in a single sentence. Start with a verb. No JSON, no markdown, no preamble. Reference the user's actual data.",
    messages: [
      {
        role: 'user',
        content: `Today's log: ${JSON.stringify(context)}
Recent sleep: ${JSON.stringify(mockContext.sleep.slice(-2))}
Today's calendar: ${JSON.stringify(mockContext.calendar)}
Recent mood: ${JSON.stringify(mockContext.mood.slice(-2))}
Give one sentence recommendation for maximizing performance today.`,
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text.trim();
}
