"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ClarificationOption } from "@/lib/utils/clarification";
import { Send, Edit3, Check } from "lucide-react";

interface ClarificationCardProps {
  preamble: string;
  questions: ClarificationOption[];
  onSubmit: (response: string) => void;
}

export function ClarificationCard({ preamble, questions, onSubmit }: ClarificationCardProps) {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [usingCustom, setUsingCustom] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If a question has no predefined options, auto-enable custom mode
  const isFreeTextOnly = (qIdx: number) => questions[qIdx]?.options.length === 0;

  const handleSelect = (qIndex: number, oIndex: number) => {
    if (isSubmitting) return;
    setSelections((prev) => ({ ...prev, [qIndex]: oIndex }));
    setUsingCustom((prev) => ({ ...prev, [qIndex]: false }));
  };

  const handleCustomToggle = (qIndex: number) => {
    if (isSubmitting || isFreeTextOnly(qIndex)) return;
    setUsingCustom((prev) => {
      const next = { ...prev, [qIndex]: !prev[qIndex] };
      if (!prev[qIndex]) {
        setSelections((s) => {
          const n = { ...s };
          delete n[qIndex];
          return n;
        });
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const answered = questions.map((q, i) => ({
      ...q,
      selectedIndex: usingCustom[i]
        ? q.options.length
        : selections[i] ?? -1,
    }));

    const lines: string[] = [];
    for (let i = 0; i < answered.length; i++) {
      const a = answered[i];
      if ((usingCustom[i] || isFreeTextOnly(i)) && customInputs[i]?.trim()) {
        lines.push(a.question + "\n  → " + customInputs[i].trim());
      } else if (a.selectedIndex >= 0 && a.selectedIndex < a.options.length) {
        lines.push(a.question + "\n  → " + a.options[a.selectedIndex]);
      }
    }

    if (lines.length > 0) {
      onSubmit(lines.join("\n\n"));
    }
  };

  const allAnswered = questions.every(
    (_, i) =>
      selections[i] !== undefined ||
      ((usingCustom[i] || isFreeTextOnly(i)) && customInputs[i]?.trim())
  );

  return (
    <div className="space-y-4">
      {preamble && (
        <div className="text-sm text-[hsl(0,0%,80%)] leading-relaxed whitespace-pre-wrap">
          {preamble}
        </div>
      )}

      {questions.map((q, qIdx) => {
        const hasOptions = q.options.length > 0;
        const showCustom = usingCustom[qIdx] || isFreeTextOnly(qIdx);

        return (
          <div key={qIdx} className="space-y-2">
            {q.question !== "Your response" && (
              <p className="text-[11px] font-semibold text-[hsl(0,0%,50%)] uppercase tracking-wider">
                {q.question}
              </p>
            )}

            {hasOptions && (
              <div className="space-y-1.5">
                {q.options.map((opt, oIdx) => {
                  const isSelected = !usingCustom[qIdx] && selections[qIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(qIdx, oIdx);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-all duration-100 border",
                        "flex items-center gap-3",
                        isSelected
                          ? "bg-[hsl(217,50%,12%)] border-[hsl(217,50%,35%)] cursor-pointer"
                          : "bg-[hsl(0,0%,6%)] border-[hsl(0,0%,14%)] hover:border-[hsl(0,0%,22%)] hover:bg-[hsl(0,0%,8%)] cursor-pointer"
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "border-[hsl(217,70%,55%)] bg-[hsl(217,70%,55%)]"
                            : "border-[hsl(0,0%,25%)]"
                        )}
                      >
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected
                            ? "text-[hsl(217,80%,85%)]"
                            : "text-[hsl(0,0%,65%)]"
                        )}
                      >
                        {opt}
                      </span>
                    </button>
                  );
                })}

                {!isFreeTextOnly(qIdx) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCustomToggle(qIdx);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-all duration-100 border flex items-center gap-3",
                      usingCustom[qIdx]
                        ? "bg-[hsl(35,50%,10%)] border-[hsl(35,50%,30%)] cursor-pointer"
                        : "bg-[hsl(0,0%,6%)] border-dashed border-[hsl(0,0%,14%)] hover:border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,8%)] cursor-pointer"
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        usingCustom[qIdx]
                          ? "border-[hsl(35,60%,50%)] bg-[hsl(35,60%,50%)]"
                          : "border-[hsl(0,0%,20%)]"
                      )}
                    >
                      {usingCustom[qIdx] ? (
                        <Check size={11} className="text-white" strokeWidth={3} />
                      ) : (
                        <Edit3 size={10} className="text-[hsl(0,0%,30%)]" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        usingCustom[qIdx]
                          ? "text-[hsl(35,80%,80%)] font-medium"
                          : "text-[hsl(0,0%,40%)]"
                      )}
                    >
                      Other — let me specify
                    </span>
                  </button>
                )}
              </div>
            )}

            {showCustom && (
              <textarea
                value={customInputs[qIdx] || ""}
                onChange={(e) =>
                  setCustomInputs((prev) => ({ ...prev, [qIdx]: e.target.value }))
                }
                placeholder={isFreeTextOnly(qIdx) ? "Type your response..." : "Type your own answer..."}
                className="w-full mt-1 px-4 py-3 rounded-lg bg-[hsl(0,0%,6%)] border border-[hsl(35,50%,25%)] text-sm text-[hsl(0,0%,85%)] placeholder:text-[hsl(0,0%,30%)] focus:outline-none focus:border-[hsl(35,60%,40%)] resize-none"
                rows={isFreeTextOnly(qIdx) ? 3 : 2}
              />
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        disabled={!allAnswered || isSubmitting}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-100",
          allAnswered && !isSubmitting
            ? "bg-[hsl(0,0%,90%)] text-[hsl(0,0%,8%)] hover:bg-[hsl(0,0%,100%)] active:scale-[0.98] cursor-pointer"
            : "bg-[hsl(0,0%,10%)] text-[hsl(0,0%,30%)] cursor-not-allowed"
        )}
      >
        <Send size={13} />
        Submit
      </button>
    </div>
  );
}
