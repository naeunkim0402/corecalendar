"use client";

import { type ReactNode } from "react";

interface TopBarProps {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
}

export function TopBar({ title, left, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[56px] px-5 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center min-w-[40px]">{left}</div>
      {title && (
        <h1 className="text-[17px] font-bold text-gray-900">{title}</h1>
      )}
      <div className="flex items-center min-w-[40px] justify-end">{right}</div>
    </header>
  );
}
