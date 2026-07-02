import OpenAI from "openai";
import type {
  AiProvider,
  AiProviderConfig,
  ChatMessage,
  GenerateOptions,
  ProviderId,
  StreamChunk,
  ToolDefinition,
} from "./types";

export interface CompatibleProviderConfig {
  id: ProviderId;
  name: string;
  baseURL: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
}

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
            function: { name: tc.function.name, arguments: tc.function.arguments },
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

export function createCompatibleProvider(cfg: CompatibleProviderConfig): AiProvider {
  const client = new OpenAI({
    apiKey: cfg.apiKey || "not-needed",
    baseURL: cfg.baseURL,
  });

  const providerConfig: AiProviderConfig = {
    id: cfg.id,
    name: cfg.name,
    models: cfg.models,
    defaultModel: cfg.defaultModel,
    enabled: true,
  };

  return {
    id: cfg.id,
    config: providerConfig,

    async *streamChat(messages: ChatMessage[], options: GenerateOptions): AsyncGenerator<StreamChunk> {
      const stream = await client.chat.completions.create({
        model: options.model || providerConfig.defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: toOpenAiTools(options.tools),
        stream: true,
      });

      const accumulatedToolCalls = new Map<number, { id: string; name: string; args: string }>();

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          yield { type: "text-delta", content: delta.content };
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!accumulatedToolCalls.has(idx)) {
              accumulatedToolCalls.set(idx, { id: tc.id ?? "", name: tc.function?.name ?? "", args: "" });
            }
            const entry = accumulatedToolCalls.get(idx)!;
            if (tc.id) entry.id = tc.id;
            if (tc.function?.name) entry.name = tc.function.name;
            if (tc.function?.arguments) entry.args += tc.function.arguments;
          }
        }

        if (chunk.choices[0]?.finish_reason === "tool_calls") {
          const entries = Array.from(accumulatedToolCalls.entries());
          for (let i = 0; i < entries.length; i++) {
            const tc = entries[i][1];
            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(tc.args); } catch { parsedArgs = { raw: tc.args }; }
            yield { type: "tool-call", toolName: tc.name, toolInput: parsedArgs, content: tc.id };
          }
        }
      }

      yield { type: "done" };
    },

    async generateText(messages: ChatMessage[], options: GenerateOptions): Promise<string> {
      const response = await client.chat.completions.create({
        model: options.model || providerConfig.defaultModel,
        messages: toOpenAiMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: toOpenAiTools(options.tools),
        stream: false,
      });
      return response.choices[0]?.message?.content ?? "";
    },
  };
}

// ---- Pre-configured compatible providers ----

export function createDeepSeekProvider(): AiProvider {
  return createCompatibleProvider({
    id: "deepseek",
    name: "DeepSeek",
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    models: ["deepseek-chat", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
  });
}

export function createOllamaProvider(): AiProvider {
  return createCompatibleProvider({
    id: "ollama",
    name: "Ollama (Local)",
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: process.env.OLLAMA_API_KEY || "ollama",
    models: ["llama3.2", "qwen3", "deepseek-r1", "mistral", "gemma3"],
    defaultModel: "llama3.2",
  });
}
