import Anthropic from "@anthropic-ai/sdk";
import type { SearchQuery, SearchResponse } from "../types/search";
import { getLogsForQuery } from "./searchDataRetrieval";
import { buildSearchPrompt } from "./searchPromptBuilder";
import { parseSearchResponse } from "./searchResponseParser";

const SEARCH_MODEL = "claude-sonnet-4-6";
const SEARCH_MAX_DAYS = 90;
const SEARCH_MAX_TOKENS = 4000;
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;

type CachedSearchResponse = {
  expiresAt: number;
  response: SearchResponse;
};

const responseCache = new Map<string, CachedSearchResponse>();

function createErrorResponse(message: string): SearchResponse {
  return {
    answer: message,
    confidence: "low",
    sampleSize: 0,
    supportingDataPoints: [],
    confounds: [],
    followUpQuestions: [],
  };
}

function isErrorResponse(response: SearchResponse): boolean {
  return (
    response.sampleSize === 0 &&
    response.supportingDataPoints.length === 0 &&
    response.confounds.length === 0 &&
    response.followUpQuestions.length === 0
  );
}

function buildCacheKey(query: SearchQuery): string {
  return JSON.stringify({
    query: query.query,
    dateRange: {
      from: query.dateRange?.from ?? null,
      to: query.dateRange?.to ?? null,
    },
    filters: query.filters ?? null,
  });
}

function getCachedResponse(cacheKey: string): SearchResponse | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.response;
}

function cacheResponse(cacheKey: string, response: SearchResponse): void {
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    response,
  });
}

function extractTextBlocks(content: unknown): string {
  if (!Array.isArray(content)) return "";

  return content
    .filter(
      (block): block is { type: string; text: string } =>
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        "text" in block &&
        typeof (block as { type?: unknown }).type === "string" &&
        typeof (block as { text?: unknown }).text === "string",
    )
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function mapSearchError(error: unknown): SearchResponse {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  if (status === 401 || status === 403) {
    return createErrorResponse(
      "Your Claude API key was rejected. Check the key and try again.",
    );
  }

  if (status === 429) {
    return createErrorResponse(
      "Claude is rate limited right now. Please wait a moment and try again.",
    );
  }

  if (status !== undefined && status >= 500) {
    return createErrorResponse(
      "Claude hit a server issue while analyzing your data. Please try again shortly.",
    );
  }

  return createErrorResponse(
    "Search couldn't reach Claude right now. Please try again in a moment.",
  );
}

export function clearSearchCache(): void {
  responseCache.clear();
}

export async function executeSearch(
  searchQuery: SearchQuery,
  apiKey: string,
): Promise<SearchResponse> {
  const trimmedKey = apiKey?.trim();
  if (!trimmedKey) {
    return createErrorResponse(
      "A Claude API key is required before search can run.",
    );
  }

  const trimmedQuery = searchQuery.query.trim();
  if (!trimmedQuery) {
    return createErrorResponse("Enter a question to search your logs.");
  }

  const cacheKey = buildCacheKey({
    ...searchQuery,
    query: trimmedQuery,
  });
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const logs = await getLogsForQuery(
      searchQuery.dateRange ?? {},
      SEARCH_MAX_DAYS,
    );
    if (logs.length === 0) {
      return createErrorResponse(
        "No logs were found for that date range, so there isn't any data to analyze yet.",
      );
    }

    const prompt = buildSearchPrompt(trimmedQuery, logs);
    const client = new Anthropic({
      apiKey: trimmedKey,
      dangerouslyAllowBrowser: true,
    });

    const message = await client.messages.create({
      model: SEARCH_MODEL,
      max_tokens: SEARCH_MAX_TOKENS,
      temperature: 0,
      system: [
        {
          type: "text",
          text: prompt.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt.logsContent,
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: prompt.questionContent,
            },
          ],
        },
      ],
    });

    const rawText = extractTextBlocks(message.content);
    const usage = message.usage as {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    console.log(
      `[search] stop_reason=${message.stop_reason} tokens_in=${usage?.input_tokens} tokens_out=${usage?.output_tokens} cache_write=${usage?.cache_creation_input_tokens ?? 0} cache_read=${usage?.cache_read_input_tokens ?? 0} chars=${rawText.length}`,
    );
    console.log("[search] raw response:", rawText);

    const response = parseSearchResponse(rawText);
    if (isErrorResponse(response)) {
      console.warn(
        "[search] parser rejected Claude response — see raw output above",
      );
    } else {
      cacheResponse(cacheKey, response);
    }

    return response;
  } catch (error) {
    return mapSearchError(error);
  }
}
