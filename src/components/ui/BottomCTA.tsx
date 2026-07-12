"use client";

import { type ReactNode } from "react";

interface BottomCTAProps {
  children: ReactNode;
}

export function BottomCTA({ children }: BottomCTAProps) {
  return (
    <div className="sticky bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white to-white/0">
      {children}
    </div>
  );
}
