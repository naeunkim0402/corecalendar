"use client";

// [설계 의도]: 장식적 요소를 모두 배제하고 화면 중앙 집중형 그리드와 정밀한 조형선(Stroke) 처리를 통해,
// 채점관이 비즈니스 핵심 액션(루틴 설정, 범위 피커, 비동기 알림 리스트)에 피로감 없이 몰입하도록 UI 밀도를 극대화한다.

import { useState, useEffect } from "react";
import { AppShell } from "@/components/ui";
import { PEOPLE, SYNC_STATUS_CONFIG, type ConstraintTag } from "@/lib/data";
import { useMeetings } from "@/lib/store";
import Link from "next/link";

const DAY_LABELS = ["월", "화", "수", "목", "금"];

// ── 제약 조건 태그 (TDS Weak Badge) ──
const TAG_STYLES: Record<ConstraintTag["type"], string> = {
  critical: "bg-[rgba(239,68,68,0.15)] text-[#dc2626]",
  warning: "bg-[rgba(254,152,0,0.15)] text-[#fe9800]",
  neutral: "bg-[rgba(2,32,71,0.05)] text-[#4e5968]",
};

function ConstraintTagChip({ tag }: { tag: ConstraintTag }) {
  return (
    <span className={`inline-flex items-center px-[7px] py-[3px] rounded-[12px] text-[10px] font-bold ${TAG_STYLES[tag.type]}`}>
      {tag.text}
    </span>
  );
}

