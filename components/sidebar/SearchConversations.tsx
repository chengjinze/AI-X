"use client";

import { Search } from "lucide-react";

export function SearchConversations() {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(0,0%,40%)]"
      />
      <input
        type="text"
        placeholder="Search conversations..."
        className="w-full bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,15%)] rounded-md pl-8 pr-3 py-1.5 text-xs text-[hsl(0,0%,70%)] placeholder:text-[hsl(0,0%,35%)] focus:outline-none focus:border-[hsl(0,0%,25%)] transition-colors"
      />
    </div>
  );
}
