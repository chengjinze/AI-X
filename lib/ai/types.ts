// ============================================================
// AI Provider 统一类型定义
// ============================================================

export type ProviderId = "openai" | "anthropic" | "google" | "deepseek" | "ollama" | "compatible";

export interface StreamChunk {
  type: "text-delta" | "thinking" | "tool-call" | "tool-result" | "error" | "done";
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  error?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GenerateOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  thinkingBudget?: number; // Anthropic extended thinking tokens
}

export interface AiProviderConfig {
  id: ProviderId;
  name: string;
  models: string[];
  defaultModel: string;
  enabled: boolean;
}

// Provider interface — all implementations must satisfy this
export interface AiProvider {
  readonly id: ProviderId;
  readonly config: AiProviderConfig;

  /** Streaming chat — yields chunks as they arrive */
  streamChat(
    messages: ChatMessage[],
    options: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, undefined>;

  /** Non-streaming — returns full text (for tool orchestration) */
  generateText(
    messages: ChatMessage[],
    options: GenerateOptions
  ): Promise<string>;
}
