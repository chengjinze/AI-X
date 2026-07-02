"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { useAgentStatus } from "@/lib/hooks/useAgentStatus";
import { PanelLeft, Zap } from "lucide-react";

export function TopBar() {
  const { state, dispatch } = useChatContext();
  const { status, isActive } = useAgentStatus();

  const currentConv = state.conversations.find(
    (c) => c.id === state.currentConversationId
  );

  return (
    <header className="h-12 border-b border-[hsl(0,0%,14.9%)] flex items-center px-4 bg-[hsl(0,0%,5%)] shrink-0 select-none z-10">
      {/* Sidebar toggle */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        className="p-1.5 rounded-md hover:bg-[hsl(0,0%,14%)] text-[hsl(0,0%,60%)] hover:text-[hsl(0,0%,90%)] transition-colors mr-3"
      >
        <PanelLeft size={18} />
      </button>

      {/* Conversation title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h1 className="text-sm font-medium text-[hsl(0,0%,80%)] truncate">
          {currentConv?.title || "AI-X Strategic Workspace"}
        </h1>
      </div>

      {/* Agent status */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isActive
              ? "bg-yellow-500 animate-pulse"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-xs text-[hsl(0,0%,55%)]">{status.label}</span>
      </div>

      {/* App badge */}
      <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-[hsl(0,0%,14.9%)]">
        <Zap size={14} className="text-[hsl(0,0%,50%)]" />
        <span className="text-xs font-medium text-[hsl(0,0%,50%)] tracking-wide">
          AI-X
        </span>
      </div>
    </header>
  );
}
