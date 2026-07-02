"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { useChat } from "@/lib/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { AgentStatus } from "./AgentStatus";
import { EmptyState } from "./EmptyState";
import { useEffect, useRef } from "react";

export function ChatContainer() {
  const { state, dispatch } = useChatContext();
  const { sendWithText, sendResearchChoice } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.agentStatus]);

  const handleClarificationSubmit = (response: string) => {
    sendWithText(response);
  };

  const handleResearchChoice = (choice: "deep-research" | "quick-analysis") => {
    sendResearchChoice(choice);
    // The callback sends the appropriate message, which triggers a new SSE stream
  };

  if (state.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <EmptyState />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {state.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onClarificationSubmit={
              idx === state.messages.length - 1 && msg.role === "agent" && !msg.content.startsWith("[RESEARCH_CHOICE]")
                ? handleClarificationSubmit
                : undefined
            }
            onResearchChoice={
              idx === state.messages.length - 1 && msg.role === "agent" && msg.content.startsWith("[RESEARCH_CHOICE]")
                ? handleResearchChoice
                : undefined
            }
          />
        ))}

        {state.isStreaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[hsl(0,0%,50%)]">AI</span>
            </div>
            <div className="flex-1 min-w-0">
              <AgentStatus />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
