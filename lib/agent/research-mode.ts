// ============================================================
// Deep Research Orchestrator
// 研究阶段：拆解问题 → 并行搜索 → 交叉验证 → 综合输出
// 双路径：Path A 原生 tool calling / Path B 预搜索注入
// ============================================================

import type { AiProvider, ChatMessage, StreamChunk, ToolDefinition } from "@/lib/ai";
import { getSearchAggregator } from "@/lib/search";
import { buildSystemPrompt, type ResearchMode } from "./system-prompt";

// ---- Keywords that trigger search even in normal mode ----
const SEARCH_TRIGGER_KEYWORDS = [
  "搜索", "查一下", "查一查", "帮我查", "搜一下",
  "search", "research", "look up", "find",
  "最新", "最近", "当前", "今年", "2025", "2026",
  "数据", "新闻", "报告", "统计", "趋势",
];

function shouldTriggerSearch(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return SEARCH_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// ---- Tool definitions ----
export function getResearchTools(): ToolDefinition[] {
  return [
    {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the internet for up-to-date information. Use to gather facts, data, news, and research findings.",
        parameters: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: { type: "string" },
              description: "Array of search queries (1-5 recommended)",
              minItems: 1, maxItems: 5,
            },
            maxResults: { type: "number", description: "Max results per query (default 5)", default: 5 },
          },
          required: ["queries"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "causal_reasoning",
        description: "Perform causal chain analysis. Identify first/second/third-order effects, feedback loops, hidden assumptions.",
        parameters: {
          type: "object",
          properties: { statement: { type: "string", description: "Hypothesis to analyze" } },
          required: ["statement"],
        },
      },
    },
  ];
}

// ---- Execute web_search tool ----
export async function executeWebSearch(args: { queries: string[]; maxResults?: number }): Promise<string> {
  const aggregator = getSearchAggregator();
  const results = await aggregator.multiSearch(args.queries, { maxResults: args.maxResults || 5, searchDepth: "advanced" });
  let output = "";
  const entries = Array.from(results.entries());
  for (let i = 0; i < entries.length; i++) {
    const [query, items] = entries[i];
    output += `## Results for: "${query}"\n\n`;
    if (items.length === 0) { output += "No results found.\n\n"; }
    else { for (const item of items) { output += `- **${item.title}** [${item.source}]\n  ${item.snippet}\n  URL: ${item.url}\n\n`; } }
  }
  return output;
}

// ---- Query generation ----
function generateSearchQueries(userMessage: string, mode: ResearchMode): string[] {
  const queries = [userMessage];
  if (mode === "deep-research") {
    queries.push(`${userMessage} latest data statistics 2025`);
    queries.push(`${userMessage} industry report analysis trends`);
  } else if (mode === "strategic-analysis") {
    queries.push(`${userMessage} competitive landscape market share 2025`);
    queries.push(`${userMessage} strategy moat analysis`);
  } else {
    queries.push(`${userMessage} latest news 2025`);
  }
  return queries;
}

export interface PreSearchResult {
  context: string | null;
  engineCount: number;
  totalResults: number;
}

// ---- Pre-search ----
export async function preSearchUserQuery(userMessage: string, mode: ResearchMode): Promise<PreSearchResult> {
  const aggregator = getSearchAggregator();
  const engineCount = (aggregator as any).engines?.length ?? 0;
  if (engineCount === 0) {
    console.warn("[PreSearch] No search engines configured");
    return { context: null, engineCount: 0, totalResults: 0 };
  }
  const queries = generateSearchQueries(userMessage, mode);
  console.log(`[PreSearch] Dispatching ${queries.length} queries across ${engineCount} engines...`);
  const results = await aggregator.multiSearch(queries, { maxResults: 5, searchDepth: "advanced" });
  let totalResults = 0;
  const entries = Array.from(results.entries());
  for (let i = 0; i < entries.length; i++) totalResults += entries[i][1].length;
  console.log(`[PreSearch] ${totalResults} total results from ${engineCount} engines`);
  if (totalResults === 0) {
    console.warn("[PreSearch] No results found");
    return { context: null, engineCount, totalResults: 0 };
  }
  let context = "\n\n## Internet Research Results\n\n";
  for (let i = 0; i < entries.length; i++) {
    const [query, items] = entries[i];
    if (items.length > 0) {
      context += `### "${query}"\n\n`;
      for (const item of items.slice(0, 3)) { context += `- **${item.title}** [${item.source}]\n  ${item.snippet}\n  URL: ${item.url}\n\n`; }
    }
  }
  return { context, engineCount, totalResults };
}

