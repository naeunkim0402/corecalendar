"use client";

// [설계 의도]: 장식적인 dot UI와 서술형 문구를 걷어내어 정보 밀도를 극대화하고,
// 드롭다운 아이콘 및 캘린더 피커의 인터랙션을 일관되게 정제하여 정품 B2B SaaS의 시각적 완성도를 부여한다.

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/ui";
import { PEOPLE } from "@/lib/data";
import { useMeetings } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DAY_LABELS_FULL = ["일", "월", "화", "수", "목", "금", "토"];

function getTodayInfo() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: now.getDate(),
    dayLabel: DAY_LABELS_FULL[now.getDay()],
  };
}

// ── 삭제 확인 모달 ──
function DeleteConfirmModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-[16px] pt-7 px-7 pb-6 shadow-modal w-[400px] max-w-[90vw]">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-[17px] font-bold text-graphite">회의 일정을 삭제할까요?</h3>
          <button onClick={onClose} className="text-stone hover:text-graphite transition-colors duration-150 p-1 rounded-full hover:bg-mist">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-[14px] text-slate mb-8 leading-relaxed">
          삭제된 회의는 복원할 수 없으며, 참석자의 시간표에서도 해당 슬롯이 해제됩니다.
        </p>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="w-full h-12 bg-error text-white text-[14px] font-bold rounded-[8px] active:bg-[#d93a47] transition-colors duration-150"
        >
          네, 삭제할게요
        </button>
      </div>
    </div>
  );
}

