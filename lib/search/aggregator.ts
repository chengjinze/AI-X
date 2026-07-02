import type { SearchEngine, SearchOptions, SearchResult } from "./types";
import { TavilySearch } from "./tavily";
import { SerperSearch } from "./serper";
import { BochaSearch } from "./bocha";

export class SearchAggregator {
  private engines: SearchEngine[] = [];

  constructor() {
    // Auto-register engines with configured API keys
    if (process.env.TAVILY_API_KEY) this.engines.push(new TavilySearch());
    if (process.env.SERPER_API_KEY) this.engines.push(new SerperSearch());
    if (process.env.BOCHA_API_KEY) this.engines.push(new BochaSearch());
  }

  /** Search across all registered engines in parallel */
  async search(
    query: string,
    options?: SearchOptions & { engines?: string[] }
  ): Promise<SearchResult[]> {
    const targetEngines = options?.engines
      ? this.engines.filter((e) => options.engines!.includes(e.name))
      : this.engines;

    if (targetEngines.length === 0) return [];

    // Fire all engines in parallel
    const results = await Promise.allSettled(
      targetEngines.map((engine) => engine.search(query, options))
    );

    // Collect all results
    const allResults: SearchResult[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        allResults.push(...r.value);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped: SearchResult[] = [];
    for (const r of allResults) {
      const normalized = r.url.toLowerCase().trim().replace(/\/$/, "");
      if (!seen.has(normalized)) {
        seen.add(normalized);
        deduped.push(r);
      }
    }

    // Re-rank: combine relevance score from engine + cross-engine consensus boost
    const reranked = this.rerank(deduped);

    const maxResults = options?.maxResults ?? 20;
    return reranked.slice(0, maxResults);
  }

  /** Search multiple queries in parallel (for research mode) */
  async multiSearch(
    queries: string[],
    options?: SearchOptions
  ): Promise<Map<string, SearchResult[]>> {
    const map = new Map<string, SearchResult[]>();
    const results = await Promise.allSettled(
      queries.map((q) => this.search(q, options))
    );
    queries.forEach((q, i) => {
      if (results[i].status === "fulfilled") {
        map.set(q, results[i].value);
      } else {
        map.set(q, []);
      }
    });
    return map;
  }

  /** Basic re-ranking: combine score + cross-engine consensus boost */
  private rerank(results: SearchResult[]): SearchResult[] {
    // Boost results that appeared in multiple engines (by URL domain overlap)
    const domainCount = new Map<string, number>();
    for (const r of results) {
      try {
        const domain = new URL(r.url).hostname;
        domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
      } catch {}
    }

    return results
      .map((r) => {
        let boost = 0;
        try {
          const domain = new URL(r.url).hostname;
          boost = (domainCount.get(domain) || 1) - 1;
        } catch {}
        return { ...r, relevanceScore: Math.min(1, r.relevanceScore + boost * 0.05) };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

// Singleton
let _aggregator: SearchAggregator | null = null;

export function getSearchAggregator(): SearchAggregator {
  if (!_aggregator) {
    _aggregator = new SearchAggregator();
  }
  return _aggregator;
}
