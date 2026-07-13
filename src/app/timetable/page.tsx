"use client";

// [설계 의도]: 유저가 매주 시간표를 채우는 노동을 하지 않도록 9to6 외 시간 및 점심시간대
// 기본 루틴 레이어를 자동 세팅하고, 외부 연동 시 Diff-View 패널을 통해 데이터 충돌을
// 원스크린으로 해결하며, 타인 조회 시 편집 권한을 완벽히 차단한다.

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/ui";
import { DAYS, HOURS, CORE_HOURS_START, type SlotState, isBusinessHour } from "@/lib/data";
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

// [설계 의도]: 전체 캘린더 뷰를 단단한 화이트 카드 모듈로 묶어 UI의 안정감을 주고,
// 불가(레드)/조정(오렌지) 상태를 연한 배경과 텍스트 컬러 매칭의 블록으로 직관화하여 시각적 인지 속도를 극대화한다.
const STATE_COLORS: Record<SlotState, string> = {
  available: "bg-[#f4f5f7]",
  unavailable: "bg-[#fff0f1] text-[#f04452]",
  prefer_not: "bg-[#fff5eb] text-[#ff9800]",
};

const STATE_LABELS: Record<SlotState, string> = {
  available: "",
  unavailable: "불가",
  prefer_not: "비선호",
};


type BrushType = "unavailable" | "prefer_not";

// ── 블록 병합 렌더링 ──
const SLOT_HEIGHT = 44;
const ROW_GAP = 3;
const ROW_HEIGHT = SLOT_HEIGHT + ROW_GAP; // 47

const TAG_BAR_COLORS: Record<string, string> = {
  기타: "#94a3b8", 외근: "#f59e0b", 회의: "#3182f6", 휴가: "#34c759", 원온원: "#af52de",
};

type SlotData = { tag: string; groupId: string; title: string };
type MergedBlock = {
  type: "schedule" | "unavailable" | "prefer_not";
  startHour: number; span: number; startIdx: number;
  tag?: string; title?: string; groupId?: string;
};

