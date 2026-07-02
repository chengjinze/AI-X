import type { SearchEngine, SearchOptions, SearchResult } from "./types";

/** AbortSignal.timeout polyfill for Node.js < 19 */
function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), ms);
  return controller.signal;
}

export class TavilySearch implements SearchEngine {
  readonly name = "tavily";

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn("[Tavily] TAVILY_API_KEY not configured — skipping");
      return [];
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: options?.searchDepth || "advanced",
          max_results: options?.maxResults || 10,
          include_domains: options?.includeDomains || [],
          exclude_domains: options?.excludeDomains || [],
        }),
        signal: createTimeoutSignal(15000),
      });

      if (!response.ok) {
        console.error(`[Tavily] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const count = (data.results || []).length;
      console.log(`[Tavily] ${count} results for "${query.slice(0, 60)}..."`);

      return (data.results || []).map((r: any, i: number) => ({
        title: r.title || "",
        url: r.url || "",
        snippet: r.content || r.snippet || "",
        source: "tavily" as const,
        publishedDate: r.published_date || undefined,
        relevanceScore: r.score ?? (1 - i * 0.05),
      }));
    } catch (err) {
      console.error(`[Tavily] Search failed:`, (err as Error).message);
      return [];
    }
  }
}
