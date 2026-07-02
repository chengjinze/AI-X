"use client";

import { Conversation } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useConversations } from "@/lib/hooks/useConversations";
import { MessageSquare, Star, Trash2, Search, Lightbulb } from "lucide-react";
import { useState } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  currentId: string | null;
  compact?: boolean;
}

const modeIcons = {
  normal: MessageSquare,
  "deep-research": Search,
  "strategic-analysis": Lightbulb,
};

export function ConversationList({
  conversations,
  currentId,
  compact,
}: ConversationListProps) {
  const {
    selectConversation,
    deleteConversation,
    toggleFavorite,
  } = useConversations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-0.5 overflow-y-auto h-full">
      {conversations.map((conv) => {
        const isActive = conv.id === currentId;
        const isHovered = conv.id === hoveredId;
        const Icon = modeIcons[conv.mode];

        return (
          <button
            key={conv.id}
            onClick={() => selectConversation(conv.id)}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "w-full text-left px-2.5 py-2 rounded-md transition-all group flex items-start gap-2",
              isActive
                ? "bg-[hsl(0,0%,14%)] text-[hsl(0,0%,95%)]"
                : "text-[hsl(0,0%,55%)] hover:bg-[hsl(0,0%,10%)] hover:text-[hsl(0,0%,80%)]"
            )}
          >
            <Icon
              size={14}
              className={cn(
                "mt-0.5 shrink-0",
                isActive ? "text-[hsl(0,0%,60%)]" : "text-[hsl(0,0%,35%)]"
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "text-[13px] font-medium truncate",
                    compact && "text-xs"
                  )}
                >
                  {conv.title}
                </span>
                {!compact && (
                  <span className="text-[10px] text-[hsl(0,0%,35%)] shrink-0">
                    {formatDate(conv.updatedAt)}
                  </span>
                )}
              </div>
              {!compact && conv.lastMessage && (
                <p className="text-[11px] text-[hsl(0,0%,40%)] truncate mt-0.5 leading-tight">
                  {conv.lastMessage}
                </p>
              )}
            </div>

            {/* Hover actions */}
            {isHovered && (
              <div className="flex items-center gap-0.5 shrink-0">
                <span
                  className="p-0.5 rounded hover:bg-[hsl(0,0%,20%)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(conv.id);
                  }}
                >
                  <Star
                    size={12}
                    className={cn(
                      conv.isFavorite
                        ? "fill-[hsl(45,80%,55%)] text-[hsl(45,80%,55%)]"
                        : "text-[hsl(0,0%,35%)]"
                    )}
                  />
                </span>
                <span
                  className="p-0.5 rounded hover:bg-[hsl(0,0%,20%)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 size={12} className="text-[hsl(0,0%,35%)] hover:text-red-400" />
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
