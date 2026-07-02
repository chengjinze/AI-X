// ============================================================
// Recursive Requirement Clarification
// B 为主 + 条件触发 A：
//   澄清阶段默认不搜索，仅在缺少关键事实时允许单次轻量搜索
//   澄清完成后进入研究阶段，并行搜索所有子问题
// ============================================================

import type { ChatMessage, StreamChunk } from "@/lib/ai";
import { getSearchAggregator } from "@/lib/search";
import { buildSystemPrompt } from "./system-prompt";
import type { ResearchMode } from "./system-prompt";

export interface ClarificationState {
  round: number;
  maxRounds: number;
  isClarifying: boolean;
  keyFactsRequested: boolean; // 是否已经请求过事实信息搜索
}

export interface ClarificationResult {
  shouldClarify: boolean;
  clarificationQuestions?: string[];
  factSearchQuery?: string; // 如果缺少事实信息，生成搜索查询
}

const CLARIFICATION_DETECTOR_PROMPT = `你是一个"问题清晰度评估器"。

分析用户的问题，判断是否足够清晰以进行深入的战略分析。

清晰的标准：
- 问题范围明确
- 目标清晰
- 约束已知或可推断
- 上下文足够

模糊的标准（需要追问）：
- 问题过于宽泛（如"分析AI行业"）
- 缺少具体目标（如"帮我看看这个公司"——看什么？）
- 缺少约束条件（如"最好的策略是什么"——没有约束的最好没有意义）
- 缺少上下文（如"这个市场怎么样"——哪个市场？）

特别注意：如果用户缺少某个具体的**事实性数据**（如某公司的最新估值、某行业的市场规模数据），请将其标记为需要搜索的事实缺口。

请以 JSON 格式输出：
{
  "isFuzzy": true/false,
  "issues": ["问题过于宽泛", "缺少具体目标", ...],
  "clarificationQuestions": ["追问1...", "追问2...", ...],
  "factGap": null 或 { "query": "需要搜索的具体问题", "reason": "为什么需要这个事实" }
}

注意：clarificationQuestions 最多 2-3 个最重要的问题。factGap 仅在没有外部事实信息就无法有效追问时设置。`;

export function createClarificationState(): ClarificationState {
  return {
    round: 0,
    maxRounds: 3,
    isClarifying: false,
    keyFactsRequested: false,
  };
}

/**
 * Evaluate whether the user's latest message triggers clarification mode.
 * Returns the evaluation result for the AI to act on.
 * Condition A: If a fact gap exists (factGap != null), do a single lightweight search.
 */
export function buildClarificationPrompt(): string {
  return CLARIFICATION_DETECTOR_PROMPT;
}

/**
 * After clarification is complete, build the research prompt
 * that decomposes the question and triggers parallel search.
 */
export function buildResearchDecompositionPrompt(mode: ResearchMode): string {
  return `现在用户的问题已经澄清完毕。请执行以下步骤：

1. 将用户的核心问题拆解为 3-5 个研究子问题（每个子问题应独立、可搜索）
2. 为每个子问题生成一个英文搜索查询（适合搜索引擎）
3. 以 JSON 格式输出：
{
  "subQuestions": [
    { "question": "中文子问题", "searchQuery": "English search query" }
  ],
  "searchStrategy": "broad" 或 "targeted"
}

${mode === "deep-research" ? "深度研究模式：请确保子问题覆盖多个维度（市场结构、竞争动态、技术趋势、监管环境、财务数据等）。" : ""}
${mode === "strategic-analysis" ? "战略分析模式：请确保子问题覆盖竞争格局、进入壁垒、替代威胁、供应商议价力、买方议价力等战略维度。" : ""}`;
}

/**
 * Search for a single fact during clarification (Condition A trigger)
 */
export async function searchFactGap(query: string): Promise<string> {
  const aggregator = getSearchAggregator();
  const results = await aggregator.search(query, { maxResults: 5, searchDepth: "basic" });

  if (results.length === 0) return "";

  return results
    .map((r) => `- ${r.title}: ${r.snippet} (来源: ${r.url})`)
    .join("\n");
}

/**
 * Build the comprehensive research context from search results.
 * Used in Phase 2 (research phase) after clarification is complete.
 */
export function buildResearchContext(
  subQuestions: { question: string; searchQuery: string }[],
  searchResults: Map<string, { title: string; url: string; snippet: string; source: string }[]>
): string {
  let context = "## 互联网研究结果\n\n";

  for (const { question, searchQuery } of subQuestions) {
    const results = searchResults.get(searchQuery) || [];
    context += `### ${question}\n\n`;
    if (results.length === 0) {
      context += "（未找到相关结果）\n\n";
    } else {
      for (const r of results.slice(0, 5)) {
        context += `- **${r.title}** [${r.source}]\n  ${r.snippet}\n  链接: ${r.url}\n\n`;
      }
    }
  }

  return context;
}
