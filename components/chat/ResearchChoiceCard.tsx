"use client";

import { cn } from "@/lib/utils";
import { Search, Zap } from "lucide-react";

interface ResearchChoiceCardProps {
  summary: string;
  onDeepResearch: () => void;
  onQuickAnalysis: () => void;
}

export function ResearchChoiceCard({ summary, onDeepResearch, onQuickAnalysis }: ResearchChoiceCardProps) {
  return (
    <div className="space-y-5">
      {/* Problem summary */}
      <div className="rounded-xl bg-[hsl(217,30%,8%)] border border-[hsl(217,30%,20%)] px-4 py-3.5">
        <p className="text-[10px] font-semibold text-[hsl(217,60%,60%)] uppercase tracking-wider mb-2">
          Problem Clarified
        </p>
        <div className="text-sm text-[hsl(0,0%,80%)] leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="text-sm font-medium text-[hsl(0,0%,85%)]">
          Problem is now clear. How would you like to proceed?
        </p>
      </div>

      {/* Choice cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Deep Research option */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onDeepResearch();
          }}
          className={cn(
            "w-full text-left px-4 py-4 rounded-xl transition-all duration-100 border-2",
            "bg-[hsl(217,50%,8%)] border-[hsl(217,60%,40%)]",
            "hover:bg-[hsl(217,50%,12%)] hover:border-[hsl(217,60%,55%)]",
            "active:scale-[0.98] cursor-pointer"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(217,60%,20%)] flex items-center justify-center shrink-0 mt-0.5">
              <Search size={18} className="text-[hsl(217,80%,75%)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[hsl(0,0%,90%)]">
                Deep Research
              </p>
              <p className="text-xs text-[hsl(0,0%,50%)] mt-0.5 leading-relaxed">
                Full internet search with multi-source verification, causal analysis, and comprehensive strategic report
              </p>
            </div>
          </div>
        </button>

        {/* Quick Analysis option */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onQuickAnalysis();
          }}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl transition-all duration-100 border",
            "bg-[hsl(0,0%,6%)] border-[hsl(0,0%,16%)]",
            "hover:border-[hsl(0,0%,24%)] hover:bg-[hsl(0,0%,8%)]",
            "active:scale-[0.98] cursor-pointer"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(0,0%,14%)] flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={18} className="text-[hsl(0,0%,50%)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[hsl(0,0%,75%)]">
                Quick Analysis
              </p>
              <p className="text-xs text-[hsl(0,0%,40%)] mt-0.5 leading-relaxed">
                Direct strategic analysis based on existing knowledge without web search
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
