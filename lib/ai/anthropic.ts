import Anthropic from "@anthropic-ai/sdk";
import type {
  AiProvider,
  AiProviderConfig,
  ChatMessage,
  GenerateOptions,
  ProviderId,
  StreamChunk,
  ToolDefinition,
} from "./types";

function toAnthropicMessages(
  messages: ChatMessage[]
): { role: "user" | "assistant"; content: string }[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

function extractSystemPrompt(messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
}

function toAnthropicTools(tools?: ToolDefinition[]): Anthropic.Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
  }));
}

export function createAnthropicProvider(config?: { apiKey?: string }): AiProvider {
  const apiKey = config?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
  const client = new Anthropic({ apiKey });

  const providerConfig: AiProviderConfig = {
    id: "anthropic",
    name: "Anthropic Claude",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-opus-4-20250514",
    ],
    defaultModel: "claude-sonnet-4-20250514",
    enabled: !!apiKey,
  };

  return {
    id: "anthropic" as ProviderId,
    config: providerConfig,

    async *streamChat(
      messages: ChatMessage[],
      options: GenerateOptions
    ): AsyncGenerator<StreamChunk> {
      const systemPrompt = extractSystemPrompt(messages);
      const anthropicMessages = toAnthropicMessages(messages);

      try {
        const stream = client.messages.stream({
          model: options.model || providerConfig.defaultModel,
          max_tokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
          system: systemPrompt || undefined,
          messages: anthropicMessages,
          tools: toAnthropicTools(options.tools),
          thinking: options.thinkingBudget
            ? { type: "enabled", budget_tokens: options.thinkingBudget }
            : undefined,
        });

        for await (const event of stream) {
          switch (event.type) {
            case "content_block_delta":
              if (event.delta.type === "text_delta") {
                yield { type: "text-delta", content: event.delta.text };
              } else if (event.delta.type === "thinking_delta") {
                yield { type: "thinking", content: event.delta.thinking };
              }
              break;
            case "content_block_start":
              if (event.content_block.type === "tool_use") {
                yield {
                  type: "tool-call",
                  toolName: event.content_block.name,
                  content: event.content_block.id,
                };
              }
              break;
            case "message_stop":
              break;
          }
        }
      } catch (err) {
        yield {
          type: "error",
          error: err instanceof Error ? err.message : "Anthropic stream error",
        };
      }

      yield { type: "done" };
    },

    async generateText(
      messages: ChatMessage[],
      options: GenerateOptions
    ): Promise<string> {
      const systemPrompt = extractSystemPrompt(messages);
      const anthropicMessages = toAnthropicMessages(messages);

      const response = await client.messages.create({
        model: options.model || providerConfig.defaultModel,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        system: systemPrompt || undefined,
        messages: anthropicMessages,
        tools: toAnthropicTools(options.tools),
      });

      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock && "text" in textBlock ? textBlock.text : "";
    },
  };
}
