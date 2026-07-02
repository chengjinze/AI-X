"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { Square, ArrowUp } from "lucide-react";
import { useRef, useEffect, KeyboardEvent } from "react";

interface TextInputProps {
  onSubmit: () => void;
}

export function TextInput({ onSubmit }: TextInputProps) {
  const { state, dispatch } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [state.inputValue]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (state.inputValue.trim() || state.uploadedFiles.length > 0) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex items-end gap-2 bg-[hsl(0,0%,9%)] border border-[hsl(0,0%,18%)] rounded-2xl px-4 py-3 focus-within:border-[hsl(0,0%,28%)] transition-colors">
      <textarea
        ref={textareaRef}
        value={state.inputValue}
        onChange={(e) => dispatch({ type: "SET_INPUT", value: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything — strategic analysis, deep research, decision frameworks..."
        rows={1}
        className="flex-1 bg-transparent resize-none text-sm text-[hsl(0,0%,85%)] placeholder:text-[hsl(0,0%,35%)] focus:outline-none min-h-[24px] max-h-[200px]"
      />
      <button
        onClick={onSubmit}
        disabled={
          !state.isStreaming &&
          !state.inputValue.trim() &&
          state.uploadedFiles.length === 0
        }
        className="p-1.5 rounded-lg transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: state.isStreaming
            ? "hsl(0,70%,45%)"
            : state.inputValue.trim() || state.uploadedFiles.length > 0
            ? "hsl(0,0%,85%)"
            : "hsl(0,0%,20%)",
          color: state.isStreaming
            ? "white"
            : state.inputValue.trim() || state.uploadedFiles.length > 0
            ? "hsl(0,0%,10%)"
            : "hsl(0,0%,40%)",
        }}
      >
        {state.isStreaming ? <Square size={16} /> : <ArrowUp size={16} />}
      </button>
    </div>
  );
}
