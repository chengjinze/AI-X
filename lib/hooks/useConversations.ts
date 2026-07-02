"use client";

import { useCallback } from "react";
import { useChatContext } from "@/lib/store/chat-store";
import { conversationsApi } from "@/lib/api/conversations";

export function useConversations() {
  const { state, dispatch } = useChatContext();

  const selectConversation = useCallback(
    async (id: string) => {
      dispatch({ type: "SELECT_CONVERSATION", id });
      try {
        const detail = await conversationsApi.get(id);
        dispatch({ type: "LOAD_MESSAGES", payload: detail.messages || [] });
      } catch {
        console.error("Failed to load messages for conversation", id);
      }
    },
    [dispatch]
  );

  const newConversation = useCallback(async () => {
    try {
      const conv = await conversationsApi.create();
      dispatch({ type: "NEW_CONVERSATION", payload: conv });
    } catch {
      dispatch({ type: "NEW_CONVERSATION" });
    }
  }, [dispatch]);

  const deleteConversation = useCallback(
    async (id: string) => {
      dispatch({ type: "DELETE_CONVERSATION", id });
      try {
        await conversationsApi.delete(id);
      } catch {
        console.error("Failed to delete conversation", id);
      }
    },
    [dispatch]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const conv = state.conversations.find((c) => c.id === id);
      if (!conv) return;

      dispatch({ type: "TOGGLE_FAVORITE", id });
      try {
        await conversationsApi.update(id, { is_favorite: !conv.isFavorite });
      } catch {
        console.error("Failed to toggle favorite", id);
      }
    },
    [state.conversations, dispatch]
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      dispatch({ type: "RENAME_CONVERSATION", id, title });
      try {
        await conversationsApi.update(id, { title });
      } catch {
        console.error("Failed to rename conversation", id);
      }
    },
    [dispatch]
  );

  return {
    conversations: state.conversations,
    currentConversationId: state.currentConversationId,
    selectConversation,
    newConversation,
    deleteConversation,
    toggleFavorite,
    renameConversation,
  };
}
