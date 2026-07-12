"use client";

import { type ReactNode } from "react";

interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
}

export function ListItem({ title, subtitle, left, right, onClick }: ListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-5 py-3.5 text-left active:bg-gray-50 transition-colors duration-100"
    >
      {left && <div className="flex-shrink-0">{left}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </button>
  );
}
