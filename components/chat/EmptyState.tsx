"use client";

import { Zap, Search, Lightbulb, ArrowRight } from "lucide-react";
import { useChatContext } from "@/lib/store/chat-store";

const suggestions = [
  {
    icon: Search,
    text: "Analyze Tesla's competitive moat in the EV market",
    mode: "strategic-analysis" as const,
  },
  {
    icon: Lightbulb,
    text: "What are the second-order effects of AI on consulting?",
    mode: "deep-research" as const,
  },
  {
    icon: Zap,
    text: "Compare cloud infrastructure pricing strategies",
    mode: "normal" as const,
  },
];

export function EmptyState() {
  const { dispatch } = useChatContext();

  return (
    <div className="max-w-lg mx-auto text-center px-6">
      {/* Logo area */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
        <Zap size={22} className="text-white" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-[hsl(0,0%,90%)] mb-2">
        AI Strategic Workspace
      </h1>
      <p className="text-sm text-[hsl(0,0%,50%)] mb-8 leading-relaxed">
        Enterprise-grade AI for strategic consulting, decision analysis, and
        deep research. Ask complex, multi-layered questions.
      </p>

      {/* Quick start suggestions */}
      <div className="space-y-2">
        <p className="text-[11px] text-[hsl(0,0%,40%)] uppercase tracking-wider font-medium mb-3">
          Try asking
        </p>
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                dispatch({ type: "SET_RESEARCH_MODE", mode: s.mode });
                dispatch({ type: "SET_INPUT", value: s.text });
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[hsl(0,0%,15%)] hover:border-[hsl(0,0%,22%)] bg-[hsl(0,0%,7%)] hover:bg-[hsl(0,0%,10%)] transition-all group"
            >
              <Icon size={14} className="text-[hsl(0,0%,35%)] group-hover:text-[hsl(0,0%,60%)] shrink-0" />
              <span className="text-[13px] text-[hsl(0,0%,55%)] group-hover:text-[hsl(0,0%,80%)] flex-1">
                {s.text}
              </span>
              <ArrowRight
                size={13}
                className="text-[hsl(0,0%,25%)] group-hover:text-[hsl(0,0%,50%)] transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
