// ============================================================
// Search API client
// ============================================================

import { apiFetch } from "./client";
import type { SearchResult } from "@/lib/search";

export const searchApi = {
  search: (query: string, options?: {
    engines?: string[];
    maxResults?: number;
    searchDepth?: string;
  }) =>
    apiFetch<{ results: SearchResult[]; count: number }>("/api/search", {
      method: "POST",
      body: JSON.stringify({ query, ...options }),
    }),
};