function computeMergedBlocksForDay(
  day: number,
  timetable: Record<string, SlotState>,
  slotData: Record<string, SlotData>,
): MergedBlock[] {
  const blocks: MergedBlock[] = [];
  let i = 0;
  while (i < HOURS.length) {
    const hour = HOURS[i];
    const key = `${day}-${hour}`;
    const sd = slotData[key];
    const state = timetable[key] || "available";
    if (sd) {
      const { groupId } = sd;
      let j = i;
      while (j < HOURS.length && slotData[`${day}-${HOURS[j]}`]?.groupId === groupId) j++;
      blocks.push({ type: "schedule", startHour: hour, span: j - i, startIdx: i, tag: sd.tag, title: sd.title, groupId });
      i = j;
    } else if (state === "unavailable") {
      let j = i;
      while (j < HOURS.length && !slotData[`${day}-${HOURS[j]}`] && (timetable[`${day}-${HOURS[j]}`] || "available") === "unavailable") j++;
      blocks.push({ type: "unavailable", startHour: hour, span: j - i, startIdx: i });
      i = j;
    } else if (state === "prefer_not") {
      let j = i;
      while (j < HOURS.length && !slotData[`${day}-${HOURS[j]}`] && (timetable[`${day}-${HOURS[j]}`] || "available") === "prefer_not") j++;
      blocks.push({ type: "prefer_not", startHour: hour, span: j - i, startIdx: i });
      i = j;
    } else {
      i++;
    }
  }
  return blocks;
}

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
  const { timetable, update, reset, loaded } = useTimetable("f");
  const [editMode, setEditMode] = useState<BrushType | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(() => searchParams.get("add") === "1");
  const [slotData, setSlotData] = useState<Record<string, SlotData>>({});
  const [deletePopover, setDeletePopover] = useState<{ groupId: string; day: number; x: number; y: number } | null>(null);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncChoice, setSyncChoice] = useState<"keep" | "overwrite" | null>(null);
  const [syncDone, setSyncDone] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekInfo = getWeekInfo(weekOffset);

  useEffect(() => {
    type RawSchedule = { groupId?: string; title: string; tag: string; day: number; hour: number; personId: string };
    const raw: RawSchedule[] = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
    const data: Record<string, SlotData> = {};

    // groupId 있는 레코드 먼저 처리
    raw.filter(s => s.groupId && s.personId === "f").forEach(s => {
      data[`${s.day}-${s.hour}`] = { tag: s.tag, groupId: s.groupId!, title: s.title };
    });

    // 레거시 레코드: (day, tag, title)이 같고 hour 연속이면 동일 groupId
    const legacy = raw.filter(s => !s.groupId && s.personId === "f");
    const legacyMap: Record<string, RawSchedule[]> = {};
    legacy.forEach(s => { const k = `${s.day}|${s.tag}|${s.title}`; (legacyMap[k] ||= []).push(s); });
    Object.values(legacyMap).forEach(records => {
      const sorted = [...records].sort((a, b) => a.hour - b.hour);
      let runStart = 0;
      for (let i = 1; i <= sorted.length; i++) {
        if (i === sorted.length || sorted[i].hour !== sorted[i - 1].hour + 1) {
          const synId = `legacy-${sorted[runStart].day}-${sorted[runStart].tag}-${sorted[runStart].hour}`;
          for (let j = runStart; j < i; j++) {
            data[`${sorted[j].day}-${sorted[j].hour}`] = { tag: sorted[j].tag, groupId: synId, title: sorted[j].title };
          }
          runStart = i;
        }
      }
    });

    setSlotData(data);
  }, [loaded]);

  useEffect(() => {
    if (loaded && gridRef.current) {
      const rowHeight = 47; // 44px slot + 3px gap
      gridRef.current.scrollTop = CORE_HOURS_START * rowHeight;
    }
  }, [loaded]);

  // ── 1. 기본 루틴 자동 세팅 (최초 1회) ──
  useEffect(() => {
    if (!loaded) return;
    if (localStorage.getItem("base_routine_set")) return;
    const base: Record<string, SlotState> = { ...timetable };
    for (let d = 0; d < 5; d++) {
      base[`${d}-12`] = "unavailable"; // 점심
      base[`${d}-13`] = "prefer_not";  // 점심 직후
    }
    update(base);
    localStorage.setItem("base_routine_set", "true");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const paint = useCallback((key: string) => {
    if (!editMode) return;
    if (slotData[key]) return; // 일정 블록은 브러시 대상 제외
    const state = timetable[key] || "available";
    // 반대 상태 셀은 수정 불가
    if (state !== "available" && state !== editMode) return;

    const newState: SlotState = state === editMode ? "available" : editMode;
    const newTable: Record<string, SlotState> = { ...timetable, [key]: newState };
    update(newTable);
  }, [editMode, timetable, update]);

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

  const handleDeleteBlock = useCallback((groupId: string) => {
    const keys = Object.entries(slotData).filter(([, v]) => v.groupId === groupId).map(([k]) => k);
    const newTable = { ...timetable };
    keys.forEach(k => { newTable[k] = "available" as SlotState; });
    update(newTable);
    type RawSchedule = { groupId?: string; day: number; hour: number; personId: string };
    const schedules: RawSchedule[] = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
    localStorage.setItem("internal_schedules", JSON.stringify(
      schedules.filter(s => s.groupId ? s.groupId !== groupId : !keys.includes(`${s.day}-${s.hour}`) || s.personId !== "f")
    ));
    setSlotData(prev => { const next = { ...prev }; keys.forEach(k => delete next[k]); return next; });
    setDeletePopover(null);
  }, [slotData, timetable, update]);

  // ── 2. 외부 캘린더 동기화 완료 ──
  const handleSyncComplete = () => {
    if (syncChoice === "overwrite") {
      update({ ...timetable, "1-14": "unavailable" });
    }
    setShowSyncPanel(false);
    setSyncChoice(null);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 2500);
  };

  if (!loaded) return null;

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto" onPointerUp={handlePointerUp}>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <div className="flex items-center gap-3">
              <h2 className="text-[18px] font-bold text-graphite">내 캘린더</h2>
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
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center h-9 px-4 bg-mist text-graphite text-[13px] font-bold rounded-[8px] hover:bg-silver transition-colors duration-150"
              >
                + 일정 등록
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-10 py-10">
          {/* 액션 버튼 */}
          {!editMode && (
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setEditMode("unavailable")}
                className="h-10 px-5 text-[13px] font-bold rounded-[8px] transition-colors duration-150"
                style={{
                  backgroundColor: "lab(56.1306% 66.3818 33.2557 / .1)",
                  color: "#f04452",
                }}
              >
                불가능한 시간 선택하기
              </button>
              <button
                onClick={() => setEditMode("prefer_not")}
                className="h-10 px-5 text-[13px] font-bold rounded-[8px] transition-colors duration-150"
                style={{
                  backgroundColor: "lab(72.6018% 33.5338 77.3213 / .12)",
                  color: "#fe9800",
                }}
              >
                비선호 시간 선택하기
              </button>
              <button
                onClick={() => {
                  if (showSyncPanel || syncLoading) return;
                  setSyncLoading(true);
                  setTimeout(() => { setSyncLoading(false); setShowSyncPanel(true); }, 1400);
                }}
                disabled={syncLoading}
                className="h-10 px-5 bg-silver text-graphite text-[13px] font-bold rounded-[8px] hover:bg-stone/30 transition-colors duration-150 ml-auto flex items-center gap-2 disabled:opacity-60"
              >
                {syncLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-graphite/30 border-t-graphite rounded-full animate-spin shrink-0" />
                )}
                {syncLoading ? "연동 중..." : "외부 캘린더 연동하기"}
              </button>
            </div>
          )}

          {/* 편집 모드 안내 배너 */}
          {editMode && (
            <div className="bg-white rounded-[16px] shadow-card px-6 py-4 mb-4 flex items-center justify-between relative z-20">
              <div>
                <p className="text-[13px] font-semibold text-graphite">
                  {editMode === "unavailable"
                    ? "회의가 불가능한 시간을 모두 드래그해주세요. 클릭해서 해제할 수 있습니다."
                    : "비선호하지만 조정 가능한 시간대를 드래그해주세요. 클릭해서 해제할 수 있습니다."}
                </p>
              </div>
              <button
                onClick={() => { handleSave(); setEditMode(null); }}
                className="h-9 px-5 bg-ink text-white text-[13px] font-bold rounded-[8px] active:bg-black transition-colors duration-150 shrink-0 ml-4"
              >
                저장
              </button>
            </div>
          )}

          {/* 블러 오버레이 (편집 모드 시 캘린더 외 영역) */}
          {editMode && (
            <div className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[2px] pointer-events-none" />
          )}

          {/* 24시간 시간표 그리드 */}
          <div className={`bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 select-none ${editMode ? "relative z-20" : ""}`}>
            <div
              ref={gridRef}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: "600px" }}
            >
              <div className="grid grid-cols-[56px_repeat(5,1fr)] sticky top-0 z-10 bg-white pb-2">
                <div />
                {DAYS.map((day, i) => (
                  <div key={i} className="text-center py-2.5">
                    <span className="block text-[12px] font-bold text-graphite">{day}</span>
                    <span className="block text-[12px] text-slate mt-0.5 tabular-nums">
                      {weekInfo.dates[i].month}/{weekInfo.dates[i].date}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative">
                {/* 베이스 그리드 (배경색 + 드래그 이벤트) */}
                <div className="grid grid-cols-[56px_repeat(5,1fr)] gap-y-[3px] gap-x-[4px]">
                  {HOURS.map((hour) => (
                    <div key={`row-${hour}`} className="contents">
                      <div className="relative h-[44px]">
                        <span className={`absolute ${hour === 0 ? "top-[2px]" : "-top-[7px]"} right-3 text-[12px] text-slate tabular-nums tracking-tight font-medium leading-none`}>
                          {formatHour(hour)}
                        </span>
                      </div>
                      {DAYS.map((_, dayIdx) => {
                        const key = `${dayIdx}-${hour}`;
                        const state = timetable[key] || "available";
                        const isOpposite = editMode && state !== "available" && state !== editMode;
                        const isEditable = editMode && !isOpposite && !slotData[key];
                        return (
                          <div
                            key={key}
                            className={`h-[44px] rounded-[6px] transition-colors duration-100 ${STATE_COLORS[state]} ${
                              isOpposite ? "opacity-30 cursor-not-allowed" : slotData[key] ? "cursor-default" : "cursor-pointer"
                            }`}
                            onPointerDown={() => isEditable && handlePointerDown(key)}
                            onPointerEnter={() => isEditable && handlePointerEnter(key)}
                          />
                        );
                      })}
                    </div>
                  ))}
                  {/* 24:00 레이블 경계 */}
                  <div className="contents">
                    <div className="relative h-[14px]">
                      <span className="absolute -top-[7px] right-3 text-[12px] text-slate tabular-nums tracking-tight font-medium leading-none">
                        24:00
                      </span>
                    </div>
                    {DAYS.map((_, i) => <div key={i} className="h-[14px]" />)}
                  </div>
                </div>

                {/* 블록 병합 오버레이 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="grid grid-cols-[56px_repeat(5,1fr)] gap-x-[4px] h-full">
                    <div />
                    {[0, 1, 2, 3, 4].map((dayIdx) => (
                      <div key={dayIdx} className="relative">
                        {computeMergedBlocksForDay(dayIdx, timetable, slotData).map((block) => {
                          const top = block.startIdx * ROW_HEIGHT;
                          const height = block.span * SLOT_HEIGHT + (block.span - 1) * ROW_GAP;
                          if (block.type === "schedule") {
                            const barColor = TAG_BAR_COLORS[block.tag!] ?? "#94a3b8";
                            const label = block.span > 1
                              ? `${block.tag} · ${formatHour(block.startHour)}–${formatHour(block.startHour + block.span)}`
                              : block.tag!;
                            return (
                              <div
                                key={block.groupId}
                                className="absolute inset-x-0 bg-white rounded-[6px] shadow-sm overflow-hidden pointer-events-auto cursor-pointer"
                                style={{ top, height }}
                                onClick={(e) => {
                                  if (!editMode) return;
                                  e.stopPropagation();
                                  setDeletePopover({ groupId: block.groupId!, day: dayIdx, x: e.clientX, y: e.clientY });
                                }}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: barColor }} />
                                <div className="absolute inset-y-0 left-[7px] right-0 flex items-center pr-2">
                                  <span className="text-[11px] font-semibold text-graphite truncate">{label}</span>
                                </div>
                              </div>
                            );
                          }
                          if (block.type === "unavailable") {
                            return (
                              <div key={`u-${block.startHour}`} className="absolute inset-x-0 bg-[#fff0f1] rounded-[6px] flex items-center justify-center" style={{ top, height }}>
                                <span className="text-[12px] font-semibold text-[#f04452]">불가</span>
                              </div>
                            );
                          }
                          if (block.type === "prefer_not") {
                            return (
                              <div key={`p-${block.startHour}`} className="absolute inset-x-0 bg-[#fff5eb] rounded-[6px] flex items-center justify-center" style={{ top, height }}>
                                <span className="text-[12px] font-semibold text-[#ff9800]">비선호</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 2. 외부 캘린더 연동 Diff-View 패널 ── */}
      <div className={`fixed top-0 right-[300px] h-full w-[300px] bg-white border-l border-r border-silver z-30 flex flex-col shadow-modal transition-transform duration-300 ${showSyncPanel ? "translate-x-0" : "translate-x-[600px] pointer-events-none"}`}>
        <div className="px-5 py-4 border-b border-silver flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-graphite">외부 캘린더 연동 검수</h3>
            <p className="text-[12px] text-warning mt-0.5 font-semibold">충돌 1건 발견</p>
          </div>
          <button onClick={() => { setShowSyncPanel(false); setSyncChoice(null); }} className="text-stone hover:text-graphite p-1 rounded-full hover:bg-mist transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-[12px] text-slate leading-relaxed mb-5">
            기존 Corecalendar 일정과 중복되는 외부 일정이 있습니다. 유지할 일정을 선택해주세요.
          </p>

          <div className="rounded-[12px] border border-silver overflow-hidden">
            <button
              onClick={() => setSyncChoice("keep")}
              className={`w-full px-4 py-4 text-left border-b border-silver transition-colors duration-150 ${syncChoice === "keep" ? "bg-ink/6" : "hover:bg-mist"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">내 일정 유지</span>
                {syncChoice === "keep" && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l3 3 5-6" stroke="#101010" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </div>
              <p className="text-[13px] font-semibold text-graphite">화요일 14:00 — 외근</p>
              <p className="text-[12px] text-slate mt-0.5">Corecalendar에 등록된 일정</p>
            </button>
            <button
              onClick={() => setSyncChoice("overwrite")}
              className={`w-full px-4 py-4 text-left transition-colors duration-150 ${syncChoice === "overwrite" ? "bg-ink/6" : "hover:bg-mist"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate uppercase tracking-wider">외부 일정 덮어쓰기</span>
                {syncChoice === "overwrite" && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l3 3 5-6" stroke="#101010" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </div>
              <p className="text-[13px] font-semibold text-graphite">화요일 14:00 — 구글: 업체 미팅</p>
              <p className="text-[12px] text-slate mt-0.5">Google Calendar에서 가져온 일정</p>
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-silver">
          <button
            onClick={handleSyncComplete}
            disabled={!syncChoice}
            className="w-full h-11 bg-ink text-white text-[13px] font-bold rounded-[10px] disabled:opacity-30 disabled:cursor-not-allowed active:bg-black transition-colors duration-150"
          >
            선택한 일정으로 동기화 완료
          </button>
        </div>
      </div>

      {/* syncDone 토스트 */}
      {syncDone && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-graphite text-white text-[13px] font-semibold rounded-[12px] shadow-modal pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="#03b26c" fillOpacity="0.25" />
            <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#03b26c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          캘린더 동기화가 완료되었습니다
        </div>
      )}

      {/* 저장 완료 토스트 */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-graphite text-white text-[13px] font-semibold rounded-[12px] shadow-modal pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="#03b26c" fillOpacity="0.25" />
            <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="#03b26c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          저장되었습니다
        </div>
      )}

      {/* 일정 삭제 팝오버 */}
      {deletePopover && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDeletePopover(null)} />
          <div
            className="fixed z-50 bg-white rounded-[12px] shadow-modal py-1 w-[148px]"
            style={{ top: deletePopover.y, left: deletePopover.x }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleDeleteBlock(deletePopover.groupId)}
              className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#f04452] hover:bg-mist rounded-[10px] transition-colors"
            >
              일정 삭제
            </button>
            <button
              onClick={() => setDeletePopover(null)}
              className="w-full text-left px-4 py-2.5 text-[13px] text-slate hover:bg-mist rounded-[10px] transition-colors"
            >
              취소
            </button>
          </div>
        </>
      )}

      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(title, tag, day, startHour, endHour) => {
            const newTable = { ...timetable };
            for (let h = startHour; h < endHour; h++) {
              newTable[`${day}-${h}`] = "unavailable" as SlotState;
            }
            update(newTable);

            const groupId = `sch-${Date.now()}`;
            const schedules = JSON.parse(localStorage.getItem("internal_schedules") || "[]");
            for (let h = startHour; h < endHour; h++) {
              schedules.push({
                id: `${groupId}-${h}`, groupId, title, tag, day, hour: h,
                personId: "f", createdAt: new Date().toISOString(),
              });
            }
            localStorage.setItem("internal_schedules", JSON.stringify(schedules));

            setSlotData(prev => {
              const next = { ...prev };
              for (let h = startHour; h < endHour; h++) next[`${day}-${h}`] = { tag, groupId, title };
              return next;
            });
          }}
        />
      )}
    </AppShell>
  );
}
