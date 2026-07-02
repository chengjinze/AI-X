import type { SearchEngine, SearchOptions, SearchResult } from "./types";

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), ms);
  return controller.signal;
}

export class SerperSearch implements SearchEngine {
  readonly name = "serper";

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.warn("[Serper] SERPER_API_KEY not configured — skipping");
      return [];
    }

    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          num: options?.maxResults || 10,
          gl: options?.includeDomains?.length ? undefined : "us",
        }),
        signal: createTimeoutSignal(15000),
      });

      if (!response.ok) {
        console.error(`[Serper] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      const organic = (data.organic || []).map((r: any, i: number) => ({
        title: r.title || "",
        url: r.link || "",
        snippet: r.snippet || "",
        source: "serper" as const,
        publishedDate: r.date || undefined,
        relevanceScore: 0.95 - i * 0.05,
      }));

      const news = (data.news || []).map((r: any, i: number) => ({
        title: r.title || "",
        url: r.link || "",
        snippet: r.snippet || "",
        source: "serper" as const,
        publishedDate: r.date || undefined,
        relevanceScore: 0.9 - i * 0.03,
      }));

      const total = organic.length + news.length;
      console.log(`[Serper] ${total} results (${organic.length} organic + ${news.length} news) for "${query.slice(0, 60)}..."`);

      return [...organic, ...news];
    } catch (err) {
      console.error(`[Serper] Search failed:`, (err as Error).message);
      return [];
    }
  }
}
