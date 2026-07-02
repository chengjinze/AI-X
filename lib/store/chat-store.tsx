"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { ChatState, ChatAction, Message, Conversation } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { conversationsApi } from "@/lib/api/conversations";

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  agentStatus: { phase: "idle", label: "Ready", progress: 0 },
  inputValue: "",
  uploadedFiles: [],
  researchMode: "normal",
  isSidebarOpen: true,
  clarificationState: { round: 0, isClarifying: false, keyFactsRequested: false },
};

const defaultClarification = { round: 0, isClarifying: false, keyFactsRequested: false };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "LOAD_CONVERSATIONS":
      return { ...state, conversations: action.payload };

    case "LOAD_MESSAGES":
      return { ...state, messages: action.payload };

    case "SELECT_CONVERSATION": {
      const conv = state.conversations.find((c) => c.id === action.id);
      return {
        ...state,
        currentConversationId: action.id,
        researchMode: (conv?.mode as ChatState["researchMode"]) || "normal",
        clarificationState: { ...defaultClarification },
      };
    }

    case "NEW_CONVERSATION": {
      const newConv: Conversation = action.payload || {
        id: `conv-${generateId()}`,
        title: "New Research",
        lastMessage: "",
        mode: "normal",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
      };
      return {
        ...state,
        conversations: [newConv, ...state.conversations],
        currentConversationId: newConv.id,
        messages: [],
        researchMode: "normal",
        inputValue: "",
        uploadedFiles: [],
        clarificationState: { ...defaultClarification },
      };
    }

    case "DELETE_CONVERSATION": {
      const filtered = state.conversations.filter((c) => c.id !== action.id);
      const newCurrent =
        state.currentConversationId === action.id
          ? filtered[0]?.id || null
          : state.currentConversationId;
      return { ...state, conversations: filtered, currentConversationId: newCurrent, messages: newCurrent ? state.messages : [] };
    }

    case "TOGGLE_FAVORITE":
      return { ...state, conversations: state.conversations.map((c) => c.id === action.id ? { ...c, isFavorite: !c.isFavorite } : c) };

    case "RENAME_CONVERSATION":
      return { ...state, conversations: state.conversations.map((c) => c.id === action.id ? { ...c, title: action.title } : c) };

    case "SET_INPUT":
      return { ...state, inputValue: action.value };

    case "ADD_FILE":
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.file] };

    case "REMOVE_FILE":
      return { ...state, uploadedFiles: state.uploadedFiles.filter((f) => f.id !== action.id) };

    case "SET_RESEARCH_MODE":
      return { ...state, researchMode: action.mode, clarificationState: { ...defaultClarification } };

    case "SET_CLARIFICATION_STATE":
      return { ...state, clarificationState: action.state };

    case "SEND_MESSAGE": {
      if (!state.inputValue.trim() && state.uploadedFiles.length === 0) return state;
      const userMsg: Message = {
        id: `msg-${generateId()}`,
        role: "user",
        content: state.inputValue,
        timestamp: new Date().toISOString(),
        files: state.uploadedFiles.length > 0 ? [...state.uploadedFiles] : undefined,
      };
      return { ...state, messages: [...state.messages, userMsg], inputValue: "", uploadedFiles: [], isStreaming: true, agentStatus: { phase: "thinking", label: "Thinking...", progress: 0.1 } };
    }

    case "SEND_TEXT": {
      if (!action.text.trim() && state.uploadedFiles.length === 0) return state;
      const userMsg: Message = {
        id: `msg-${generateId()}`,
        role: "user",
        content: action.text,
        timestamp: new Date().toISOString(),
        files: state.uploadedFiles.length > 0 ? [...state.uploadedFiles] : undefined,
      };
      return { ...state, messages: [...state.messages, userMsg], inputValue: "", uploadedFiles: [], isStreaming: true, agentStatus: { phase: "thinking", label: "Thinking...", progress: 0.1 } };
    }

    case "APPEND_STREAM": {
      const msgs = [...state.messages];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === "agent") {
        msgs[msgs.length - 1] = { ...lastMsg, content: lastMsg.content + action.content };
      } else {
        msgs.push({ id: `msg-${generateId()}`, role: "agent", content: action.content, timestamp: new Date().toISOString() });
      }
      return { ...state, messages: msgs };
    }

    case "SET_AGENT_STATUS":
      return { ...state, agentStatus: action.status };

    case "ADD_THINKING_BLOCK": {
      const msgs = [...state.messages];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role === "agent") {
        msgs[msgs.length - 1] = { ...lastMsg, thinkingBlocks: [...(lastMsg.thinkingBlocks || []), action.content] };
      }
      return { ...state, messages: msgs };
    }

    case "FINISH_MESSAGE":
      return { ...state, isStreaming: false, agentStatus: { phase: "idle", label: "Ready", progress: 0 } };

    case "SEARCH_CONVERSATIONS":
      return { ...state };

    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    default:
      return state;
  }
}

const ChatContext = createContext<{ state: ChatState; dispatch: React.Dispatch<ChatAction> } | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const conversations = await conversationsApi.list();
        dispatch({ type: "LOAD_CONVERSATIONS", payload: conversations });
        if (conversations.length > 0) {
          const detail = await conversationsApi.get(conversations[0].id);
          dispatch({ type: "LOAD_MESSAGES", payload: detail.messages || [] });
          dispatch({ type: "SELECT_CONVERSATION", id: conversations[0].id });
        }
      } catch { console.log("API not ready — using empty state"); }
    })();
  }, []);

  return <ChatContext.Provider value={{ state, dispatch }}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}


