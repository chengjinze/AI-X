"use client";

import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseClarificationOptions } from "@/lib/utils/clarification";
import { ThinkingBlock } from "./ThinkingBlock";
import { ClarificationCard } from "./ClarificationCard";
import { ResearchChoiceCard } from "./ResearchChoiceCard";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onClarificationSubmit?: (response: string) => void;
  onResearchChoice?: (choice: "deep-research" | "quick-analysis") => void;
}

/** Content qualifies as a clarification if it has [CLARIFY] tag OR contains <question> tags. */
function isClarificationContent(content: string): boolean {
  return /\[CLARIFY\]/i.test(content) || /<question>[\s\S]*?<\/question>/i.test(content);
}

export function MessageBubble({ message, onClarificationSubmit, onResearchChoice }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isClarify = !isUser && isClarificationContent(message.content);
  const isResearchChoice = !isUser && message.content.startsWith("[RESEARCH_CHOICE]");

  const clarification = isClarify ? parseClarificationOptions(message.content) : null;
  const showCard = clarification?.hasOptions && onClarificationSubmit;

  // Extract summary text after [RESEARCH_CHOICE] marker
  const researchSummary = isResearchChoice
    ? message.content.replace(/^\[RESEARCH_CHOICE\]\s*/i, "").trim()
    : "";

  return (
    <div
      className={cn(
        "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
          isUser
            ? "bg-[hsl(0,0%,20%)] text-[hsl(0,0%,80%)]"
            : "bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,18%)] text-[hsl(0,0%,50%)]"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div
        className={cn(
          "flex-1 min-w-0",
          isUser && "flex flex-col items-end"
        )}
      >
        {!isUser && message.thinkingBlocks && message.thinkingBlocks.length > 0 && (
          <ThinkingBlock blocks={message.thinkingBlocks} />
        )}

        {/* Research choice card */}
        {isResearchChoice && onResearchChoice ? (
          <ResearchChoiceCard
            summary={researchSummary}
            onDeepResearch={() => onResearchChoice("deep-research")}
            onQuickAnalysis={() => onResearchChoice("quick-analysis")}
          />
        ) : showCard ? (
          /* Clarification card */
          <ClarificationCard
            preamble={clarification!.preamble}
            questions={clarification!.questions}
            onSubmit={onClarificationSubmit}
          />
        ) : (
          /* Normal message */
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "bg-[hsl(0,0%,14%)] text-[hsl(0,0%,95%)] max-w-[85%]"
                : "text-[hsl(0,0%,85%)]"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,15%)] text-[11px] text-[hsl(0,0%,60%)]"
              >
                <FileText size={12} />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
