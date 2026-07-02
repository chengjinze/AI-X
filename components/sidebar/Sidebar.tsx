"use client";

import { useChatContext } from "@/lib/store/chat-store";
import { NewChatButton } from "./NewChatButton";
import { SearchConversations } from "./SearchConversations";
import { ConversationList } from "./ConversationList";
import { Star } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { state } = useChatContext();

  const favorites = useMemo(
    () => state.conversations.filter((c) => c.isFavorite),
    [state.conversations]
  );

  return (
    <aside
      className={cn(
        "h-full bg-[hsl(0,0%,5.5%)] border-r border-[hsl(0,0%,14.9%)] flex flex-col shrink-0 transition-all duration-200",
        state.isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-r-0"
      )}
    >
      <div className="flex flex-col h-full p-3 min-w-[260px]">
        <NewChatButton />
        <SearchConversations />

        <div className="flex-1 overflow-hidden mt-2">
          <ConversationList
            conversations={state.conversations}
            currentId={state.currentConversationId}
          />

          {favorites.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[hsl(0,0%,14.9%)]">
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <Star size={12} className="text-[hsl(45,80%,55%)]" />
                <span className="text-[11px] font-medium text-[hsl(0,0%,45%)] tracking-wide uppercase">
                  Favorites
                </span>
              </div>
              <ConversationList
                conversations={favorites}
                currentId={state.currentConversationId}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
