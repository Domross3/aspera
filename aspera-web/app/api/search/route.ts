import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DailyLog } from "@/types";
import type { SearchResult, SearchResponse } from "@/types/search";

export type { SearchResult, SearchResponse };

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { query: string; logs: DailyLog[] };
    const { query, logs } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ error: "No logs provided" }, { status: 400 });
    }

    const apiKey = process.env.CLAUDE_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CLAUDE_KEY not configured on server" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 },
      );
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

    const response: SearchResponse = {
      query: parsed.query,
      results: hydratedResults,
      summary: parsed.summary,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[/api/search] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
