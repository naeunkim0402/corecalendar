"use client";

import { Sidebar } from "./Sidebar";
import { ReviewerGuidePanel } from "./ReviewerGuidePanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[240px_1fr_300px] h-screen overflow-hidden bg-paper">
      <Sidebar />
      {children}
      <ReviewerGuidePanel />
    </div>
  );
}
