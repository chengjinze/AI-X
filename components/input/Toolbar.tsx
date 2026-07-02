"use client";

import { ModeSelector } from "./ModeSelector";
import { useChatContext } from "@/lib/store/chat-store";
import { generateId } from "@/lib/utils";
import { Paperclip } from "lucide-react";

interface ToolbarProps {
  onSubmit: () => void;
}

export function Toolbar({ onSubmit }: ToolbarProps) {
  const { state, dispatch } = useChatContext();

  const handleFileClick = () => {
    // Simulate file upload with a randomly named file
    const mockFiles = [
      { name: "Q1-report.pdf", size: 2.4 * 1024 * 1024, type: "application/pdf" },
      { name: "competitor-analysis.xlsx", size: 1.1 * 1024 * 1024, type: "application/xlsx" },
      { name: "market-data.csv", size: 512 * 1024, type: "text/csv" },
      { name: "strategy-notes.md", size: 48 * 1024, type: "text/markdown" },
    ];
    const file = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    dispatch({
      type: "ADD_FILE",
      file: { id: `file-${generateId()}`, ...file },
    });
  };

  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-2">
        <ModeSelector />

        <button
          onClick={handleFileClick}
          className="p-1.5 rounded-md text-[hsl(0,0%,40%)] hover:text-[hsl(0,0%,70%)] hover:bg-[hsl(0,0%,10%)] transition-all"
          title="Attach file"
        >
          <Paperclip size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[hsl(0,0%,30%)]">
          {state.inputValue.length > 0 && `${state.inputValue.length}`}
        </span>
      </div>
    </div>
  );
}