function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setDone(true);
      localStorage.setItem("calendar_synced", "true");
      setTimeout(() => onComplete(), 1200);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-[16px] pt-8 px-8 pb-6 shadow-modal w-[440px] max-w-[90vw] relative">
        <button
          onClick={onComplete}
          className="absolute top-5 right-5 text-stone hover:text-graphite transition-colors duration-150 p-1 rounded-full hover:bg-mist"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-[18px] font-bold text-graphite text-center leading-snug mb-2">
          반가워요!
        </h2>
        <p className="text-[14px] text-graphite font-semibold text-center leading-[1.7] mb-1">
          이제 코어캘린더에서 업무 및 회의 일정을 한번에 관리하세요!
        </p>
        <p className="text-[13px] text-stone text-center leading-[1.7] mb-7">
          기존에 쓰던 캘린더 한번만 연동하면 코어캘린더에 다 옮겨줘요
        </p>

        {done ? (
          <div className="flex items-center justify-center gap-2 h-12 bg-success/8 rounded-[8px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="#03b26c" fillOpacity="0.15" />
              <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#03b26c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] font-semibold text-success">연동 완료!</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full h-12 bg-ink text-white text-[14px] font-bold rounded-[8px] active:bg-black transition-colors duration-150 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  연동 중...
                </>
              ) : (
                "외부 캘린더 연동하기"
              )}
            </button>
            <button
              onClick={onComplete}
              className="w-full mt-3 text-[13px] text-stone hover:text-slate transition-colors duration-150 py-1"
            >
              나중에 하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { meetings, deleteMeeting, clearAll, loaded } = useMeetings();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // meeting id or "all"
  const today = getTodayInfo();

  useEffect(() => {
    const welcomed = sessionStorage.getItem("welcome_shown");
    if (!welcomed) {
      setShowWelcome(true);
    } else {
      const synced = localStorage.getItem("calendar_synced");
      if (!synced) setShowSyncModal(true);
    }
  }, []);

  const todayMeetings = meetings.filter((m) => m.status === "approved" || m.status === "pending");

  // ── 오늘 스케줄 (데모 기준 day 0 = 월요일 고정) ──
  const TODAY_DAY = 0;
  const [personalSchedules, setPersonalSchedules] = useState<Array<{ startHour: number; endHour: number; title: string; tag: string }>>([]);
  useEffect(() => {
    type Raw = { groupId?: string; day: number; hour: number; personId: string; title: string; tag: string };
    const raw: Raw[] = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
    const mine = raw.filter(s => s.personId === "f" && s.day === TODAY_DAY);
    const gMap: Record<string, Raw[]> = {};
    mine.forEach(s => { const k = s.groupId || `l-${s.hour}`; (gMap[k] ||= []).push(s); });
    const items = Object.values(gMap).map(records => {
      const sorted = [...records].sort((a, b) => a.hour - b.hour);
      return { startHour: sorted[0].hour, endHour: sorted[sorted.length - 1].hour + 1, title: sorted[0].title, tag: sorted[0].tag };
    });
    setPersonalSchedules(items.sort((a, b) => a.startHour - b.startHour));
  }, []);

  const todayTimeline = useMemo(() => {
    const meetingItems = meetings
      .filter(m => m.day === TODAY_DAY && m.status !== "rejected")
      .map(m => ({ startHour: m.hour, endHour: m.hour + 1, title: m.title, tag: undefined as string | undefined, type: "meeting" as const }));
    const scheduleItems = personalSchedules.map(s => ({ ...s, type: "schedule" as const }));
    return [...meetingItems, ...scheduleItems].sort((a, b) => a.startHour - b.startHour);
  }, [meetings, personalSchedules]);

  const handleDeleteConfirm = () => {
    if (deleteTarget === "all") {
      clearAll();
    } else if (deleteTarget) {
      deleteMeeting(deleteTarget);
    }
    setDeleteTarget(null);
  };

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <h2 className="text-[18px] font-bold text-graphite">대시보드</h2>
            <div className="flex items-center gap-2">
              <Link
                href="/timetable?add=1"
                className="inline-flex items-center h-9 px-4 bg-mist text-graphite text-[13px] font-bold rounded-[8px] hover:bg-silver transition-colors duration-150"
              >
                + 일정 등록
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center h-9 px-4 bg-ink text-white text-[13px] font-bold rounded-[8px] active:bg-black transition-colors duration-150"
              >
                + 회의 생성
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-10 py-10">
          {/* 오늘 일정 — 2열 */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h3 className="text-[17px] font-bold text-graphite">오늘 일정</h3>
                <p className="text-[13px] text-stone mt-0.5">{today.year}년 {today.month}월 {today.date}일 {today.dayLabel}요일</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* 왼쪽: 회의 블록 */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h4 className="text-[13px] font-bold text-slate">회의</h4>
                  {todayMeetings.length > 0 && (
                    <span className="text-[12px] text-stone tabular-nums">{todayMeetings.length}건</span>
                  )}
                </div>
                {todayMeetings.length > 0 ? (
                  <div className="bg-white rounded-[16px] shadow-card divide-y divide-mist">
                    {todayMeetings.map((m) => {
                      const statusStyle = m.status === "pending"
                        ? "bg-warning/15 text-warning"
                        : "bg-success/15 text-success";
                      const statusLabel = m.status === "pending" ? "대기" : "확정";
                      return (
                        <div key={m.id} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-[14px] font-semibold text-graphite truncate">{m.title}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${statusStyle}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-slate tabular-nums">
                              {m.hour.toString().padStart(2, "0")}:00 – {(m.hour + 1).toString().padStart(2, "0")}:00
                            </span>
                            <div className="flex -space-x-1.5">
                              {m.attendees.slice(0, 4).map((a) => {
                                const person = PEOPLE.find((p) => p.id === a.id);
                                return (
                                  <div
                                    key={a.id}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white"
                                    style={{ backgroundColor: person?.color || "#999" }}
                                    title={a.name}
                                  >
                                    {person?.avatar}
                                  </div>
                                );
                              })}
                              {m.attendees.length > 4 && (
                                <div className="w-6 h-6 rounded-full bg-mist flex items-center justify-center text-[11px] font-semibold text-slate ring-2 ring-white">
                                  +{m.attendees.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-[16px] shadow-card flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 rounded-[10px] bg-mist flex items-center justify-center mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="3" stroke="#d1d6db" strokeWidth="1.6" />
                        <path d="M3 10h18M8 2v4M16 2v4" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-bold text-stone">오늘 회의 없어요</p>
                  </div>
                )}
              </div>

              {/* 오른쪽: 스케줄 블록 */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h4 className="text-[13px] font-bold text-slate">스케줄</h4>
                </div>
                {todayTimeline.length > 0 ? (
                  <div className="bg-white rounded-[16px] shadow-card divide-y divide-mist">
                    {todayTimeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-4">
                        <span className="text-[12px] font-semibold text-slate tabular-nums w-[100px] shrink-0">
                          {String(item.startHour).padStart(2, "0")}:00 – {String(item.endHour).padStart(2, "0")}:00
                        </span>
                        <span className="flex-1 text-[14px] font-semibold text-graphite truncate">{item.title}</span>
                        {item.type === "meeting" ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-[11px] font-bold shrink-0">회의</span>
                        ) : item.tag ? (
                          <span className="px-2.5 py-1 rounded-full bg-mist text-slate text-[11px] font-bold shrink-0">{item.tag}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[16px] shadow-card flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 rounded-[10px] bg-mist flex items-center justify-center mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="3" stroke="#d1d6db" strokeWidth="1.6" />
                        <path d="M3 10h18M8 2v4M16 2v4" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-bold text-stone">오늘은 비어 있어요</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 예정 회의 */}
          {loaded && (
            <section className="mb-14">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-[17px] font-bold text-graphite">예정 회의</h3>
                {meetings.filter((m) => m.status !== "rejected").length > 0 && (
                  <button onClick={() => setDeleteTarget("all")} className="text-[13px] text-stone hover:text-error transition-colors duration-150 px-3 py-1.5 rounded-[8px] hover:bg-error/5">
                    전체 삭제
                  </button>
                )}
              </div>

              {meetings.filter((m) => m.status !== "rejected").length > 0 ? (
                <>
                {/* 테이블 헤더 */}
                <div className="bg-white rounded-t-[16px] shadow-card px-7 py-3.5 flex items-center gap-5">
                  <span className="w-[140px] text-[12px] font-bold text-stone">날짜/시간</span>
                  <span className="flex-1 text-[12px] font-bold text-stone">회의명</span>
                  <span className="w-16 text-[12px] font-bold text-stone text-center">상태</span>
                  <span className="w-[100px] text-[12px] font-bold text-stone text-right">참석자</span>
                  <span className="w-8" />
                </div>

                {/* 테이블 행 */}
                <div className="bg-white rounded-b-[16px] shadow-card -mt-px divide-y divide-mist">
                  {meetings.filter((m) => m.status !== "rejected").map((m) => {
                  const status = m.status || "approved";
                  const statusStyle = status === "pending"
                    ? "bg-warning/15 text-warning"
                    : status === "approved"
                    ? "bg-success/15 text-success"
                    : "bg-error/15 text-error";
                  const statusLabel = status === "pending" ? "대기" : status === "approved" ? "확정" : "거절";

                  return (
                    <div
                      key={m.id}
                      className={`px-7 py-5 flex items-center gap-5 transition-colors duration-150 ${
                        status === "rejected" ? "opacity-50" : ""
                      }`}
                    >
                      <div className="w-[140px] shrink-0">
                        <span className="text-[14px] font-semibold text-graphite tabular-nums block">{today.month}/{today.date} {today.dayLabel}요일</span>
                        <span className="text-[12px] text-slate tabular-nums">{m.hour.toString().padStart(2, "0")}:00 – {(m.hour + 1).toString().padStart(2, "0")}:00</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-graphite truncate">{m.title}</p>
                        <p className="text-[12px] text-slate mt-0.5 tabular-nums">
                          {m.attendees.length}명 참석
                        </p>
                      </div>

                      <div className="w-16 flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="w-[100px] flex justify-end">
                        <div className="flex -space-x-1.5">
                          {m.attendees.slice(0, 4).map((a) => {
                            const person = PEOPLE.find((p) => p.id === a.id);
                            return (
                              <div
                                key={a.id}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white ring-2 ring-white"
                                style={{ backgroundColor: person?.color || "#999" }}
                                title={a.name}
                              >
                                {person?.avatar}
                              </div>
                            );
                          })}
                          {m.attendees.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-mist flex items-center justify-center text-[12px] font-semibold text-slate ring-2 ring-white">
                              +{m.attendees.length - 4}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteTarget(m.id)}
                        className="w-8 text-stone hover:text-error transition-colors duration-150 p-1.5 rounded-full hover:bg-error/5 flex items-center justify-center"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  );
                  })}
                </div>
                </>
              ) : (
                <div className="bg-white rounded-[16px] shadow-card flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-[12px] bg-mist flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="3" stroke="#d1d6db" strokeWidth="1.6" />
                      <path d="M3 10h18M8 2v4M16 2v4" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-bold text-stone">예정된 회의가 없어요</p>
                </div>
              )}
            </section>
          )}

        </div>
      </main>

      {showWelcome && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-[16px] pt-8 px-8 pb-6 shadow-modal w-[420px] max-w-[90vw] text-center">
            <h2 className="text-[18px] font-bold text-graphite leading-snug mb-2">토스 프로덕트 디자이너 챌린지 2026</h2>
            <p className="text-[14px] text-slate mb-1">PC 전체화면으로 확인해주세요!</p>
            <p className="text-[13px] text-stone mb-7">제출자 : 김나은</p>
            <button
              onClick={() => {
                setShowWelcome(false);
                sessionStorage.setItem("welcome_shown", "true");
                const synced = localStorage.getItem("calendar_synced");
                if (!synced) setShowSyncModal(true);
              }}
              className="w-full h-12 bg-ink text-white text-[14px] font-bold rounded-[8px] active:bg-black transition-colors duration-150"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showSyncModal && (
        <OnboardingModal
          onComplete={() => {
            setShowSyncModal(false);
            localStorage.setItem("calendar_synced", "true");
            router.push("/timetable");
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
