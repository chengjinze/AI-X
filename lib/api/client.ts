// ============================================================
// Unified fetch wrapper + SSE streaming parser
// ============================================================

export interface SSECallbacks {
  onText: (text: string) => void;
  onThinking: (content: string) => void;
  onToolCall: (toolName: string, toolInput: Record<string, unknown>) => void;
  onError: (error: string) => void;
  onDone: (conversationId?: string, clarificationState?: { round: number; isClarifying: boolean; keyFactsRequested: boolean }, clarified?: boolean) => void;
}

/**
 * Send a chat message and consume the SSE stream.
 * Returns an abort function to cancel streaming.
 */
export function streamChat(
  body: {
    conversationId?: string;
    message: string;
    files?: { id: string; name: string; size: number; type: string }[];
    mode?: string;
    provider?: string;
    clarificationState?: {
      round: number;
      isClarifying: boolean;
      keyFactsRequested: boolean;
    };
  },
  callbacks: SSECallbacks
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        callbacks.onError(err.error || "Request failed");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("No response stream");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (data.type) {
                case "text":
                  callbacks.onText(data.content);
                  break;
                case "thinking":
                  callbacks.onThinking(data.content);
                  break;
                case "tool-call":
                  callbacks.onToolCall(data.toolName, data.toolInput || {});
                  break;
                case "error":
                  callbacks.onError(data.error);
                  break;
                case "done":
                  callbacks.onDone(data.conversationId, data.clarificationState, data.clarified);
                  break;
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      callbacks.onError(err instanceof Error ? err.message : "Stream error");
    }
  })();

  return { abort: () => controller.abort() };
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}
