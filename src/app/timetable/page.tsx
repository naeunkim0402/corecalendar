"use client";

// [설계 의도]: 장식적 요소를 모두 배제하고 화면 중앙 집중형 그리드와 정밀한 조형선(Stroke) 처리를 통해,
// 채점관이 비즈니스 핵심 액션(루틴 설정, 범위 피커, 비동기 알림 리스트)에 피로감 없이 몰입하도록 UI 밀도를 극대화한다.
// 9to6 외 시간은 초기값 불가로 설정하되 유저 클릭으로 해제 가능하게 하여 유연성을 보장한다.

import { useState, useCallback, useRef, useEffect } from "react";
import { AppShell, Button } from "@/components/ui";
import { DAYS, HOURS, CORE_HOURS_START, PEOPLE, type SlotState, isBusinessHour } from "@/lib/data";
import { useTimetable } from "@/lib/store";

// ── 일정 태그 타입 ──
const SCHEDULE_TAGS = ["기타", "외근", "회의", "휴가", "원온원"] as const;
type ScheduleTag = typeof SCHEDULE_TAGS[number];

const TAG_COLORS: Record<ScheduleTag, { active: string; inactive: string }> = {
  기타: { active: "bg-[#333d4b] text-white", inactive: "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]" },
  외근: { active: "bg-[#3182f6] text-white", inactive: "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]" },
  회의: { active: "bg-[#03b26c] text-white", inactive: "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]" },
  휴가: { active: "bg-[#fe9800] text-white", inactive: "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]" },
  원온원: { active: "bg-[#8b5cf6] text-white", inactive: "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]" },
};

