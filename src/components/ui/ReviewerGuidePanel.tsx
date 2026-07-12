"use client";

import { useRouter } from "next/navigation";
import { useMeetings } from "@/lib/store";

export function ReviewerGuidePanel() {
  const router = useRouter();
  const { clearAll } = useMeetings();

  const resetAndGoHome = (clearWelcome: boolean, clearSync: boolean) => {
    clearAll();
    if (clearWelcome) sessionStorage.removeItem("welcome_shown");
    if (clearSync) localStorage.removeItem("calendar_synced");
    router.push("/");
    router.refresh();
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <aside className="h-screen overflow-y-auto bg-graphite flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-7">
          <h4 className="text-[14px] font-bold text-white flex items-center gap-2 mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <rect x="2" y="2" width="16" height="16" rx="4" fill="#0064FF" />
              <path d="M6.5 10.5h3v3h-3zM10.5 6.5h3v3h-3z" fill="white" />
              <path d="M6.5 6.5h3v3h-3z" fill="white" fillOpacity="0.5" />
              <path d="M10.5 10.5h3v3h-3z" fill="white" fillOpacity="0.5" />
            </svg>
            토스 담당자 데모 가이드
          </h4>
          <p className="text-[14px] text-white/50 leading-[1.7]">
            Corecalendar로 한번에 조율되는 최적의 회의시간 찾기!
          </p>
          <p className="text-[12px] text-white/35 leading-[1.7] mt-1">
            더 고도화된 서비스가 궁금하시다면 직무 인터뷰에서 보여드릴게요!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => resetAndGoHome(true, true)}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-[#0064FF] text-white text-[12px] font-bold flex items-center justify-center shrink-0">▶</span>
              <span className="text-[15px] font-bold text-white group-hover:text-silver transition-colors duration-150">웰컴 모달부터 시작</span>
            </div>
            <p className="text-[12px] text-white/40 ml-9 leading-[1.6]">
              데이터 리셋 → 웰컴 → 온보딩 → 대시보드
            </p>
          </button>

          <button
            onClick={() => resetAndGoHome(false, true)}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">▶</span>
              <span className="text-[15px] font-bold text-white group-hover:text-silver transition-colors duration-150">온보딩 모달부터 시작</span>
            </div>
            <p className="text-[12px] text-white/40 ml-9 leading-[1.6]">
              데이터 리셋 → 온보딩 → 대시보드
            </p>
          </button>

          <button
            onClick={() => router.push("/create")}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-[15px] font-bold text-white group-hover:text-silver transition-colors duration-150">6인 회의 바로 만들기</span>
            </div>
            <p className="text-[12px] text-white/40 ml-9 leading-[1.6]">
              회의 생성 → 참석자 선택 → 실시간 추천
            </p>
          </button>

          <button
            onClick={clearAll}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-error/10 border border-white/[0.08] hover:border-error/20 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-error text-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-[15px] font-bold text-white group-hover:text-error transition-colors duration-150">데이터 완전 리셋</span>
            </div>
            <p className="text-[12px] text-white/40 ml-9 leading-[1.6]">
              확정 회의 전체 삭제 · 초기 상태로 복원
            </p>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.06]">
        <p className="text-[12px] text-white/25 leading-relaxed text-center">
          Corecalendar 프로토타입 · 검토용
        </p>
      </div>
    </aside>
  );
}
