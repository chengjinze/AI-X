import type { Metadata } from "next";
import "./globals.css";
import { ChatProvider } from "@/lib/store/chat-store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI-X — Strategic Workspace",
  description: "Enterprise-grade AI for strategic consulting, decision analysis, and deep research.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-full antialiased">
        <ErrorBoundary>
          <ChatProvider>{children}</ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
