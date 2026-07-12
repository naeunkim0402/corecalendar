"use client";

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
  const { meetings, approveAllForMeeting, rejectMeeting, loaded } = useMeetings();
  const [demoResponded, setDemoResponded] = useState<"accepted" | "rejected" | null>(null);
  const today = getTodayInfo();

  const pendingMeetings = meetings.filter((m) => m.status === "pending");
  const resolvedMeetings = meetings.filter((m) => m.status === "approved" || m.status === "rejected");

  if (!loaded) return null;

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-graphite">요청 회의건</h2>
              {pendingMeetings.length > 0 && (
                <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-error text-white text-[12px] font-bold flex items-center justify-center">
                  {pendingMeetings.length}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-10 py-10">
          {/* 대기 상태 */}
          {(pendingMeetings.length > 0 || !demoResponded) && (
            <section className="mb-10">
              <div className="mb-5 px-1">
                <h3 className="text-[17px] font-bold text-graphite">
                  대기 상태 <span className="text-stone font-bold ml-1 tabular-nums text-[15px]">{pendingMeetings.length + (!demoResponded ? 1 : 0)}</span>
                </h3>
              </div>

              <div className="space-y-3">
                {pendingMeetings.map((m) => {
                  const organizerPerson = PEOPLE.find((p) => p.id === "f");

                  return (
                    <div key={m.id} className="bg-white rounded-[16px] shadow-card px-7 py-5">
                      <div className="flex items-center gap-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-warning/12 text-warning shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                          대기중
                        </span>

                        <span className="text-[14px] font-bold text-graphite shrink-0">{m.title}</span>

                        <span className="text-[13px] text-slate tabular-nums shrink-0">
                          {today.month}/{today.date} {today.dayLabel}요일
                        </span>
                        <span className="text-[13px] font-semibold text-graphite tabular-nums shrink-0">
                          {m.hour}:00 – {m.hour + 1}:00
                        </span>

                        <div className="flex items-center gap-2 shrink-0 ml-auto mr-4">
                          {organizerPerson && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                              style={{ backgroundColor: organizerPerson.color }}
                            >
                              {organizerPerson.avatar}
                            </div>
                          )}
                          <span className="text-[12px] text-slate">
                            {organizerPerson?.name} · {organizerPerson?.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => approveAllForMeeting(m.id)}
                            className="h-8 px-4 bg-ink text-white text-[12px] font-bold rounded-[8px] active:bg-black transition-colors duration-150"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => rejectMeeting(m.id)}
                            className="h-8 px-4 bg-mist text-slate text-[12px] font-bold rounded-[8px] hover:bg-silver transition-colors duration-150"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 데모 카드 — 대기 상태일 때만 여기 표시 */}
                {!demoResponded && (
                  <div className="bg-white rounded-[16px] shadow-card px-7 py-5">
                    <div className="flex items-center gap-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-warning/12 text-warning shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                        대기중
                      </span>

                      <span className="text-[14px] font-bold text-graphite shrink-0">스프린트 킥오프</span>

                      <span className="text-[13px] text-slate tabular-nums shrink-0">
                        {today.month}/{today.date} {today.dayLabel}요일
                      </span>
                      <span className="text-[13px] font-semibold text-graphite tabular-nums shrink-0">
                        10:00 – 11:00
                      </span>

                      <div className="flex items-center gap-2 shrink-0 ml-auto mr-4">
                        <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-[12px] font-bold text-white">
                          나
                        </div>
                        <span className="text-[12px] text-slate">
                          김나은 · 프로덕트 디자이너
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setDemoResponded("accepted")}
                          className="h-8 px-4 bg-ink text-white text-[12px] font-bold rounded-[8px] active:bg-black transition-colors duration-150"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => setDemoResponded("rejected")}
                          className="h-8 px-4 bg-mist text-slate text-[12px] font-bold rounded-[8px] hover:bg-silver transition-colors duration-150"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 처리 완료 */}
          {(resolvedMeetings.length > 0 || demoResponded) && (
            <section className="mb-10">
              <div className="mb-5 px-1">
                <h3 className="text-[17px] font-bold text-graphite">
                  처리 완료 <span className="text-stone font-bold ml-1 tabular-nums text-[15px]">{resolvedMeetings.length + (demoResponded ? 1 : 0)}</span>
                </h3>
              </div>
              <div className="space-y-3">
                {resolvedMeetings.map((m) => {
                  const organizerPerson = PEOPLE.find((p) => p.id === "f");
                  const isApproved = m.status === "approved";
                  return (
                    <div key={m.id} className={`bg-white rounded-[16px] shadow-card px-7 py-5 ${m.status === "rejected" ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0 ${
                          isApproved
                            ? "bg-success/12 text-success"
                            : "bg-error/12 text-error"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-success" : "bg-error"}`} />
                          {isApproved ? "확정됨" : "거절됨"}
                        </span>
                        <span className="text-[14px] font-bold text-graphite">{m.title}</span>
                        <span className="text-[13px] text-slate tabular-nums">
                          {today.month}/{today.date} {today.dayLabel}요일
                        </span>
                        <span className="text-[13px] font-semibold text-graphite tabular-nums">
                          {m.hour}:00 – {m.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                          {organizerPerson && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                              style={{ backgroundColor: organizerPerson.color }}
                            >
                              {organizerPerson.avatar}
                            </div>
                          )}
                          <span className="text-[12px] text-slate">{organizerPerson?.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 데모 카드 — 처리 완료 시 여기로 이동 */}
                {demoResponded && (
                  <div className={`bg-white rounded-[16px] shadow-card px-7 py-5 ${demoResponded === "rejected" ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0 ${
                        demoResponded === "accepted" ? "bg-success/12 text-success" : "bg-error/12 text-error"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${demoResponded === "accepted" ? "bg-success" : "bg-error"}`} />
                        {demoResponded === "accepted" ? "확정됨" : "거절됨"}
                      </span>
                      <span className="text-[14px] font-bold text-graphite">스프린트 킥오프</span>
                      <span className="text-[13px] text-slate tabular-nums">
                        {today.month}/{today.date} {today.dayLabel}요일
                      </span>
                      <span className="text-[13px] font-semibold text-graphite tabular-nums">
                        10:00 – 11:00
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-[12px] font-bold text-white">
                          나
                        </div>
                        <span className="text-[12px] text-slate">김나은</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}
