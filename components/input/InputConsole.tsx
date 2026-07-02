"use client";

import { TextInput } from "./TextInput";
import { FileUpload } from "./FileUpload";
import { ModeSelector } from "./ModeSelector";
import { Toolbar } from "./Toolbar";
import { useChat } from "@/lib/hooks/useChat";
import { useChatContext } from "@/lib/store/chat-store";

export function InputConsole() {
  const { sendMessage, stopStreaming } = useChat();
  const { state, dispatch } = useChatContext();

  const handleSubmit = () => {
    if (state.isStreaming) {
      stopStreaming();
    } else {
      sendMessage();
    }
  };

  return (
    <div className="border-t border-[hsl(0,0%,14.9%)] bg-[hsl(0,0%,5%)]">
      <div className="max-w-3xl mx-auto p-3">
        {/* File upload area */}
        {state.uploadedFiles.length > 0 && <FileUpload />}

        {/* Text input area */}
        <div className="relative">
          <TextInput onSubmit={handleSubmit} />
        </div>

        {/* Bottom toolbar */}
        <Toolbar onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