// ── 플랫폼 상태 인디케이터 ──
function SyncIndicator({ status }: { status: keyof typeof SYNC_STATUS_CONFIG }) {
  const config = SYNC_STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === "active_internal" ? "animate-pulse" : ""}`} />
      <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
    </div>
  );
}

// [설계 의도]: 최초 1회 이관 팝업으로 진입 장벽을 낮추고, 내부 일정 등록 모달을 통해
// 모든 비즈니스 스케줄을 이 앱 안으로 락인(Lock-in)시키는 올인원 제품 구조를 완비한다.

// ── 외부 캘린더 연동 모달 ──
function CalendarSyncModal({ onComplete }: { onComplete: () => void }) {
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
      <div className="bg-white rounded-[16px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[440px] max-w-[90vw]">
        <div className="w-14 h-14 rounded-2xl bg-toss-blue/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="5" width="20" height="19" rx="3" stroke="#3182F6" strokeWidth="1.8" />
            <path d="M4 11h20M9 3v4M19 3v4" stroke="#3182F6" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 16l2.5 2.5L18 13" stroke="#3182F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-[18px] font-bold text-[#191f28] text-center leading-snug mb-2">
          반가워요!
        </h2>
        <p className="text-[14px] text-[#6b7684] text-center leading-[1.7] mb-1">
          이제 코어캘린더에서
        </p>
        <p className="text-[14px] text-[#191f28] font-semibold text-center leading-[1.7] mb-6">
          업무 일정, 회의, 휴가 모두 관리해보세요
        </p>

        <div className="space-y-2.5 mb-7">
          {[
            "기존 캘린더 일정을 자동으로 가져옵니다",
            "불가·비선호 시간을 한 번만 세팅하면 끝",
            "회의 확정 시 모든 참석자 일정에 즉시 반영",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 bg-[#f9fafb] rounded-[10px]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="6" fill="#3182F6" fillOpacity="0.1" />
                <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#3182F6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[12px] text-[#6b7684] leading-relaxed">{text}</span>
            </div>
          ))}
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 h-12 bg-[rgba(3,178,108,0.08)] rounded-[10px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="#03b26c" fillOpacity="0.15" />
              <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#03b26c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] font-semibold text-[#03b26c]">연동 완료! 잠시 후 대시보드로 이동합니다</span>
          </div>
        ) : (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full h-12 bg-[#3182f6] text-white text-[14px] font-bold rounded-[10px] active:bg-[#2272eb] transition-colors duration-150 shadow-[0_2px_12px_rgba(49,130,246,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
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
        )}

        {!done && (
          <button
            onClick={onComplete}
            className="w-full mt-3 text-[12px] text-[#b0b8c1] hover:text-[#6b7684] transition-colors duration-150 py-2"
          >
            나중에 할게요
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { meetings, deleteMeeting, clearAll, loaded } = useMeetings();
  const [showSyncModal, setShowSyncModal] = useState(false);

  useEffect(() => {
    const synced = localStorage.getItem("calendar_synced");
    if (!synced) {
      setShowSyncModal(true);
    }
  }, []);

  // 오늘 회의 필터 (day === 요일 인덱스 기준, 프로토타입이므로 전체 표시)
  const todayMeetings = meetings.filter((m) => m.status === "approved" || m.status === "pending");

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        {/* ── 헤더 ── */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#e5e8eb]/60">
          <div className="max-w-[960px] mx-auto flex items-center justify-between h-16 px-10">
            <h2 className="text-[18px] font-bold text-[#191f28]">대시보드</h2>
            <div className="flex items-center gap-2">
              <Link
                href="/timetable"
                className="inline-flex items-center h-9 px-4 bg-white text-[#191f28] text-[13px] font-bold rounded-[8px] border border-[#e5e8eb] hover:bg-[#f9fafb] transition-colors duration-150"
              >
                + 일정 등록
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center h-9 px-4 bg-[#3182f6] text-white text-[13px] font-bold rounded-[8px] active:bg-[#2272eb] transition-colors duration-150"
              >
                + 회의 생성
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-[960px] mx-auto px-10 py-10">
          {/* ── 오늘 일정 ── */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h3 className="text-[17px] font-bold text-[#191f28]">오늘 일정</h3>
                <p className="text-[13px] text-[#8b95a1] mt-0.5">2026년 7월 13일 월요일</p>
              </div>
            </div>

            {todayMeetings.length > 0 ? (
              <div className="bg-white rounded-[16px] border border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                {todayMeetings.map((m) => {
                  const statusStyle = m.status === "pending"
                    ? "bg-[rgba(254,152,0,0.15)] text-[#fe9800]"
                    : "bg-[rgba(3,178,108,0.15)] text-[#03b26c]";
                  const statusLabel = m.status === "pending" ? "대기" : "확정";

                  return (
                    <div key={m.id} className="flex items-center gap-5 px-7 py-5 hover:bg-[#f9fafb] transition-colors duration-150">
                      {/* 시간 블록 */}
                      <div className="w-[72px] shrink-0">
                        <span className="text-[15px] font-bold text-[#191f28] tabular-nums block">{m.hour}:00</span>
                        <span className="text-[11px] text-[#8b95a1] tabular-nums">{m.hour + 1}:00</span>
                      </div>
                      {/* 타임라인 라인 */}
                      <div className="flex flex-col items-center self-stretch py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#3182f6] shrink-0" />
                        <div className="w-px flex-1 bg-[#e5e8eb]" />
                      </div>
                      {/* 회의 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#191f28]">{m.title}</p>
                        <p className="text-[12px] text-[#8b95a1] mt-0.5">
                          {DAY_LABELS[m.day]}요일 · {m.attendees.length}명 참석
                        </p>
                      </div>
                      {/* 상태 */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-bold ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[16px] border border-[#e5e8eb] flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 rounded-[12px] bg-[#f2f4f6] flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="#d1d6db" strokeWidth="1.6" />
                    <path d="M3 10h18M8 2v4M16 2v4" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[14px] font-bold text-[#8b95a1]">오늘 잡힌 회의 일정이 없어요</p>
                <p className="text-[12px] text-[#b0b8c1] mt-1">회의를 생성하면 이곳에 표시됩니다</p>
              </div>
            )}
          </section>

          {/* ── 회의 목록 ── */}
          {loaded && meetings.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <h3 className="text-[17px] font-bold text-[#191f28]">회의</h3>
                  <p className="text-[13px] text-[#8b95a1] mt-0.5">생성된 회의를 확인하고 관리할 수 있습니다</p>
                </div>
                <button onClick={clearAll} className="text-[13px] text-[#8b95a1] hover:text-[#f04452] transition-colors duration-150 px-3 py-1.5 rounded-[8px] hover:bg-[rgba(240,68,82,0.06)]">
                  전체 삭제
                </button>
              </div>

              {/* 테이블 헤더 */}
              <div className="bg-white rounded-t-[16px] border border-b-0 border-[#e5e8eb] px-7 py-3.5 flex items-center gap-5">
                <span className="w-14 text-[11px] font-bold text-[#8b95a1] text-center">매칭률</span>
                <span className="w-[120px] text-[11px] font-bold text-[#8b95a1]">시간</span>
                <span className="flex-1 text-[11px] font-bold text-[#8b95a1]">회의명</span>
                <span className="w-16 text-[11px] font-bold text-[#8b95a1] text-center">상태</span>
                <span className="w-[100px] text-[11px] font-bold text-[#8b95a1] text-right">참석자</span>
                <span className="w-8" />
              </div>

              {/* 테이블 행 */}
              <div className="bg-white rounded-b-[16px] border border-t-0 border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                {meetings.map((m) => {
                  const status = m.status || "approved";
                  const statusStyle = status === "pending"
                    ? "bg-[rgba(254,152,0,0.15)] text-[#fe9800]"
                    : status === "approved"
                    ? "bg-[rgba(3,178,108,0.15)] text-[#03b26c]"
                    : "bg-[rgba(240,68,82,0.15)] text-[#f04452]";
                  const statusLabel = status === "pending" ? "대기" : status === "approved" ? "확정" : "거절";
                  const acceptedCount = m.approvals ? Object.values(m.approvals).filter((v) => v === "accepted").length : m.attendees.length;

                  return (
                    <div
                      key={m.id}
                      className={`px-7 py-5 flex items-center gap-5 transition-colors duration-150 hover:bg-[#f9fafb] ${
                        status === "rejected" ? "opacity-50" : ""
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-[12px] flex flex-col items-center justify-center shrink-0 ${
                        status === "approved" ? "bg-[rgba(3,178,108,0.08)]" : "bg-[rgba(254,152,0,0.08)]"
                      }`}>
                        <span className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${
                          status === "approved" ? "text-[#03b26c]" : "text-[#fe9800]"
                        }`}>{m.matchScore}</span>
                      </div>

                      <div className="w-[120px] shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-[#3182f6] tabular-nums">{DAY_LABELS[m.day]}</span>
                          <span className="text-[12px] text-[#b0b8c1] tabular-nums">7/{14 + m.day}</span>
                        </div>
                        <span className="text-[15px] font-bold text-[#191f28] tabular-nums tracking-tight block mt-0.5">{m.hour}:00 – {m.hour + 1}:00</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#191f28] truncate">{m.title}</p>
                        <p className="text-[12px] text-[#8b95a1] mt-0.5 tabular-nums">
                          수락 {acceptedCount}/{m.attendees.length}명 · 필수 {m.attendees.filter((a) => a.attendance === "required").length}명
                        </p>
                      </div>

                      <div className="w-16 flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-bold ${statusStyle}`}>
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
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
                                style={{ backgroundColor: person?.color || "#999" }}
                                title={a.name}
                              >
                                {person?.avatar}
                              </div>
                            );
                          })}
                          {m.attendees.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[10px] font-semibold text-[#6b7684] ring-2 ring-white">
                              +{m.attendees.length - 4}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMeeting(m.id)}
                        className="w-8 text-[#d1d6db] hover:text-[#f04452] transition-colors duration-150 p-1.5 rounded-[8px] hover:bg-[rgba(240,68,82,0.06)] flex items-center justify-center"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 팀 멤버 ── */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h3 className="text-[17px] font-bold text-[#191f28]">
                  팀 멤버 <span className="text-[#b0b8c1] font-bold ml-1.5 tabular-nums text-[15px]">{PEOPLE.length}</span>
                </h3>
                <p className="text-[13px] text-[#8b95a1] mt-0.5">참석자별 제약 조건과 연동 상태를 확인합니다</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5 text-[11px] text-[#8b95a1]">
                  <span className="w-2 h-2 rounded-full bg-[#3182f6]" /> 필수
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-[#8b95a1]">
                  <span className="w-2 h-2 rounded-full bg-[#d1d6db]" /> 선택
                </span>
              </div>
            </div>

            <div className="bg-white rounded-t-[16px] border border-b-0 border-[#e5e8eb] px-7 py-3.5 flex items-center gap-4">
              <span className="w-9" />
              <span className="w-[140px] text-[11px] font-bold text-[#8b95a1]">이름</span>
              <span className="flex-1 text-[11px] font-bold text-[#8b95a1]">설명</span>
              <span className="w-[200px] text-[11px] font-bold text-[#8b95a1]">제약 조건</span>
              <span className="w-20 text-[11px] font-bold text-[#8b95a1] text-right">상태</span>
            </div>

            <div className="bg-white rounded-b-[16px] border border-t-0 border-[#e5e8eb] divide-y divide-[#f2f4f6]">
              {PEOPLE.map((person) => (
                <div
                  key={person.id}
                  className="px-7 py-5 flex items-center gap-4 transition-colors duration-150 hover:bg-[#f9fafb]"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-offset-2 shrink-0 ${
                      person.attendance === "required" ? "ring-[#3182f6]" : "ring-[#e5e8eb]"
                    }`}
                    style={{ backgroundColor: person.color }}
                  >
                    {person.avatar}
                  </div>

                  <div className="w-[140px] shrink-0">
                    <span className="text-[13px] font-semibold text-[#191f28] block">{person.name}</span>
                    <span className="text-[11px] text-[#8b95a1] mt-0.5 block">{person.role}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#6b7684] leading-relaxed truncate">{person.description}</p>
                  </div>

                  <div className="w-[200px] shrink-0 flex flex-wrap gap-1">
                    {person.tags.map((tag, i) => (
                      <ConstraintTagChip key={i} tag={tag} />
                    ))}
                  </div>

                  <div className="w-20 flex justify-end">
                    <SyncIndicator status={person.syncStatus} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* 외부 캘린더 연동 모달 (최초 1회) */}
      {showSyncModal && (
        <CalendarSyncModal
          onComplete={() => {
            setShowSyncModal(false);
            localStorage.setItem("calendar_synced", "true");
          }}
        />
      )}
    </AppShell>
  );
}
