"use client";

import { type ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGeolocation } from "@/lib/useGeolocation";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function NavItem({ icon, label, href, active, badge }: NavItemProps & { badge?: number }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 w-full px-4 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors duration-100
        ${active ? "bg-mist text-ink font-semibold" : "text-slate hover:bg-mist active:bg-silver"}
      `}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[12px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  activeNav?: string;
}

export function Sidebar({ activeNav }: SidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const geo = useGeolocation();

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem("meetings");
        const meetings = raw ? JSON.parse(raw) : [];
        const count = meetings.filter((m: { status?: string }) => m.status === "pending").length;
        setPendingCount(count);
      } catch { setPendingCount(0); }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: "dashboard",
      href: "/",
      label: "대시보드",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      id: "timetable",
      href: "/timetable",
      label: "주간 캘린더",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "create",
      href: "/create",
      label: "회의 생성",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "notifications",
      href: "/notifications",
      label: "요청 회의건",
      badge: pendingCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3a5 5 0 0 0-5 5v3l-1.5 2h13L15 11V8a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 16a2 2 0 1 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const currentNav = activeNav || navItems.find((item) => item.href === pathname)?.id || "dashboard";

  return (
    <aside className="h-screen overflow-y-auto bg-white shadow-card flex flex-col px-3 py-6">
      <div className="px-4 mb-8">
        <Link href="/" className="block">
          <h1 className="text-[20px] font-black text-graphite tracking-tight">Corecalendar</h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={currentNav === item.id}
            badge={"badge" in item ? (item as { badge: number }).badge : undefined}
          />
        ))}
      </nav>

      {/* 위치 정보 */}
      <div className="px-4 py-3 border-t border-mist">
        <div className="flex items-center gap-2 text-[11px] text-slate">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-slate/60">
            <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <circle cx="6" cy="4.5" r="1" fill="currentColor"/>
          </svg>
          <span className="truncate">
            {geo.city}{geo.country !== "KR" ? `, ${geo.country}` : ""} · {geo.timezone.split("/")[1]?.replace(/_/g, " ") ?? geo.timezone}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate/50 mt-0.5 pl-[18px]">
          <span>{geo.latitude}° N, {geo.longitude}° E</span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-mist">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-[12px] font-bold">
            나
          </div>
          <div>
            <span className="text-[13px] font-semibold text-graphite block">김나은</span>
            <span className="text-[12px] text-slate">디자이너</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
