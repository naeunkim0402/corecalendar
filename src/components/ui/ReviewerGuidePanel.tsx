"use client";

import { useRouter } from "next/navigation";
import { useMeetings } from "@/lib/store";

const TIMETABLE_PERSON_IDS = ["a", "b", "c", "d", "e", "f"];

function clearTimetableData() {
  TIMETABLE_PERSON_IDS.forEach((id) => localStorage.removeItem(`timetable_${id}`));
  localStorage.removeItem("internal_schedules");
}

export function ReviewerGuidePanel() {
  const router = useRouter();
  const { clearAll } = useMeetings();

  const resetAndGoHome = (clearWelcome: boolean, clearSync: boolean) => {
    clearAll();
    clearTimetableData();
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
            <img src="/toss-symbol.png" alt="Toss" width={20} height={20} className="shrink-0" />
            토스 담당자 데모 가이드
          </h4>
          <p className="text-[14px] text-white/70 leading-[1.7]">
            Corecalendar로 한번에 조율되는<br />최적의 회의시간 찾기!
          </p>
          <p className="text-[12px] text-white/50 leading-[1.7] mt-1">
            자세한 설명이 궁금하시다면 직무 인터뷰에서 만나요!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => resetAndGoHome(true, true)}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-[#0064FF] text-white text-[12px] font-bold flex items-center justify-center shrink-0">▶</span>
              <span className="text-[15px] font-bold text-white group-hover:text-white/70 transition-colors duration-150">웰컴 모달부터 시작하기</span>
            </div>
            <p className="text-[12px] text-white/60 ml-9 leading-[1.6]">
              데이터 리셋 → 웰컴 → 온보딩 → 대시보드
            </p>
          </button>

          <button
            onClick={() => resetAndGoHome(false, true)}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">▶</span>
              <span className="text-[15px] font-bold text-white group-hover:text-white/70 transition-colors duration-150">온보딩 모달부터 시작하기</span>
            </div>
            <p className="text-[12px] text-white/60 ml-9 leading-[1.6]">
              데이터 리셋 → 온보딩 → 대시보드
            </p>
          </button>

          <button
            onClick={() => router.push("/create")}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-[15px] font-bold text-white group-hover:text-white/70 transition-colors duration-150">6명 회의 바로 생성해보기</span>
            </div>
            <p className="text-[12px] text-white/60 ml-9 leading-[1.6]">
              회의 생성 → 참석자 선택 → 실시간 추천
            </p>
          </button>

          <button
            onClick={() => { clearAll(); clearTimetableData(); }}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-error/10 border border-white/[0.08] hover:border-error/20 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-error text-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-[15px] font-bold text-white group-hover:text-error transition-colors duration-150">데모 데이터 초기화 하기</span>
            </div>
            <p className="text-[12px] text-white/60 ml-9 leading-[1.6]">
              확정 회의 전체 삭제 · 초기 상태로 복원
            </p>
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.06]">
        <p className="text-[12px] text-white/50 leading-relaxed text-center">
          Corecalendar 프로토타입 · 검토용
        </p>
      </div>
    </aside>
  );
}
