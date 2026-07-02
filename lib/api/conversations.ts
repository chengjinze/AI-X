// ============================================================
// Conversations API client
// ============================================================

import { apiFetch } from "./client";
import type { Conversation, Message } from "@/lib/types";

export type ConversationWithMessages = Conversation & { messages: Message[] };

export const conversationsApi = {
  list: () =>
    apiFetch<Conversation[]>("/api/conversations"),

  get: (id: string) =>
    apiFetch<ConversationWithMessages>(`/api/conversations/${id}`),

  create: (title?: string, mode?: string) =>
    apiFetch<Conversation>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title, mode }),
    }),

  update: (id: string, updates: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/conversations/${id}`, {
      method: "DELETE",
    }),
};
