"use client";

import { useCallback, useRef } from "react";
import { useChatContext } from "@/lib/store/chat-store";
import { streamChat } from "@/lib/api/client";
import { AgentStatusPhase } from "@/lib/types";
import { conversationsApi } from "@/lib/api/conversations";

const STATUS_SEQUENCE: { phase: AgentStatusPhase; label: string; progress: number }[] = [
  { phase: "thinking", label: "Thinking...", progress: 0.15 },
  { phase: "searching", label: "Searching...", progress: 0.35 },
  { phase: "running-analysis", label: "Running analysis...", progress: 0.65 },
  { phase: "synthesizing", label: "Synthesizing research...", progress: 0.9 },
];

export function useChat() {
  const { state, dispatch } = useChatContext();
  const abortRef = useRef<(() => void) | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendTokenRef = useRef(0);

  const doSend = useCallback(
    async (text: string, conversationId?: string, mode?: string) => {
      if (!text.trim() && state.uploadedFiles.length === 0) return;
      const token = ++sendTokenRef.current;

      const sendWithConv = async (convId: string) => {
        dispatch({ type: "SEND_TEXT", text });

        let statusIdx = 0;
        statusTimerRef.current = setInterval(() => {
          if (statusIdx < STATUS_SEQUENCE.length) {
            dispatch({ type: "SET_AGENT_STATUS", status: STATUS_SEQUENCE[statusIdx] });
            statusIdx++;
          } else {
            if (statusTimerRef.current) clearInterval(statusTimerRef.current);
          }
        }, 600);

        const effectiveMode = mode || state.researchMode;

        const { abort } = streamChat(
          {
            conversationId: convId,
            message: text,
            files: state.uploadedFiles.length > 0 ? state.uploadedFiles : undefined,
            mode: effectiveMode,
            clarificationState: state.clarificationState,
          },
          {
            onText: (content) => dispatch({ type: "APPEND_STREAM", content }),
            onThinking: (content) => dispatch({ type: "ADD_THINKING_BLOCK", content }),
            onToolCall: (toolName) => {
              dispatch({
                type: "SET_AGENT_STATUS",
                status: { phase: "searching", label: "Searching: " + toolName, progress: 0.5 },
              });
            },
            onError: (error) => {
              if (sendTokenRef.current !== token) return;
              if (statusTimerRef.current) clearInterval(statusTimerRef.current);
              dispatch({ type: "APPEND_STREAM", content: "\n\n*Error: " + error + "*" });
              dispatch({ type: "FINISH_MESSAGE" });
            },
            onDone: (newConvId, clarificationState) => {
              if (sendTokenRef.current !== token) return;
              if (statusTimerRef.current) clearInterval(statusTimerRef.current);
              if (clarificationState) {
                dispatch({ type: "SET_CLARIFICATION_STATE", state: clarificationState });
              }
              if (newConvId && newConvId !== convId) {
                conversationsApi.list().then((convs) => {
                  dispatch({ type: "LOAD_CONVERSATIONS", payload: convs });
                  const created = convs.find((c) => c.id === newConvId);
                  if (created) dispatch({ type: "NEW_CONVERSATION", payload: created });
                }).catch(() => {});
              }
              dispatch({ type: "FINISH_MESSAGE" });
            },
          }
        );
        abortRef.current = abort;
      };

      let convId = conversationId || state.currentConversationId;
      if (!convId) {
        try {
          const conv = await conversationsApi.create(
            text.slice(0, 50) + (text.length > 50 ? "..." : ""),
            mode || state.researchMode
          );
          dispatch({ type: "NEW_CONVERSATION", payload: conv });
          convId = conv.id;
        } catch {
          convId = "temp-" + Date.now();
        }
      }
      await sendWithConv(convId);
    },
    [state.uploadedFiles, state.isStreaming, state.researchMode, state.currentConversationId, state.clarificationState, dispatch]
  );

  const sendMessage = useCallback(() => {
    doSend(state.inputValue);
  }, [state.inputValue, doSend]);

  const sendWithText = useCallback(
    (text: string) => { doSend(text); },
    [doSend]
  );

  /**
   * Handle the research choice from ResearchChoiceCard.
   * If deep-research: switch mode, send the clarified problem as the research topic.
   * If quick-analysis: keep normal mode, send for a quick strategic analysis.
   */
  const sendResearchChoice = useCallback(
    (choice: "deep-research" | "quick-analysis") => {
      // Find the last [RESEARCH_CHOICE] message to get the clarified problem
      const lastChoice = [...state.messages].reverse().find(
        (m) => m.role === "agent" && m.content.startsWith("[RESEARCH_CHOICE]")
      );
      const problemSummary = lastChoice
        ? lastChoice.content.replace(/^\[RESEARCH_CHOICE\]\s*/i, "").trim()
        : "Please analyze the problem we discussed.";

      if (choice === "deep-research") {
        // Switch to deep research mode
        dispatch({ type: "SET_RESEARCH_MODE", mode: "deep-research" });
        // Send the clarified problem for deep research
        doSend(
          "Please conduct deep research on the following problem:\n\n" + problemSummary,
          undefined,
          "deep-research"
        );
      } else {
        // Quick analysis — keep normal mode, ask for a strategic answer
        dispatch({ type: "SET_RESEARCH_MODE", mode: "normal" });
        doSend(
          "Please provide a strategic analysis for the following clarified problem:\n\n" + problemSummary,
          undefined,
          "normal"
        );
      }
    },
    [state.messages, dispatch, doSend]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.();
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    dispatch({ type: "FINISH_MESSAGE" });
  }, [dispatch]);

  return { sendMessage, stopStreaming, sendWithText, sendResearchChoice };
}

