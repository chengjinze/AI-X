import OpenAI from "openai";
import type { AiProvider, AiProviderConfig, ChatMessage, GenerateOptions, ProviderId, StreamChunk, ToolDefinition } from "./types";

function toOpenAiMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((m) => {
    switch (m.role) {
      case "system":
        return { role: "system", content: m.content };
      case "user":
        return { role: "user", content: m.content };
      case "assistant": {
        const msg: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
          role: "assistant",
          content: m.content || null,
        };
        if (m.tool_calls && m.tool_calls.length > 0) {
          msg.tool_calls = m.tool_calls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }));
        }
        return msg;
      }
      case "tool":
        return { role: "tool", content: m.content, tool_call_id: m.tool_call_id! };
      default:
        return { role: "user", content: m.content };
    }
  });
}

function toOpenAiTools(tools?: ToolDefinition[]): OpenAI.Chat.ChatCompletionTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters as Record<string, unknown>,
    },
  }));
}

export function createOpenAiProvider(config?: { apiKey?: string; baseURL?: string }): AiProvider {
  const apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const baseURL = config?.baseURL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const isRealOpenAI = baseURL.includes("api.openai.com");

  const client = new OpenAI({ apiKey, baseURL });

  const providerConfig: AiProviderConfig = {
    id: isRealOpenAI ? "openai" : "compatible",
    name: isRealOpenAI ? "OpenAI" : "OpenAI-Compatible",
    models: isRealOpenAI
      ? ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o4-mini"]
      : [process.env.DEFAULT_MODEL || "default"],
    defaultModel: isRealOpenAI ? "gpt-4o" : (process.env.DEFAULT_MODEL || "default"),
    enabled: !!apiKey,
  };

  return {
    id: "openai" as ProviderId,
    config: providerConfig,

    async *streamChat(messages: ChatMessage[], options: GenerateOptions): AsyncGenerator<StreamChunk> {
      // Build request params — omit stream_options for non-OpenAI endpoints
      const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: options.model || providerConfig.defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      };

      // Only add tools if provided AND using real OpenAI (vLLM compat varies)
      const openAiTools = toOpenAiTools(options.tools);
      if (openAiTools && openAiTools.length > 0) {
        params.tools = openAiTools;
      }

      // stream_options only works on real OpenAI
      if (isRealOpenAI) {
        (params as unknown as Record<string, unknown>).stream_options = { include_usage: true };
      }

      try {
        const stream = await client.chat.completions.create(params);

        let accumulatedToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            yield { type: "text-delta", content: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!accumulatedToolCalls.has(idx)) {
                accumulatedToolCalls.set(idx, {
                  id: tc.id ?? "",
                  name: tc.function?.name ?? "",
                  args: "",
                });
              }
              const entry = accumulatedToolCalls.get(idx)!;
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name = tc.function.name;
              if (tc.function?.arguments) entry.args += tc.function.arguments;
            }
          }

          // Check finish_reason — could be "tool_calls" or "stop"
          const finishReason = chunk.choices[0]?.finish_reason;
          if (finishReason) {
            // Emit tool calls if they were accumulated
            if (accumulatedToolCalls.size > 0) {
              const entries = Array.from(accumulatedToolCalls.entries());
              for (let i = 0; i < entries.length; i++) {
                const tc = entries[i][1];
                let parsedArgs: Record<string, unknown> = {};
                try { parsedArgs = JSON.parse(tc.args); } catch { parsedArgs = { raw: tc.args }; }
                yield {
                  type: "tool-call",
                  toolName: tc.name,
                  toolInput: parsedArgs,
                  content: tc.id,
                };
              }
            }
          }
        }
      } catch (err) {
        yield {
          type: "error",
          error: err instanceof Error ? err.message : "Provider stream error",
        };
      }

      yield { type: "done" };
    },

    async generateText(messages: ChatMessage[], options: GenerateOptions): Promise<string> {
      const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: options.model || providerConfig.defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: false,
      };

      const openAiTools = toOpenAiTools(options.tools);
      if (openAiTools && openAiTools.length > 0) {
        params.tools = openAiTools;
      }

      const response = await client.chat.completions.create(params);
      return response.choices[0]?.message?.content ?? "";
    },
  };
}


