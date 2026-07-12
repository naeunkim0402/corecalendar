"use client";

import { Sidebar } from "./Sidebar";
import { ReviewerGuidePanel } from "./ReviewerGuidePanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-paper">
      <Sidebar />
      {children}
      <ReviewerGuidePanel />
    </div>
  );
}
