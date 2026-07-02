import { createClient } from "@supabase/supabase-js";

// Flag to detect if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Server-side client with service_role key (full access, NEVER expose to client)
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "public" },
  });
}

// Singleton for server-side use
let _serverClient: ReturnType<typeof createServerClient> | null = null;

export function getServerClient() {
  if (!_serverClient) {
    _serverClient = createServerClient();
  }
  return _serverClient || null;
}

// ---- Data access helpers ----

import type { Conversation, Message, UploadedFile } from "@/lib/types";

interface DbConversation {
  id: string;
  title: string;
  mode: string;
  provider: string;
  model: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  thinking_blocks: string[];
  files: UploadedFile[];
  tool_calls: unknown[];
  created_at: string;
}

function mapDbConversation(row: DbConversation): Conversation {
  return {
    id: row.id,
    title: row.title,
    lastMessage: "",
    mode: row.mode as Conversation["mode"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite,
  };
}

function mapDbMessage(row: DbMessage): Message {
  return {
    id: row.id,
    role: row.role as Message["role"],
    content: row.content,
    timestamp: row.created_at,
    thinkingBlocks: row.thinking_blocks || undefined,
    files: row.files || undefined,
  };
}

// Helper: throw if Supabase not configured
function requireClient() {
  const client = getServerClient();
  if (!client) {
    throw new Error("Supabase not configured");
  }
  return client;
}

export const db = {
  async listConversations(): Promise<Conversation[]> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data as DbConversation[]).map(mapDbConversation);
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return mapDbConversation(data as DbConversation);
  },

  async createConversation(
    title: string,
    mode: string = "normal",
    provider: string = "openai",
    model: string = "gpt-4o"
  ): Promise<Conversation> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({ title, mode, provider, model })
      .select("*")
      .single();

    if (error) throw error;
    return mapDbConversation(data as DbConversation);
  },

  async updateConversation(
    id: string,
    updates: Partial<{ title: string; mode: string; is_favorite: boolean; provider: string; model: string }>
  ): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async deleteConversation(id: string): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async listMessages(conversationId: string): Promise<Message[]> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as DbMessage[]).map(mapDbMessage);
  },

  async createMessage(msg: {
    conversationId: string;
    role: "user" | "agent" | "system";
    content: string;
    thinkingBlocks?: string[];
    files?: UploadedFile[];
    toolCalls?: unknown[];
  }): Promise<Message> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: msg.conversationId,
        role: msg.role,
        content: msg.content,
        thinking_blocks: msg.thinkingBlocks || [],
        files: msg.files || [],
        tool_calls: msg.toolCalls || [],
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapDbMessage(data as DbMessage);
  },

  async deleteMessage(id: string): Promise<void> {
    const supabase = requireClient();
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async uploadFile(
    conversationId: string,
    file: { name: string; size: number; type: string; buffer: Buffer }
  ): Promise<UploadedFile> {
    const supabase = requireClient();
    const storagePath = `${conversationId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("files")
      .upload(storagePath, file.buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("uploaded_files")
      .insert({
        conversation_id: conversationId,
        name: file.name,
        size: file.size,
        type: file.type,
        storage_path: storagePath,
      })
      .select("*")
      .single();

    if (error) throw error;

    return { id: data.id, name: data.name, size: data.size, type: data.type };
  },
};
