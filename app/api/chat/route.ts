// ============================================================
// POST /api/chat — Chat with SSE streaming
// ============================================================

import { NextRequest } from "next/server";
import { getDefaultProvider, type ChatMessage, type ProviderId } from "@/lib/ai";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import { buildSystemPrompt, parseClarificationTag, type ResearchMode } from "@/lib/agent/system-prompt";
import { streamResearchResponse } from "@/lib/agent/research-mode";
import type { UploadedFile, ClarificationState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId,
      message,
      files,
      mode = "normal",
      provider: providerId,
      clarificationState,
    } = body as {
      conversationId?: string;
      message: string;
      files?: UploadedFile[];
      mode?: ResearchMode;
      provider?: ProviderId;
      clarificationState?: ClarificationState;
    };

    // ---- DEMO MODE ----
    if (process.env.DEMO_MODE === "true") {
      return streamDemoResponse(message, mode);
    }

    const provider = providerId
      ? (await import("@/lib/ai")).getProvider(providerId)
      : getDefaultProvider();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "No AI provider configured. Set an API key in .env.local" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasDb = isSupabaseConfigured();
    let convId = conversationId || (hasDb ? "temp-" + Date.now() : "demo-conv");

    // Save user message to DB if available
    if (hasDb) {
      try {
        if (!conversationId) {
          const conv = await db.createConversation(
            message.slice(0, 50) + (message.length > 50 ? "..." : ""),
            mode
          );
          convId = conv.id;
        }
        await db.createMessage({ conversationId: convId, role: "user", content: message, files });
      } catch (dbErr) {
        console.error("[chat] DB error (continuing without persistence):", dbErr);
        convId = "demo-conv";
      }
    }

    const clarState: ClarificationState = clarificationState || { round: 0, isClarifying: false, keyFactsRequested: false };
    const isClarificationMode = mode === "normal";

    const systemPrompt = buildSystemPrompt(mode, isClarificationMode);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    if (isClarificationMode && clarState.round > 0) {
      messages.push({
        role: "system",
        content: `Clarification round ${clarState.round}. The user has responded to your clarification questions. Assess if the problem is now clear enough. If still unclear, continue with [CLARIFY]. If clear, respond with [CLARIFIED] and summarize the clarified problem (DO NOT give analysis).`,
      });
    }

    // Load history from DB if available
    if (hasDb) {
      try {
        const history = await db.listMessages(convId);
        const historyExcludingLast = history.slice(0, -1);
        for (const msg of historyExcludingLast) {
          messages.push({
            role: msg.role === "agent" ? "assistant" : (msg.role as "user" | "system"),
            content: msg.content,
          });
        }
      } catch { /* ignore DB read errors */ }
    }

    messages.push({ role: "user", content: message });

    if (isClarificationMode) {
      return streamClarificationResponse(provider, messages, convId, clarState, hasDb);
    } else {
      return streamFullResponse(provider, messages, mode, convId, hasDb);
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function streamDemoResponse(message: string, mode: string): Response {
  const encoder = new TextEncoder();
  const modeLabels: Record<string, string> = {
    "deep-research": "深度研究",
    "strategic-analysis": "战略分析",
    "normal": "标准分析",
  };
  const modeLabel = modeLabels[mode] || "标准分析";

  const demoText = `## Demo Response

当前运行在**演示模式**。要启用完整功能，请在\`.env.local\` 中配置真实 API Key 并将 \`DEMO_MODE\` 设为 \`false\`。
**您的输入**：${message.slice(0, 120)}${message.length > 120 ? "..." : ""}
**分析模式**：${modeLabel}

---

### 项目功能

1. **递归需求澄清** — Agent 在分析前进行结构化多轮追问
2. **多 Provider AI 路由** — OpenAI / Anthropic / Gemini / DeepSeek 自动故障转移
3. **互联网深度研究** — 多引擎聚合搜索 + 交叉验证
4. **战略分析框架** — 波特五力、博弈论、护城河分析等
5. **文件分析** — 支持 PDF / DOCX / XLSX / CSV 等格式
6. **长上下文推理** — 支持复杂多步骤分析`;

  const encoder2 = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      function send(data: Record<string, unknown>) { if (closed) return; controller.enqueue(encoder2.encode(`data: ${JSON.stringify(data)}\n\n`)); }
      send({ type: "thinking", content: "Demo mode active." });
      const words = demoText.split(" ");
      for (let i = 0; i < words.length; i++) {
        await new Promise((r) => setTimeout(r, 50));
        send({ type: "text", content: words[i] + (i < words.length - 1 ? " " : "") });
      }
      send({ type: "done", conversationId: "demo-conv" });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

function streamClarificationResponse(
  provider: ReturnType<typeof getDefaultProvider>,
  messages: ChatMessage[],
  convId: string,
  clarState: ClarificationState,
  hasDb: boolean
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let closed = false;
      function send(data: Record<string, unknown>) { if (closed) return; controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
      try {
        const aiStream = provider!.streamChat(messages, { model: provider!.config.defaultModel, temperature: 0.7, maxTokens: 2048 });
        for await (const chunk of aiStream) {
          if (chunk.type === "text-delta" && chunk.content) { fullContent += chunk.content; send({ type: "text", content: chunk.content }); }
          else if (chunk.type === "done") break;
          else if (chunk.type === "error") { send({ type: "error", error: chunk.error }); break; }
        }
        const tag = parseClarificationTag(fullContent);
        if (tag === "clarify") {
          // Ensure [CLARIFY] prefix so the frontend can detect and render ClarificationCard.
          // The fallback in parseClarificationTag (2+ question marks) may not include the tag.
          if (!fullContent.trimStart().toUpperCase().startsWith("[CLARIFY]")) {
            fullContent = "[CLARIFY]\n" + fullContent;
          }
          const nextState: ClarificationState = { round: clarState.round + 1, isClarifying: true, keyFactsRequested: false };
          if (hasDb) { try { await db.createMessage({ conversationId: convId, role: "agent", content: fullContent }); } catch {} }
          closed = true; send({ type: "done", conversationId: convId, clarificationState: nextState }); controller.close();
        } else {
          const cleaned = fullContent.replace(/^\s*\[(?:FINAL|CLARIFIED)\]\s*/i, "").trim();
          const nextState: ClarificationState = { round: clarState.round + 1, isClarifying: false, keyFactsRequested: false };
          if (hasDb) { try { await db.createMessage({ conversationId: convId, role: "agent", content: "[RESEARCH_CHOICE]\n\n" + cleaned }); } catch {} }
          closed = true; send({ type: "done", conversationId: convId, clarificationState: nextState, clarified: true }); controller.close();
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        if (!closed) send({ type: "error", error: errMsg }); controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Conversation-Id": convId } });
}

function streamFullResponse(
  provider: ReturnType<typeof getDefaultProvider>,
  messages: ChatMessage[],
  mode: ResearchMode,
  convId: string,
  hasDb: boolean
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      const thinkingBlocks: string[] = [];
      let closed = false;
      function send(data: Record<string, unknown>) { if (closed) return; controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
      try {
        const researchStream = streamResearchResponse(provider!, messages, mode);
        for await (const chunk of researchStream) {
          switch (chunk.type) {
            case "text-delta": fullContent += chunk.content || ""; send({ type: "text", content: chunk.content }); break;
            case "thinking": thinkingBlocks.push(chunk.content || ""); send({ type: "thinking", content: chunk.content }); break;
            case "tool-call": send({ type: "tool-call", toolName: chunk.toolName, toolInput: chunk.toolInput }); break;
            case "error": send({ type: "error", error: chunk.error }); break;
            case "done":
              if (hasDb) {
                try {
                  await db.createMessage({ conversationId: convId, role: "agent", content: fullContent, thinkingBlocks });
                  await db.updateConversation(convId, { mode });
                } catch {}
              }
              closed = true; send({ type: "done", conversationId: convId }); controller.close(); break;
          }
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        if (!closed) send({ type: "error", error: errMsg }); controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Conversation-Id": convId } });
}
