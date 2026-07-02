# AI-X — Enterprise AI Strategic Workspace

A single-entry AI strategic workspace for deep research, strategic analysis, and decision intelligence. Built as a conversational agent platform — not a chatbot.

## Demo

[![AI-X Demo](https://img.youtube.com/vi/PAkawelLo1Y/maxresdefault.jpg)](https://www.youtube.com/watch?v=PAkawelLo1Y)

> 📹 Click the image above to watch the full demo.

## Architecture

| Layer | Stack |
|-------|-------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| AI Providers | OpenAI, Anthropic, Google Gemini, DeepSeek, Ollama |
| Search | Tavily, Serper, Bocha (aggregated) |
| Database | Supabase (PostgreSQL) |

## Project Structure

```
AI-X/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (chat, conversations, files, providers, search)
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── chat/               # Chat UI: messages, thinking blocks, clarification cards
│   ├── input/              # Input console: textarea, file upload, mode selector
│   ├── layout/             # Top bar
│   └── sidebar/            # Conversation list, search, new chat
├── lib/
│   ├── agent/              # Agent system: clarification, research mode, system prompt
│   ├── ai/                 # Multi-provider AI router (OpenAI, Anthropic, Google, etc.)
│   ├── api/                # Client-side API helpers
│   ├── hooks/              # React hooks (useChat, useConversations, useAgentStatus)
│   ├── mock/               # Mock data for development
│   ├── search/             # Search aggregator (Tavily, Serper, Bocha)
│   ├── store/              # Zustand state management
│   ├── supabase/           # Database client and schema
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Utilities (cn, date formatting, clarification parsing)
└── config files            # next.config, tailwind, tsconfig, postcss, eslint
```

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Features

- **Recursive Requirement Clarification** — Agent asks structured follow-ups before analysis
- **Multi-Provider AI Router** — Route to OpenAI, Anthropic, Gemini, DeepSeek, or local Ollama
- **Aggregated Web Search** — Parallel search across multiple engines with cross-validation
- **Deep Research Mode** — Long-form multi-step investigation with source synthesis
- **Strategic Analysis Mode** — Porter's Five Forces, moat analysis, second-order effects
- **Conversation Management** — Persistent chat history with Supabase
- **File Upload** — PDF, DOCX, XLSX, CSV, PPT, Markdown analysis

## Environment Variables

See [.env.example](.env.example) for the full list. Required keys:

- At least one AI provider key (OpenAI / Anthropic / Google / DeepSeek / Ollama)
- At least one search engine key (Tavily / Serper / Bocha)
- Supabase URL + keys for persistence (optional — app works with in-memory fallback)

## License

MIT
