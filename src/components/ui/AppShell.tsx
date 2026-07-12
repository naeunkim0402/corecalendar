"use client";

import { Sidebar } from "./Sidebar";
import { ReviewerGuidePanel } from "./ReviewerGuidePanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#f4f5f7]">
      <Sidebar />
      {children}
      <ReviewerGuidePanel />
    </div>
  );
}
