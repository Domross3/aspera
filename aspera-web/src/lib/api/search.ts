// Core search logic — extracted so both /api/search (browser-auth) and
// /api/mobile/search (bearer-auth) share it.

import Anthropic from "@anthropic-ai/sdk";
import { DailyLog } from "@/types";
import type { SearchResult, SearchResponse } from "@/types/search";

function buildSearchPrompt(query: string, logs: DailyLog[]): string {
  return `You are analyzing a user's personal performance logs to answer their natural language query.

USER QUERY: "${query}"

LOGS (${logs.length} days of data):
${JSON.stringify(logs, null, 2)}

Your task:
1. Find the logs most relevant to the user's query
2. For each relevant log, explain WHY it's relevant in one sentence
3. Identify which specific fields are most relevant (e.g., "workout.type", "output.focusRating", "tags", "music")
4. Return results ranked by relevance (most relevant first)

Respond ONLY with valid JSON in this exact format:
{
  "query": "${query}",
  "results": [
    {
      "date": "YYYY-MM-DD",
      "relevanceScore": 85,
      "matchReason": "One sentence explaining why this log is relevant to the query",
      "highlightedFields": ["workout.type", "output.focusRating"]
    }
  ],
  "summary": "A 1-2 sentence summary answering the user's question based on the data patterns"
}

Rules:
- Include only logs with relevanceScore >= 40
- Maximum 5 results
- relevanceScore must be 0-100
- summary must directly answer the question with specific data points
- No markdown fences, no extra text outside the JSON`;
}

export type RunSearchResult =
  | { ok: true; data: SearchResponse }
  | { ok: false; status: number; error: string };

export async function runSearch(
  query: string,
  logs: DailyLog[],
): Promise<RunSearchResult> {
  if (!query?.trim()) {
    return { ok: false, status: 400, error: "Query is required" };
  }
  if (!logs || logs.length === 0) {
    return { ok: false, status: 400, error: "No logs provided" };
  }

  const apiKey = process.env.CLAUDE_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      error: "CLAUDE_KEY not configured on server",
    };
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 0,
    system:
      "You are a precise data analyst. Return only valid JSON, no markdown, no explanations.",
    messages: [{ role: "user", content: buildSearchPrompt(query, logs) }],
  });

  const rawText = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: string; text: string }).text)
    .join("")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: {
    query: string;
    results: Array<{
      date: string;
      relevanceScore: number;
      matchReason: string;
      highlightedFields: string[];
    }>;
    summary: string;
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, status: 502, error: "Failed to parse AI response" };
  }

  // Hydrate results with full log objects
  const logsByDate = new Map(logs.map((l) => [l.date, l]));
  const hydratedResults: SearchResult[] = parsed.results
    .map((r) => {
      const log = logsByDate.get(r.date);
      if (!log) return null;
      return {
        log,
        relevanceScore: r.relevanceScore,
        matchReason: r.matchReason,
        highlightedFields: r.highlightedFields,
      };
    })
    .filter(Boolean) as SearchResult[];

  return {
    ok: true,
    data: {
      query: parsed.query,
      results: hydratedResults,
      summary: parsed.summary,
    },
  };
}
