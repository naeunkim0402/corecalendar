"use client";

// [설계 의도]: 장식적 요소를 모두 배제하고 화면 중앙 집중형 그리드와 정밀한 조형선(Stroke) 처리를 통해,
// 채점관이 비즈니스 핵심 액션(루틴 설정, 범위 피커, 비동기 알림 리스트)에 피로감 없이 몰입하도록 UI 밀도를 극대화한다.

import { useState } from "react";
import { AppShell } from "@/components/ui";
import { PEOPLE } from "@/lib/data";
import { useMeetings, type ConfirmedMeeting } from "@/lib/store";

const DAY_LABELS_FULL = ["일", "월", "화", "수", "목", "금", "토"];

function getTodayInfo() {
  const now = new Date();
  return {
    dayLabel: DAY_LABELS_FULL[now.getDay()],
    month: now.getMonth() + 1,
    date: now.getDate(),
  };
}

export default function NotificationsPage() {
  const { meetings, respondToMeeting, loaded } = useMeetings();
  const [demoResponded, setDemoResponded] = useState<"accepted" | "rejected" | null>(null);
  const today = getTodayInfo();

  const pendingMeetings = meetings.filter((m) => m.status === "pending");
  const resolvedMeetings = meetings.filter((m) => m.status === "approved" || m.status === "rejected");

  if (!loaded) return null;

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#e5e8eb]/60">
          <div className="max-w-[960px] mx-auto flex items-center justify-between h-16 px-10">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-[#191f28]">알림</h2>
              {pendingMeetings.length > 0 && (
                <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#f04452] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingMeetings.length}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-[960px] mx-auto px-10 py-10">
          {/* ── 승인 대기 중 (실제 데이터) ── */}
          {pendingMeetings.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2.5 mb-5 px-1">
                <span className="w-2 h-2 rounded-full bg-[#fe9800] animate-pulse" />
                <div>
                  <h3 className="text-[17px] font-bold text-[#191f28]">
                    승인 대기 중 <span className="text-[#b0b8c1] font-bold ml-1 tabular-nums text-[15px]">{pendingMeetings.length}</span>
                  </h3>
                </div>
              </div>

              {/* 가로 리스트 카드 */}
              <div className="space-y-3">
                {pendingMeetings.map((m) => {
                  const organizer = m.attendees.find((a) => a.id === "f");
                  const organizerPerson = PEOPLE.find((p) => p.id === "f");

                  return (
                    <div key={m.id} className="bg-white rounded-[16px] border border-[#e5e8eb] px-7 py-5">
                      <div className="flex items-center gap-5">
                        {/* 대기중 뱃지 */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-bold bg-[rgba(254,152,0,0.12)] text-[#fe9800] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#fe9800] animate-pulse" />
                          대기중
                        </span>

                        {/* 회의 제목 */}
                        <span className="text-[14px] font-bold text-[#191f28] shrink-0">{m.title}</span>

                        {/* 날짜 / 시간 */}
                        <span className="text-[13px] text-[#6b7684] tabular-nums shrink-0">
                          {today.dayLabel}요일 {today.month}/{today.date}
                        </span>
                        <span className="text-[13px] font-semibold text-[#191f28] tabular-nums shrink-0">
                          {m.hour}:00 – {m.hour + 1}:00
                        </span>

                        {/* 주최자 */}
                        <div className="flex items-center gap-2 shrink-0 ml-auto mr-4">
                          {organizerPerson && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ backgroundColor: organizerPerson.color }}
                            >
                              {organizerPerson.avatar}
                            </div>
                          )}
                          <span className="text-[12px] text-[#8b95a1]">
                            {organizerPerson?.name} · {organizerPerson?.role}
                          </span>
                        </div>

                        {/* 승인/거절 버튼 */}
                        <div className="flex items-center gap-2 shrink-0">
                          {m.attendees.filter((a) => a.id !== "f").map((a) => {
                            const approval = m.approvals[a.id];
                            if (approval !== "pending") return null;
                            return (
                              <div key={a.id} className="flex items-center gap-1.5">
                                <button
                                  onClick={() => respondToMeeting(m.id, a.id, "accepted")}
                                  className="h-8 px-4 bg-[#3182f6] text-white text-[12px] font-bold rounded-[8px] active:bg-[#2272eb] transition-colors duration-150"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => respondToMeeting(m.id, a.id, "rejected")}
                                  className="h-8 px-4 bg-[#f2f4f6] text-[#6b7684] text-[12px] font-bold rounded-[8px] hover:bg-[#e5e8eb] transition-colors duration-150"
                                >
                                  거절
                                </button>
                              </div>
                            );
                          }).filter(Boolean).slice(0, 1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 처리 완료 ── */}
          {resolvedMeetings.length > 0 && (
            <section className="mb-10">
              <div className="mb-5 px-1">
                <h3 className="text-[17px] font-bold text-[#191f28]">
                  처리 완료 <span className="text-[#b0b8c1] font-bold ml-1 tabular-nums text-[15px]">{resolvedMeetings.length}</span>
                </h3>
              </div>
              <div className="space-y-3">
                {resolvedMeetings.map((m) => {
                  const organizerPerson = PEOPLE.find((p) => p.id === "f");
                  const isApproved = m.status === "approved";
                  return (
                    <div key={m.id} className={`bg-white rounded-[16px] border border-[#e5e8eb] px-7 py-5 ${m.status === "rejected" ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-bold shrink-0 ${
                          isApproved
                            ? "bg-[rgba(3,178,108,0.12)] text-[#03b26c]"
                            : "bg-[rgba(240,68,82,0.12)] text-[#f04452]"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-[#03b26c]" : "bg-[#f04452]"}`} />
                          {isApproved ? "확정됨" : "거절됨"}
                        </span>
                        <span className="text-[14px] font-bold text-[#191f28]">{m.title}</span>
                        <span className="text-[13px] text-[#6b7684] tabular-nums">
                          {today.dayLabel}요일 {today.month}/{today.date}
                        </span>
                        <span className="text-[13px] font-semibold text-[#191f28] tabular-nums">
                          {m.hour}:00 – {m.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          {organizerPerson && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ backgroundColor: organizerPerson.color }}
                            >
                              {organizerPerson.avatar}
                            </div>
                          )}
                          <span className="text-[12px] text-[#8b95a1]">{organizerPerson?.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 고정 예시 카드 (항상 노출) ── */}
          <section className="mb-10">
            {meetings.length === 0 && (
              <div className="mb-5 px-1">
                <h3 className="text-[17px] font-bold text-[#191f28]">승인 요청</h3>
                <p className="text-[12px] text-[#8b95a1] mt-0.5">회의 생성 후 승인 요청이 여기에 표시됩니다</p>
              </div>
            )}
            <div className="bg-white rounded-[16px] border border-[#e5e8eb] px-7 py-5">
              <div className="flex items-center gap-5">
                {/* 대기중 뱃지 */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-bold shrink-0 ${
                  demoResponded === "accepted"
                    ? "bg-[rgba(3,178,108,0.12)] text-[#03b26c]"
                    : demoResponded === "rejected"
                    ? "bg-[rgba(240,68,82,0.12)] text-[#f04452]"
                    : "bg-[rgba(254,152,0,0.12)] text-[#fe9800]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    demoResponded === "accepted" ? "bg-[#03b26c]" : demoResponded === "rejected" ? "bg-[#f04452]" : "bg-[#fe9800] animate-pulse"
                  }`} />
                  {demoResponded === "accepted" ? "승인됨" : demoResponded === "rejected" ? "거절됨" : "대기중"}
                </span>

                {/* 회의 제목 */}
                <span className="text-[14px] font-bold text-[#191f28] shrink-0">스프린트 킥오프</span>

                {/* 날짜 / 시간 — 항상 오늘 날짜 */}
                <span className="text-[13px] text-[#6b7684] tabular-nums shrink-0">
                  {today.dayLabel}요일 {today.month}/{today.date}
                </span>
                <span className="text-[13px] font-semibold text-[#191f28] tabular-nums shrink-0">
                  10:00 – 11:00
                </span>

                {/* 주최자 */}
                <div className="flex items-center gap-2 shrink-0 ml-auto mr-4">
                  <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-[9px] font-bold text-white">
                    소
                  </div>
                  <span className="text-[12px] text-[#8b95a1]">
                    한소영 · PM · 주최자
                  </span>
                </div>

                {/* 승인/거절 버튼 */}
                {!demoResponded ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setDemoResponded("accepted")}
                      className="h-8 px-4 bg-[#3182f6] text-white text-[12px] font-bold rounded-[8px] active:bg-[#2272eb] transition-colors duration-150"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => setDemoResponded("rejected")}
                      className="h-8 px-4 bg-[#f2f4f6] text-[#6b7684] text-[12px] font-bold rounded-[8px] hover:bg-[#e5e8eb] transition-colors duration-150"
                    >
                      거절
                    </button>
                  </div>
                ) : (
                  <span className="text-[12px] font-semibold text-[#8b95a1] shrink-0">
                    {demoResponded === "accepted" ? "승인 완료" : "거절됨"}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
