export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  mode: "normal" | "deep-research" | "strategic-analysis";
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export type AgentStatusPhase =
  | "idle"
  | "thinking"
  | "searching"
  | "planning"
  | "reading-files"
  | "running-analysis"
  | "synthesizing"
  | "done";

export interface AgentStatus {
  phase: AgentStatusPhase;
  label: string;
  progress: number;
}

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  thinkingBlocks?: string[];
  files?: UploadedFile[];
  clarified?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export type ResearchMode = "normal" | "deep-research" | "strategic-analysis";

export interface ClarificationState {
  round: number;
  isClarifying: boolean;
  keyFactsRequested: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  agentStatus: AgentStatus;
  inputValue: string;
  uploadedFiles: UploadedFile[];
  researchMode: ResearchMode;
  isSidebarOpen: boolean;
  clarificationState: ClarificationState;
}

export type ChatAction =
  | { type: "LOAD_CONVERSATIONS"; payload: Conversation[] }
  | { type: "LOAD_MESSAGES"; payload: Message[] }
  | { type: "SELECT_CONVERSATION"; id: string }
  | { type: "NEW_CONVERSATION"; payload?: Conversation }
  | { type: "DELETE_CONVERSATION"; id: string }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "RENAME_CONVERSATION"; id: string; title: string }
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_FILE"; file: UploadedFile }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "SET_RESEARCH_MODE"; mode: ResearchMode }
  | { type: "SEND_MESSAGE" } | { type: "SEND_TEXT"; text: string }
  | { type: "APPEND_STREAM"; content: string }
  | { type: "SET_AGENT_STATUS"; status: AgentStatus }
  | { type: "ADD_THINKING_BLOCK"; content: string }
  | { type: "FINISH_MESSAGE" }
  | { type: "SET_CLARIFICATION_STATE"; state: ClarificationState }
  | { type: "SEARCH_CONVERSATIONS"; query: string }
  | { type: "TOGGLE_SIDEBAR" };
