"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { InputConsole } from "@/components/input/InputConsole";

export default function Home() {
  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[hsl(0,0%,3.9%)]">
          <ChatContainer />
          <InputConsole />
        </main>
      </div>
    </div>
  );
}
