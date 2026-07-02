"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { Loader2, Search, Brain, FileSearch, Sparkles, Check, LucideIcon } from "lucide-react";
import { AgentStatusPhase } from "@/lib/types";

const phaseConfig: Record<
  AgentStatusPhase,
  { icon: LucideIcon; color: string }
> = {
  idle: { icon: Check, color: "text-emerald-500" },
  thinking: { icon: Brain, color: "text-purple-400" },
  searching: { icon: Search, color: "text-blue-400" },
  planning: { icon: FileSearch, color: "text-amber-400" },
  "reading-files": { icon: FileSearch, color: "text-cyan-400" },
  "running-analysis": { icon: Sparkles, color: "text-rose-400" },
  synthesizing: { icon: Loader2, color: "text-emerald-400" },
  done: { icon: Check, color: "text-emerald-500" },
};

export function AgentStatus() {
  const { state } = useChatContext();
  const { phase, label, progress } = state.agentStatus;
  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className={`${config.color} ${phase === "synthesizing" ? "animate-spin" : ""}`}
        />
        <span className="text-xs text-[hsl(0,0%,50%)] font-medium">{label}</span>
      </div>
      <div className="w-full h-0.5 bg-[hsl(0,0%,12%)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}