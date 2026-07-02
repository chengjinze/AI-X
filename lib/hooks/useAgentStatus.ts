"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { AgentStatus } from "@/lib/types";

export function useAgentStatus(): {
  status: AgentStatus;
  isActive: boolean;
} {
  const { state } = useChatContext();
  return {
    status: state.agentStatus,
    isActive: state.isStreaming || state.agentStatus.phase !== "idle",
  };
}
