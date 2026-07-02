"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMessage: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "hsl(0,0%,3.9%)", color: "hsl(0,0%,85%)", fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ maxWidth: 480, textAlign: "center", padding: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: "hsl(0,0%,50%)", wordBreak: "break-all" }}>
              {this.state.errorMessage || "Unknown error"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                marginTop: 16, padding: "8px 16px", borderRadius: 6,
                background: "hsl(0,0%,20%)", color: "hsl(0,0%,90%)", border: "none", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