// ---- Main orchestrator ----
export async function* streamResearchResponse(
  provider: AiProvider,
  messages: ChatMessage[],
  mode: ResearchMode,
  maxToolRounds = 3
): AsyncGenerator<StreamChunk> {
  const systemPrompt = buildSystemPrompt(mode);
  const tools = getResearchTools();
  let currentMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

  // ---- Path B: Pre-search ----
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const shouldSearch = mode !== "normal" || (lastUserMsg && shouldTriggerSearch(lastUserMsg.content));

  if (shouldSearch && lastUserMsg) {
    yield { type: "thinking", content: "Searching the internet for relevant data..." };
    const result = await preSearchUserQuery(lastUserMsg.content, mode);
    if (result.context) {
      yield { type: "thinking", content: `Found ${result.totalResults} results from ${result.engineCount} search engines. Analyzing...` };
      const lastUserIdx = currentMessages.length - 1;
      currentMessages.splice(lastUserIdx, 0, {
        role: "system",
        content: `The following are real-time internet search results. Use these as factual context. Cite sources.\n${result.context}`,
      });
    } else {
      const reason = result.engineCount === 0
        ? "No search API keys configured."
        : "Search engines returned no results. Check API keys and network.";
      yield { type: "thinking", content: `Warning: Internet search unavailable: ${reason}` };
      console.warn(`[Research] Search warning: engines=${result.engineCount}, results=${result.totalResults}`);
    }
  }

  // ---- Path A: Native tool calling loop ----
  let useTools = true;
  let retriedWithoutTools = false;

  for (let round = 0; round < maxToolRounds; round++) {
    console.log(`[Research] Round ${round}/${maxToolRounds} — useTools=${useTools}, msgs=${currentMessages.length}`);
    let toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
    let textContent = "";

    const streamOptions: Parameters<AiProvider["streamChat"]>[1] = {
      model: provider.config.defaultModel,
      temperature: mode === "strategic-analysis" ? 0.3 : 0.5,
      maxTokens: mode === "deep-research" ? 8192 : 4096,
      thinkingBudget: provider.id === "anthropic" ? 4000 : undefined,
    };
    if (useTools) streamOptions.tools = tools;

    try {
      const stream = provider.streamChat(currentMessages, streamOptions);
      for await (const chunk of stream) {
        if (chunk.type === "text-delta" && chunk.content) { textContent += chunk.content; yield chunk; }
        else if (chunk.type === "tool-call") {
          toolCalls.push({ id: chunk.content || "", name: chunk.toolName || "", input: chunk.toolInput || {} });
          yield chunk;
        } else if (chunk.type === "done") break;
        else if (chunk.type === "error") {
          if (useTools && !retriedWithoutTools && round === 0) {
            console.warn("[Research] Provider errored with tools — retrying without");
            retriedWithoutTools = true; useTools = false; textContent = ""; toolCalls = [];
            const fallbackStream = provider.streamChat(currentMessages, { ...streamOptions, tools: undefined });
            for await (const fb of fallbackStream) {
              if (fb.type === "text-delta" && fb.content) { textContent += fb.content; yield fb; }
              else if (fb.type === "done") break;
              else if (fb.type === "error") { yield fb; return; }
            }
            yield { type: "done" }; return;
          }
          yield chunk; return;
        }
      }
    } catch (err) {
      console.error(`[Research] Round ${round} stream error:`, (err as Error).message);
      yield { type: "error", error: (err as Error).message };
      return;
    }

    if (toolCalls.length === 0) {
      console.log(`[Research] Round ${round} done — no tool calls, finalizing (textLen=${textContent.length})`);
      yield { type: "done" };
      return;
    }

    console.log(`[Research] Round ${round} → ${toolCalls.length} tool calls: ${toolCalls.map(t=>t.name).join(", ")}`);
    const assistantMsg: ChatMessage = {
      role: "assistant", content: textContent,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id, type: "function" as const,
        function: { name: tc.name, arguments: JSON.stringify(tc.input) },
      })),
    };
    currentMessages.push(assistantMsg);

    for (const tc of toolCalls) {
      let toolResult = "";
      if (tc.name === "web_search") {
        yield { type: "thinking", content: `Searching: ${(tc.input.queries as string[]).join(", ")}...` };
        toolResult = await executeWebSearch(tc.input as { queries: string[]; maxResults?: number });
      } else if (tc.name === "causal_reasoning") {
        yield { type: "thinking", content: `Analyzing: ${tc.input.statement}...` };
        toolResult = `Causal reasoning: ${tc.input.statement}`;
      }
      currentMessages.push({ role: "tool", content: toolResult, tool_call_id: tc.id, name: tc.name });
    }
  }

  // ---- Final synthesis round (no tools) ----
  // After all tool-calling rounds, let the model synthesize a final answer
  console.log("[Research] All tool rounds complete — generating final synthesis");
  yield { type: "thinking", content: "Synthesizing research findings..." };

  try {
    const finalStream = provider.streamChat(currentMessages, {
      model: provider.config.defaultModel,
      temperature: mode === "strategic-analysis" ? 0.3 : 0.5,
      maxTokens: mode === "deep-research" ? 8192 : 4096,
      // NO tools — force the model to produce a final answer
    });

    for await (const chunk of finalStream) {
      if (chunk.type === "text-delta" && chunk.content) {
        yield chunk;
      } else if (chunk.type === "done") {
        break;
      } else if (chunk.type === "error") {
        yield chunk;
        console.error("[Research] Final synthesis error:", chunk.error);
      }
    }
  } catch (err) {
    console.error("[Research] Final synthesis failed:", (err as Error).message);
    yield { type: "error", error: (err as Error).message };
  }

  console.log("[Research] Final synthesis complete");
  yield { type: "done" };
}

