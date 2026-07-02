"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  blocks: string[];
}

export function ThinkingBlock({ blocks }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,70%)] transition-colors"
      >
        <Brain size={12} />
        <span>
          {isOpen ? "Hide" : "Show"} reasoning ({blocks.length} steps)
        </span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="mt-2 pl-3 border-l-2 border-[hsl(0,0%,15%)] space-y-1.5">
          {blocks.map((block, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-[12px] text-[hsl(0,0%,50%)]"
            >
              <Check size={12} className="mt-0.5 text-emerald-500 shrink-0" />
              <span>{block}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
