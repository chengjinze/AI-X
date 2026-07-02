"use client";

import { useConversations } from "@/lib/hooks/useConversations";
import { PencilLine } from "lucide-react";

export function NewChatButton() {
  const { newConversation } = useConversations();

  return (
    <button
      onClick={newConversation}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,25%)] bg-[hsl(0,0%,8%)] hover:bg-[hsl(0,0%,10%)] text-sm text-[hsl(0,0%,65%)] hover:text-[hsl(0,0%,90%)] transition-all mb-2"
    >
      <PencilLine size={15} />
      <span>New Research</span>
    </button>
  );
}
