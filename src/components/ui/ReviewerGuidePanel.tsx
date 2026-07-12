"use client";

import { useRouter } from "next/navigation";
import { useMeetings } from "@/lib/store";

export function ReviewerGuidePanel() {
  const router = useRouter();
  const { clearAll } = useMeetings();

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 bg-graphite flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-7">
          <h4 className="text-[14px] font-bold text-white flex items-center gap-2 mb-3">
            <span className="text-[16px]">📋</span>
            담당자 데모 가이드
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
            onClick={() => router.push("/create")}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-ink text-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-[15px] font-bold text-white group-hover:text-silver transition-colors duration-150">6인 회의 바로 만들기</span>
            </div>
            <p className="text-[15px] text-white/40 ml-9 leading-[1.6]">
              회의 생성 → 참석자 선택 → 매칭률 기반 실시간 추천
            </p>
          </button>

          <div className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-warning text-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-[15px] font-bold text-white">플라이휠 효과 검증</span>
            </div>
            <p className="text-[15px] text-white/40 ml-9 leading-[1.6]">
              회의 확정 → 참석자 시간표 자동 불가 처리 → 다음 추천 시 해당 슬롯 자동 배제
            </p>
          </div>

          <button
            onClick={clearAll}
            className="w-full text-left px-4 py-4 rounded-2xl bg-white/[0.06] hover:bg-error/10 border border-white/[0.08] hover:border-error/20 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-[6px] bg-error text-white text-[12px] font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-[15px] font-bold text-white group-hover:text-error transition-colors duration-150">데이터 완전 리셋</span>
            </div>
            <p className="text-[15px] text-white/40 ml-9 leading-[1.6]">
              확정 회의 전체 삭제 · 초기 상태로 복원
            </p>
          </button>
        </div>

        <div className="mt-8 px-4 py-5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.1em] mb-4">핵심 루프</p>
          <div className="space-y-3">
            {[
              { step: "루틴 세팅", desc: "불가/비선호 시간 등록" },
              { step: "즉시 추천", desc: "매칭률 기반 Top 3 슬롯" },
              { step: "승인 요청", desc: "비동기 수락/거절 흐름" },
              { step: "플라이휠", desc: "확정 → 시간표 자동 갱신" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[12px] font-bold text-white/60 tabular-nums shrink-0">{i + 1}</div>
                  {i < 3 && <div className="w-px h-3 bg-white/10 mt-1" />}
                </div>
                <div className="pt-0.5">
                  <span className="text-[12px] font-semibold text-white/70 block">{item.step}</span>
                  <span className="text-[12px] text-white/30">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
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
