import type { SearchEngine, SearchOptions, SearchResult } from "./types";

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), ms);
  return controller.signal;
}

export class BochaSearch implements SearchEngine {
  readonly name = "bocha";

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.BOCHA_API_KEY;
    if (!apiKey) {
      console.warn("[Bocha] BOCHA_API_KEY not configured — skipping");
      return [];
    }

    // Bocha supports two endpoint formats — try both
    const endpoints = [
      "https://api.bochaai.com/v1/ai/search",
      "https://api.bocha.cn/v1/ai/search",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            count: options?.maxResults || 10,
            freshness: options?.timeRange || "noLimit",
            summary: true,
          }),
          signal: createTimeoutSignal(15000),
        });

        if (response.status === 404) continue; // Try next endpoint
        if (response.status === 401 || response.status === 403) {
          console.error(`[Bocha] Auth failed (${response.status}) — check BOCHA_API_KEY`);
          return [];
        }
        if (!response.ok) {
          console.error(`[Bocha] HTTP ${response.status}: ${response.statusText} at ${endpoint}`);
          return [];
        }

        const data = await response.json();
        const webpages = data.data?.webPages?.value || data.webPages?.value || [];
        console.log(`[Bocha] ${webpages.length} results via ${endpoint} for "${query.slice(0, 60)}..."`);

        return webpages.map((r: any, i: number) => ({
          title: r.name || r.title || "",
          url: r.url || r.displayUrl || "",
          snippet: r.snippet || r.summary || "",
          source: "bocha" as const,
          publishedDate: r.dateLastCrawled || undefined,
          relevanceScore: 0.92 - i * 0.04,
        }));
      } catch (err) {
        console.error(`[Bocha] ${endpoint} failed:`, (err as Error).message);
      }
    }

    console.warn("[Bocha] All endpoints failed — Bocha search unavailable");
    return [];
  }
}
