"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { formatFileSize } from "@/lib/utils";
import { X, FileText, FileSpreadsheet, FileArchive, LucideIcon } from "lucide-react";

const fileIcons: Record<string, LucideIcon> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: FileText,
  pptx: FileText,
  md: FileText,
  zip: FileArchive,
};

export function FileUpload() {
  const { state, dispatch } = useChatContext();

  if (state.uploadedFiles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {state.uploadedFiles.map((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const Icon = fileIcons[ext] || FileText;

        return (
          <div
            key={file.id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[hsl(0,0%,11%)] border border-[hsl(0,0%,18%)] text-xs text-[hsl(0,0%,65%)] group"
          >
            <Icon size={13} className="text-[hsl(0,0%,45%)]" />
            <span className="max-w-[140px] truncate">{file.name}</span>
            <span className="text-[10px] text-[hsl(0,0%,35%)]">
              {formatFileSize(file.size)}
            </span>
            <button
              onClick={() => dispatch({ type: "REMOVE_FILE", id: file.id })}
              className="ml-0.5 p-0.5 rounded hover:bg-[hsl(0,0%,18%)] transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}