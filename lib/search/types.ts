// ============================================================
// Search Engine 统一接口
// ============================================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "tavily" | "serper" | "bocha";
  publishedDate?: string;
  relevanceScore: number; // 0-1
}

export interface SearchOptions {
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  searchDepth?: "basic" | "advanced";
  timeRange?: "day" | "week" | "month" | "year";
}

export interface SearchEngine {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
