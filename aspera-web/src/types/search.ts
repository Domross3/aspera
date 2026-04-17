import { DailyLog } from "./index";

export interface SearchResult {
  log: DailyLog;
  relevanceScore: number; // 0–100
  matchReason: string;
  highlightedFields: string[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
}
