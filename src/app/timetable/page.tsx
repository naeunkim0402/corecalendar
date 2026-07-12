"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/ui";
import { DAYS, HOURS, CORE_HOURS_START, PEOPLE, type SlotState, isBusinessHour } from "@/lib/data";
import { useTimetable } from "@/lib/store";

// ── 일정 태그 타입 ──
const SCHEDULE_TAGS = ["기타", "외근", "회의", "휴가", "원온원"] as const;
type ScheduleTag = typeof SCHEDULE_TAGS[number];

const TAG_COLORS: Record<ScheduleTag, { active: string; inactive: string }> = {
  기타: { active: "bg-ink text-white", inactive: "bg-mist text-slate hover:bg-silver" },
  외근: { active: "bg-ink text-white", inactive: "bg-mist text-slate hover:bg-silver" },
  회의: { active: "bg-ink text-white", inactive: "bg-mist text-slate hover:bg-silver" },
  휴가: { active: "bg-ink text-white", inactive: "bg-mist text-slate hover:bg-silver" },
  원온원: { active: "bg-ink text-white", inactive: "bg-mist text-slate hover:bg-silver" },
};

// ── 커스텀 드롭다운 ──
function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-12 px-4 bg-paper rounded-[10px] text-[13px] text-left flex items-center justify-between transition-all ${
          open ? "ring-2 ring-ink/10 bg-white" : ""
        }`}
      >
        <span className={selected ? "text-graphite font-medium tabular-nums" : "text-stone"}>
          {selected?.label || placeholder || "선택"}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`text-slate transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white rounded-[12px] shadow-modal border border-silver/60 py-1 z-50 max-h-[200px] overflow-y-auto">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors duration-100 flex items-center justify-between tabular-nums ${
                value === o.value ? "bg-mist font-semibold text-graphite" : "text-graphite hover:bg-paper"
              }`}
            >
              <span>{o.label}</span>
              {value === o.value && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ink shrink-0">
                  <path d="M3 7.5l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 일정 등록 모달 ──
function AddScheduleModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, tag: ScheduleTag, day: number, startHour: number, endHour: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<ScheduleTag>("회의");
  const [day, setDay] = useState(0);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(11);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || endHour <= startHour) return;
    onSubmit(title.trim(), tag, day, startHour, endHour);
    setSubmitted(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-[16px] pt-7 px-7 pb-6 shadow-modal w-[440px] max-w-[90vw]">
        {submitted ? (
          <div className="flex flex-col items-center py-10">
            <div className="w-14 h-14 rounded-full bg-success/8 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 13l3 3 7-7" stroke="#03b26c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[15px] font-bold text-graphite">일정이 등록되었습니다</p>
            <p className="text-[12px] text-slate mt-1">시간표에 자동으로 반영됩니다</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[17px] font-bold text-graphite">일정 등록</h3>
                <p className="text-[12px] text-slate mt-0.5">새로운 일정을 시간표에 추가합니다</p>
              </div>
              <button onClick={onClose} className="text-stone hover:text-graphite transition-colors duration-150 p-1.5 rounded-full hover:bg-mist">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-bold text-slate mb-2">일정 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목을 입력하세요"
                className="w-full h-12 px-4 bg-paper rounded-[10px] text-[13px] text-graphite placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-ink/10 focus:bg-white transition-all"
                autoFocus
              />
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-bold text-slate mb-2">카테고리</label>
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

            <div className="mb-5">
              <label className="block text-[12px] font-bold text-slate mb-2">요일</label>
              <CustomSelect
                value={day}
                onChange={setDay}
                options={["월요일", "화요일", "수요일", "목요일", "금요일"].map((d, i) => ({ value: i, label: d }))}
              />
            </div>

            <div className="mb-7">
              <label className="block text-[12px] font-bold text-slate mb-2">시간</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <CustomSelect
                    value={startHour}
                    onChange={(v) => {
                      setStartHour(v);
                      if (endHour <= v) setEndHour(v + 1);
                    }}
                    options={HOURS.map((h) => ({ value: h, label: `${h.toString().padStart(2, "0")}:00` }))}
                  />
                </div>
                <span className="text-[13px] font-bold text-slate shrink-0">–</span>
                <div className="flex-1">
                  <CustomSelect
                    value={endHour}
                    onChange={setEndHour}
                    options={[
                      ...HOURS.filter((h) => h > startHour).map((h) => ({ value: h, label: `${h.toString().padStart(2, "0")}:00` })),
                      { value: 24, label: "24:00" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full h-12 bg-ink text-white text-[14px] font-bold rounded-[8px] active:bg-black transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
  available: "bg-white hover:bg-paper",
  unavailable: "bg-error/10 text-error",
  prefer_not: "bg-warning/12 text-warning",
};

const STATE_LABELS: Record<SlotState, string> = {
  available: "",
  unavailable: "불가",
  prefer_not: "조정",
};

type BrushType = "unavailable" | "prefer_not";

// ── 주차 계산 유틸 ──
const REFERENCE_MONDAY = new Date(2026, 6, 13);

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
  return (
    <Suspense>
      <TimetableContent />
    </Suspense>
  );
}

function TimetableContent() {
  const searchParams = useSearchParams();
  const [viewingPerson, setViewingPerson] = useState("f");
  const { timetable, update, reset, loaded } = useTimetable(viewingPerson);
  const [activeBrush, setActiveBrush] = useState<BrushType>("unavailable");
  const [isPainting, setIsPainting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(() => searchParams.get("add") === "1");
  const [slotTags, setSlotTags] = useState<Record<string, string>>({});
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const person = PEOPLE.find((p) => p.id === viewingPerson)!;
  const isMe = viewingPerson === "f";
  const weekInfo = getWeekInfo(weekOffset);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const paint = useCallback((key: string) => {
    const [, hourStr] = key.split("-");
    const hour = Number(hourStr);
    const offHour = isOffHour(hour);
    const state = timetable[key] || "available";

    let newState: SlotState;
    if (state !== "available") {
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
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-graphite">{isMe ? "내 캘린더" : `${person.name}의 캘린더`}</h2>
              <div className="w-px h-5 bg-silver mx-1" />
              <button
                onClick={() => setWeekOffset((v) => v - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate hover:bg-mist transition-colors duration-150"
                aria-label="이전 주"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-[15px] font-bold text-graphite tabular-nums tracking-tight whitespace-nowrap">
                {weekInfo.year}년 {weekInfo.month}월 {weekInfo.weekOfMonth}주차
              </span>
              <button
                onClick={() => setWeekOffset((v) => v + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate hover:bg-mist transition-colors duration-150"
                aria-label="다음 주"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setTeamDropdownOpen((v) => !v)}
                  className="h-9 pl-3 pr-8 bg-mist text-graphite text-[13px] font-bold rounded-[8px] hover:bg-silver transition-colors duration-150 flex items-center gap-2.5 relative"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.avatar}
                  </div>
                  <span>{person.name}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate">
                    <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {teamDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] w-[220px] bg-white rounded-[12px] shadow-modal border border-silver/60 py-1.5 z-30">
                    <p className="px-4 py-2 text-[11px] font-bold text-slate uppercase tracking-wider">팀 캘린더 보기</p>
                    {PEOPLE.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setViewingPerson(p.id); setTeamDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                          viewingPerson === p.id ? "bg-mist" : "hover:bg-paper"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] font-semibold text-graphite block">{p.name}</span>
                          <span className="text-[11px] text-slate">{p.role}</span>
                        </div>
                        {viewingPerson === p.id && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ink shrink-0">
                            <path d="M3 7.5l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!isMe}
                className={`inline-flex items-center h-9 px-4 text-[13px] font-bold rounded-[8px] transition-colors duration-150 ${
                  isMe ? "bg-mist text-graphite hover:bg-silver" : "bg-mist/50 text-slate/40 cursor-not-allowed"
                }`}
              >
                + 일정 등록
              </button>
              <button
                onClick={handleSave}
                disabled={!isMe}
                className={`inline-flex items-center h-9 px-4 text-[13px] font-bold rounded-[8px] transition-colors duration-150 ${
                  isMe ? "bg-ink text-white active:bg-black" : "bg-ink/30 text-white/50 cursor-not-allowed"
                }`}
              >
                {saved ? "저장됨!" : "저장"}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-10 py-10">
          {/* 브러시 + 안내 (내 캘린더일 때만) */}
          {isMe && (
            <div className="bg-white rounded-[16px] shadow-card px-6 py-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-charcoal leading-relaxed">
                    회의가 불가능한 시간과 조정 시간을 드래그로 설정하세요
                  </p>
                  <p className="text-[12px] text-slate mt-0.5">
                    클릭해서 가능한 시간으로 변경할 수 있습니다
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveBrush("unavailable")}
                    className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[12px] font-bold transition-all duration-200 ${
                      activeBrush === "unavailable"
                        ? "bg-error/10 text-error ring-1 ring-error/20"
                        : "bg-mist text-slate hover:bg-silver"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-[3px] bg-error/20 border-2 border-error/50" />
                    불가
                  </button>
                  <button
                    onClick={() => setActiveBrush("prefer_not")}
                    className={`flex items-center gap-2 h-9 px-4 rounded-[8px] text-[12px] font-bold transition-all duration-200 ${
                      activeBrush === "prefer_not"
                        ? "bg-warning/15 text-warning ring-1 ring-warning/20"
                        : "bg-mist text-slate hover:bg-silver"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-[3px] bg-warning/20 border-2 border-warning/50" />
                    조정
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 24시간 시간표 그리드 */}
          <div className="bg-white rounded-[16px] shadow-card pt-0 px-6 pb-6 select-none">
            <div
              ref={gridRef}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: "600px" }}
            >
              <div className="grid grid-cols-[56px_repeat(5,1fr)] sticky top-0 z-10 bg-white border-b border-silver">
                <div />
                {DAYS.map((day, i) => (
                  <div key={i} className="text-center py-2.5 border-l border-silver">
                    <span className="block text-[12px] font-bold text-graphite">{day}</span>
                    <span className="block text-[12px] text-slate mt-0.5 tabular-nums">
                      {weekInfo.dates[i].month}/{weekInfo.dates[i].date}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[56px_repeat(5,1fr)] mt-2">
                {HOURS.map((hour) => {
                  const offHour = isOffHour(hour);
                  return (
                    <div key={`row-${hour}`} className="contents">
                      <div className="relative h-[44px]">
                        <span className="absolute -top-[7px] right-3 text-[12px] text-slate tabular-nums tracking-tight font-medium leading-none">
                          {formatHour(hour)}
                        </span>
                      </div>
                      {DAYS.map((_, dayIdx) => {
                        const key = `${dayIdx}-${hour}`;
                        const state = timetable[key] || "available";

                        return (
                          <div
                            key={key}
                            className={`h-[44px] border-t border-l border-silver cursor-pointer transition-colors duration-100 flex flex-col items-center justify-center ${STATE_COLORS[state]}`}
                            onPointerDown={() => handlePointerDown(key)}
                            onPointerEnter={() => handlePointerEnter(key)}
                          >
                            {state !== "available" && (
                              <span className={`text-[12px] font-medium ${
                                state === "unavailable" ? "text-error" : "text-warning"
                              }`}>
                                {STATE_LABELS[state]}
                              </span>
                            )}
                            {slotTags[key] && state === "unavailable" && (
                              <span className="text-[12px] font-medium text-error/70 mt-px">
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

      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(title, tag, day, startHour, endHour) => {
            const newTable = { ...timetable };
            for (let h = startHour; h < endHour; h++) {
              newTable[`${day}-${h}`] = "unavailable" as SlotState;
            }
            update(newTable);

            const schedules = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
            for (let h = startHour; h < endHour; h++) {
              schedules.push({
                id: `${Date.now()}-${h}`,
                title,
                tag,
                day,
                hour: h,
                personId: viewingPerson,
                createdAt: new Date().toISOString(),
              });
            }
            localStorage.setItem("internal_schedules", JSON.stringify(schedules));

            setSlotTags((prev) => {
              const updated = { ...prev };
              for (let h = startHour; h < endHour; h++) {
                updated[`${day}-${h}`] = tag;
              }
              return updated;
            });
          }}
        />
      )}
    </AppShell>
  );
}
