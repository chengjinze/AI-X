"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { ResearchMode } from "@/lib/types";
import { MessageSquare, Search, Lightbulb, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const modes: { id: ResearchMode; label: string; icon: LucideIcon }[] = [
  { id: "normal", label: "Chat", icon: MessageSquare },
  { id: "deep-research", label: "Deep Research", icon: Search },
  { id: "strategic-analysis", label: "Strategic", icon: Lightbulb },
];

export function ModeSelector() {
  const { state, dispatch } = useChatContext();

  return (
    <div className="flex items-center gap-1">
      {modes.map((mode) => {
        const isActive = state.researchMode === mode.id;
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => dispatch({ type: "SET_RESEARCH_MODE", mode: mode.id })}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer",
              isActive
                ? "bg-[hsl(0,0%,14%)] text-[hsl(0,0%,90%)]"
                : "text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,70%)] hover:bg-[hsl(0,0%,10%)]"
            )}
          >
            <Icon size={12} />
            <span className="font-medium">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