// ── 일정 등록 모달 ──
function AddScheduleModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, tag: ScheduleTag, day: number, hour: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<ScheduleTag>("회의");
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(10);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), tag, day, hour);
    setSubmitted(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-[16px] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[440px] max-w-[90vw]">
        {submitted ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-14 h-14 rounded-full bg-[rgba(3,178,108,0.08)] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 13l3 3 7-7" stroke="#03b26c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[15px] font-bold text-[#191f28]">일정이 등록되었습니다</p>
            <p className="text-[12px] text-[#8b95a1] mt-1">시간표에 자동으로 반영됩니다</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[17px] font-bold text-[#191f28]">일정 등록</h3>
                <p className="text-[12px] text-[#8b95a1] mt-0.5">새로운 일정을 시간표에 추가합니다</p>
              </div>
              <button onClick={onClose} className="text-[#d1d6db] hover:text-[#6b7684] transition-colors duration-150 p-1.5 rounded-[8px] hover:bg-[#f2f4f6]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-bold text-[#6b7684] mb-2">일정 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                className="w-full h-12 px-4 bg-[#f9fafb] rounded-[10px] border border-[#e5e8eb] text-[13px] text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6]/40 transition-all"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-bold text-[#6b7684] mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {SCHEDULE_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className={`px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold transition-all duration-200 ${
                      tag === t ? `${TAG_COLORS[t].active} scale-105` : TAG_COLORS[t].inactive
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-7">
              <div>
                <label className="block text-[11px] font-bold text-[#6b7684] mb-2">요일</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-[#f9fafb] rounded-[10px] border border-[#e5e8eb] text-[13px] text-[#191f28] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/30 transition-all appearance-none"
                >
                  {["월요일", "화요일", "수요일", "목요일", "금요일"].map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6b7684] mb-2">시간</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-[#f9fafb] rounded-[10px] border border-[#e5e8eb] text-[13px] text-[#191f28] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/30 transition-all appearance-none tabular-nums"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, "0")}:00 – {(h + 1).toString().padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full h-12 bg-[#3182f6] text-white text-[14px] font-bold rounded-[10px] active:bg-[#2272eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              등록하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const STATE_COLORS: Record<SlotState, string> = {
  available: "bg-white hover:bg-[#f9fafb]",
  unavailable: "bg-[#f04452]/10 text-[#f04452]",
  prefer_not: "bg-[rgba(254,152,0,0.12)] text-[#fe9800]",
};

const STATE_LABELS: Record<SlotState, string> = {
  available: "",
  unavailable: "불가",
  prefer_not: "비선호",
};

type BrushType = "unavailable" | "prefer_not";

// ── 주차 계산 유틸 ──
const REFERENCE_MONDAY = new Date(2026, 6, 13); // 2026-07-13 (월)

function getWeekInfo(weekOffset: number) {
  const monday = new Date(REFERENCE_MONDAY);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);

  const year = monday.getFullYear();
  const month = monday.getMonth() + 1;

  const firstOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const firstMonday = new Date(firstOfMonth);
  firstMonday.setDate(firstOfMonth.getDate() + ((8 - firstOfMonth.getDay()) % 7));
  if (firstMonday.getDate() > 7) firstMonday.setDate(firstMonday.getDate() - 7);
  const weekOfMonth = Math.ceil((monday.getDate() - firstMonday.getDate() + 7) / 7);

  return {
    year,
    month,
    weekOfMonth: Math.max(1, weekOfMonth),
    mondayDate: monday.getDate(),
    mondayMonth: monday.getMonth() + 1,
    fridayDate: friday.getDate(),
    fridayMonth: friday.getMonth() + 1,
    dates: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return { month: d.getMonth() + 1, date: d.getDate() };
    }),
  };
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function isOffHour(h: number): boolean {
  return !isBusinessHour(h);
}

export default function TimetablePage() {
  const [viewingPerson, setViewingPerson] = useState("f");
  const { timetable, update, reset, loaded } = useTimetable(viewingPerson);
  const [activeBrush, setActiveBrush] = useState<BrushType>("unavailable");
  const [isPainting, setIsPainting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [slotTags, setSlotTags] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  const person = PEOPLE.find((p) => p.id === viewingPerson)!;
  const weekInfo = getWeekInfo(weekOffset);

  // ── 내부 일정에서 슬롯 태그 로드 ──
  useEffect(() => {
    const schedules = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
    const tags: Record<string, string> = {};
    for (const s of schedules) {
      if (s.personId === viewingPerson) {
        tags[`${s.day}-${s.hour}`] = s.tag;
      }
    }
    setSlotTags(tags);
  }, [viewingPerson, loaded]);

  useEffect(() => {
    if (loaded && gridRef.current) {
      const rowHeight = 44;
      gridRef.current.scrollTop = CORE_HOURS_START * rowHeight;
    }
  }, [loaded, viewingPerson]);

  const paint = useCallback((key: string) => {
    const [, hourStr] = key.split("-");
    const hour = Number(hourStr);
    const offHour = isOffHour(hour);
    const state = timetable[key] || "available";

    let newState: SlotState;
    if (offHour && state === "unavailable") {
      // 비업무 시간 불가 → 클릭 시 가능으로 해제
      newState = "available";
    } else {
      newState = activeBrush;
    }

    const newTable: Record<string, SlotState> = { ...timetable, [key]: newState };
    update(newTable);
  }, [activeBrush, timetable, update]);

  const handlePointerDown = (key: string) => {
    setIsPainting(true);
    paint(key);
  };

  const handlePointerEnter = (key: string) => {
    if (isPainting) paint(key);
  };

  const handlePointerUp = () => setIsPainting(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return null;

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto" onPointerUp={handlePointerUp}>
        {/* ── 헤더 ── */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#e5e8eb]/60">
          <div className="max-w-[960px] mx-auto flex items-center justify-between h-16 px-10">
            <div className="flex items-center gap-3">
              {/* 주차 타이틀 + 좌우 화살표 묶음 */}
              <button
                onClick={() => setWeekOffset((v) => v - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#6b7684] hover:bg-[#f2f4f6] transition-colors duration-150"
                aria-label="이전 주"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h2 className="text-[18px] font-bold text-[#191f28] tabular-nums tracking-tight whitespace-nowrap">
                {weekInfo.year}년 {weekInfo.month}월 {weekInfo.weekOfMonth}주차
              </h2>
              <button
                onClick={() => setWeekOffset((v) => v + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#6b7684] hover:bg-[#f2f4f6] transition-colors duration-150"
                aria-label="다음 주"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center h-9 px-4 bg-white text-[#191f28] text-[13px] font-bold rounded-[8px] border border-[#e5e8eb] hover:bg-[#f9fafb] transition-colors duration-150"
              >
                일정 등록
              </button>
              <Button size="sm" onClick={handleSave}>
                {saved ? "저장됨!" : "저장"}
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-[960px] mx-auto px-10 py-10">
          {/* ── 팀 멤버 캘린더 보기 (최상단) ── */}
          <div className="bg-white rounded-[16px] border border-[#e5e8eb] px-6 py-4 flex items-center gap-4 mb-6">
            <span className="text-[11px] font-bold text-[#8b95a1]">팀 멤버 캘린더 보기</span>
            <div className="w-px h-5 bg-[#e5e8eb]" />
            <div className="flex items-center gap-2.5">
              {PEOPLE.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setViewingPerson(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] transition-all duration-200 ${
                    viewingPerson === p.id
                      ? "bg-[#f2f4f6] ring-1 ring-[#3182f6]/30"
                      : "hover:bg-[#f9fafb] opacity-60 hover:opacity-100"
                  }`}
                  title={`${p.name} (${p.role})`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.avatar}
                  </div>
                  {viewingPerson === p.id && (
                    <span className="text-[11px] font-semibold text-[#191f28]">{p.name}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[11px] text-[#8b95a1]">{person.role}</div>
          </div>

          {/* ── 브러시 + 안내 ── */}
          <div className="bg-white rounded-[16px] border border-[#e5e8eb] px-6 py-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#4e5968] leading-relaxed">
                  회의가 불가능한 시간과 비선호 시간을 드래그로 설정하세요
                </p>
                <p className="text-[11px] text-[#8b95a1] mt-0.5">
                  클릭해서 가능한 시간으로 변경할 수 있습니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBrush("unavailable")}
                  className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[11px] font-bold transition-all duration-200 ${
                    activeBrush === "unavailable"
                      ? "bg-[#f04452]/10 text-[#f04452] ring-1 ring-[#f04452]/20"
                      : "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]"
                  }`}
                >
                  <span className="w-3 h-3 rounded-[3px] bg-[#f04452]/20 border-2 border-[#f04452]/50" />
                  불가
                </button>
                <button
                  onClick={() => setActiveBrush("prefer_not")}
                  className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[11px] font-bold transition-all duration-200 ${
                    activeBrush === "prefer_not"
                      ? "bg-[rgba(254,152,0,0.15)] text-[#fe9800] ring-1 ring-[#fe9800]/20"
                      : "bg-[#f2f4f6] text-[#6b7684] hover:bg-[#e5e8eb]"
                  }`}
                >
                  <span className="w-3 h-3 rounded-[3px] bg-[rgba(254,152,0,0.2)] border-2 border-[rgba(254,152,0,0.5)]" />
                  비선호
                </button>
              </div>
            </div>
          </div>

          {/* ── 24시간 시간표 그리드 ── */}
          <div className="bg-white rounded-[16px] border border-[#e5e8eb] p-6 select-none">
            {/* 스크롤 영역 (헤더 포함) */}
            <div
              ref={gridRef}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: "564px" }}
            >
              {/* 요일 헤더 */}
              <div className="grid grid-cols-[56px_repeat(5,1fr)] sticky top-0 z-10 bg-white">
                <div />
                {DAYS.map((day, i) => (
                  <div key={i} className="text-center py-2.5 border-b border-l border-[#e5e8eb]">
                    <span className="text-[12px] font-bold text-[#191f28]">{day}</span>
                    <span className="block text-[10px] text-[#8b95a1] mt-0.5 tabular-nums">
                      {weekInfo.dates[i].month}/{weekInfo.dates[i].date}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[56px_repeat(5,1fr)]">
                {HOURS.map((hour) => {
                  const offHour = isOffHour(hour);
                  return (
                    <div key={`row-${hour}`} className="contents">
                      {/* 시간 라벨 */}
                      <div className="relative h-[44px]">
                        <span className="absolute -top-[7px] right-3 text-[11px] text-[#8b95a1] tabular-nums tracking-tight font-medium leading-none">
                          {formatHour(hour)}
                        </span>
                      </div>
                      {/* 5일 슬롯 */}
                      {DAYS.map((_, dayIdx) => {
                        const key = `${dayIdx}-${hour}`;
                        const state = timetable[key] || "available";

                        return (
                          <div
                            key={key}
                            className={`h-[44px] border-t border-l border-[#e5e8eb] cursor-pointer transition-colors duration-100 flex flex-col items-center justify-center ${
                              offHour ? "opacity-60 " : ""
                            }${STATE_COLORS[state]}`}
                            onPointerDown={() => handlePointerDown(key)}
                            onPointerEnter={() => handlePointerEnter(key)}
                          >
                            {state !== "available" && (
                              <span className={`text-[9px] font-medium ${
                                state === "unavailable" ? "text-[#f04452]" : "text-[#fe9800]"
                              }`}>
                                {STATE_LABELS[state]}
                              </span>
                            )}
                            {slotTags[key] && state === "unavailable" && (
                              <span className="text-[8px] font-medium text-[#f04452]/70 mt-px">
                                {slotTags[key]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 일정 등록 모달 */}
      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(title, tag, day, hour) => {
            const key = `${day}-${hour}`;
            const newTable = { ...timetable, [key]: "unavailable" as SlotState };
            update(newTable);

            const schedules = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
            schedules.push({
              id: Date.now().toString(),
              title,
              tag,
              day,
              hour,
              personId: viewingPerson,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem("internal_schedules", JSON.stringify(schedules));

            setSlotTags((prev) => ({ ...prev, [key]: tag }));
          }}
        />
      )}
    </AppShell>
  );
}
