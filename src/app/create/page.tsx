"use client";

// [설계 의도]: 장식적인 dot UI와 서술형 문구를 걷어내어 정보 밀도를 극대화하고,
// 드롭다운 아이콘 및 캘린더 피커의 인터랙션을 일관되게 정제하여 정품 B2B SaaS의 시각적 완성도를 부여한다.

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, Button } from "@/components/ui";
import { PEOPLE, type Person } from "@/lib/data";
import { computeRecommendations, useMeetings, type ComputedSlot, type ConfirmedMeeting, type AttendeeSlotState } from "@/lib/store";

// [설계 의도]: 불필요한 통계적 수치(매칭률)와 텍스트 노이즈를 걷어내고 3열 카드 배치와 전역 레이아웃 고정을 통해,
// 사용자가 시각적 흔들림 없이 '승인 요청' 액션에만 집중할 수 있도록 UI 밀도를 마감한다.

// [설계 의도]: 조건별 참석자 필터링으로 정보 우선순위를 확립하고, 완료 화면의 요소를 하나의 카드 뷰로 묶어
// 인지 복잡도를 낮추며, 대시보드의 시간 규격을 TDS 타임 포맷으로 일원화한다.

// ── 참석자 상태 아바타 ──
function AttendeeAvatar({ a, compact = false }: { a: AttendeeSlotState; compact?: boolean }) {
  const tooltip =
    a.state === "absent" ? (a.tag ? `불참: ${a.tag}` : "불참") :
    a.state === "prefer_not" ? "비선호" :
    !a.verified ? "일정 미확인" : "참석 가능";

  const size = compact ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-[12px]";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`relative ${size} rounded-full flex items-center justify-center font-bold text-white ${a.state === "absent" ? "opacity-40" : ""}`}
        style={{
          backgroundColor: a.color,
          ...(a.state === "prefer_not" ? { outline: "2px solid #fe9800", outlineOffset: "1px" } : {}),
        }}
        title={tooltip}
      >
        {a.avatar}
        {!a.verified && a.state !== "absent" && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-stone rounded-full border-[1.5px] border-white" />
        )}
      </div>
      {!compact && (
        <span className={`text-[9px] font-semibold leading-none ${
          a.state === "absent" ? "text-slate" :
          a.state === "prefer_not" ? "text-warning" :
          !a.verified ? "text-stone" : "text-transparent select-none"
        }`}>
          {a.state === "absent" ? "불참" : a.state === "prefer_not" ? "비선호" : !a.verified ? "미확인" : "·"}
        </span>
      )}
    </div>
  );
}

// ── 추천 카드 (1위 Featured) ──
function SlotCard({ slot, onConfirm }: {
  slot: ComputedSlot; onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[16px] p-6 bg-white shadow-card flex flex-col"
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-[18px] font-bold text-graphite tracking-tight">
            {slot.label.split("·")[0].trim()}
          </h3>
          <p className="text-[14px] font-semibold text-charcoal mt-0.5">
            {slot.label.split("·")[1]?.trim()}
          </p>
        </div>
        <span className="text-[13px] font-bold text-ink tabular-nums bg-mist px-2.5 py-1 rounded-full shrink-0 ml-3">{slot.matchScore}%</span>
      </div>

      <div className="flex items-end gap-2.5 mt-5 mb-5">
        {slot.attendeeStates.map((a) => <AttendeeAvatar key={a.id} a={a} />)}
      </div>

      {slot.tradeoff && slot.tradeoff !== "전원 참석 가능, 비선호 없음" && (
        <p className="text-[12px] text-slate mb-4 leading-relaxed">{slot.tradeoff}</p>
      )}

      <div className="mt-auto">
        <Button fullWidth size="md" onClick={onConfirm}>이 시간으로 승인 요청</Button>
      </div>
    </motion.div>
  );
}

// ── 미니 캘린더 피커 (연결된 바 형태 range) ──
const PICKER_MONTHS = [
  { year: 2026, month: 6 },
  { year: 2026, month: 7 },
  { year: 2026, month: 8 },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function MiniCalendarPicker({
  startDate,
  endDate,
  onSelect,
  onClose,
}: {
  startDate: string | null;
  endDate: string | null;
  onSelect: (start: string, end: string) => void;
  onClose: () => void;
}) {
  const [monthIdx, setMonthIdx] = useState(1);
  const [tempStart, setTempStart] = useState<string | null>(startDate);
  const [tempEnd, setTempEnd] = useState<string | null>(endDate);

  const current = PICKER_MONTHS[monthIdx];
  const daysInMonth = getDaysInMonth(current.year, current.month);
  const firstDay = getFirstDayOfWeek(current.year, current.month);

  const todayStr = new Date().toISOString().slice(0, 10);

  const toDateStr = (day: number) =>
    `${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isPast = (day: number) => toDateStr(day) < todayStr;

  const handleDayClick = (day: number) => {
    if (isPast(day)) return;
    const dateStr = toDateStr(day);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
    } else {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(tempStart);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!tempStart || !tempEnd) return false;
    const dateStr = toDateStr(day);
    return dateStr > tempStart && dateStr < tempEnd;
  };

  const isStart = (day: number) => toDateStr(day) === tempStart;
  const isEnd = (day: number) => toDateStr(day) === tempEnd;

  return (
    <div className="absolute top-full left-0 mt-2 z-30 bg-white rounded-[16px] shadow-modal p-5 w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthIdx((v) => Math.max(0, v - 1))}
          disabled={monthIdx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate hover:bg-mist disabled:opacity-30 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[14px] font-bold text-graphite tabular-nums">
          {current.year}년 {current.month}월
        </span>
        <button
          onClick={() => setMonthIdx((v) => Math.min(2, v + 1))}
          disabled={monthIdx === 2}
          className="w-7 h-7 flex items-center justify-center rounded-full text-slate hover:bg-mist disabled:opacity-30 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <span key={d} className="text-[12px] font-bold text-stone text-center py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const past = isPast(day);
          const inRange = !past && isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const selected = start || end;
          const hasRange = tempStart && tempEnd;

          // Connected bar: start gets right half bg, end gets left half bg, middle gets full bg
          let rangeBg = "";
          if (!past && hasRange) {
            if (start && !end) rangeBg = "bg-gradient-to-r from-transparent to-ink/10";
            else if (end && !start) rangeBg = "bg-gradient-to-l from-transparent to-ink/10";
            else if (inRange) rangeBg = "bg-ink/10";
            if (start && end) rangeBg = "";
          }

          return (
            <div key={day} className={`relative h-9 flex items-center justify-center ${rangeBg}`}>
              <button
                onClick={() => handleDayClick(day)}
                disabled={past}
                className={`relative z-10 w-9 h-9 text-[12px] font-semibold tabular-nums transition-colors duration-100 rounded-full ${
                  past
                    ? "text-stone/35 cursor-not-allowed"
                    : selected
                    ? "bg-ink text-white"
                    : "text-graphite hover:bg-mist"
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-mist">
        <span className="text-[12px] text-slate tabular-nums">
          {tempStart && tempEnd
            ? `${tempStart.slice(5)} ~ ${tempEnd.slice(5)}`
            : tempStart
            ? `${tempStart.slice(5)} ~ 종료일 선택`
            : "날짜를 선택하세요"}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="h-8 px-3 text-[12px] font-bold text-stone rounded-[8px] hover:bg-mist transition-colors">
            취소
          </button>
          <button
            onClick={() => {
              if (tempStart && tempEnd) {
                onSelect(tempStart, tempEnd);
                onClose();
              }
            }}
            disabled={!tempStart || !tempEnd}
            className="h-8 px-4 bg-ink text-white text-[12px] font-bold rounded-[8px] disabled:opacity-40 transition-colors"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Duration options ──
// ── 커스텀 드롭다운 ──
function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
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
        className={`w-full h-12 px-4 bg-paper rounded-[10px] text-[14px] text-left flex items-center justify-between transition-all ${
          open ? "ring-2 ring-ink/10 bg-white" : ""
        }`}
      >
        <span className="text-graphite font-medium">{selected?.label || "선택"}</span>
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
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors duration-100 flex items-center justify-between ${
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

const DURATION_OPTIONS = [
  { label: "30분", value: 30 },
  { label: "1시간", value: 60 },
  { label: "2시간", value: 120 },
  { label: "3시간", value: 180 },
];

export default function CreateMeetingPage() {
  const router = useRouter();
  const { addMeeting } = useMeetings();
  const [title, setTitle] = useState("스프린트 킥오프");
  const [duration, setDuration] = useState(60);
  const [dateStart, setDateStart] = useState<string | null>("2026-07-14");
  const [dateEnd, setDateEnd] = useState<string | null>("2026-07-18");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Record<string, "required" | "optional">>({
    a: "required", b: "required", c: "required", d: "optional", e: "optional", f: "required",
  });
  const [step, setStep] = useState<"input" | "recommend" | "confirmed">("input");
  const [confirmedSlot, setConfirmedSlot] = useState<ComputedSlot | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const selectedCount = Object.keys(selectedPeople).length;
  const requiredCount = Object.values(selectedPeople).filter((v) => v === "required").length;

  // 기준 주 시작일 (일~금 day 0~4 = 7/14~7/18)
  const WEEK_START_MS = new Date("2026-07-14").getTime();

  const recommendations = useMemo(() => {
    const people = PEOPLE.filter((p) => selectedPeople[p.id]).map((p) => ({
      id: p.id, name: p.name, attendance: selectedPeople[p.id],
    }));
    const all = computeRecommendations(people);

    if (!dateStart || !dateEnd) return all;

    const startDay = Math.round((new Date(dateStart).getTime() - WEEK_START_MS) / 86400000);
    const endDay   = Math.round((new Date(dateEnd).getTime()   - WEEK_START_MS) / 86400000);

    return all.filter((slot) => slot.day >= startDay && slot.day <= endDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeople, dateStart, dateEnd]);

  const safeIdx = Math.min(selectedSlotIdx, Math.max(0, recommendations.length - 1));
  const featuredSlot = recommendations[safeIdx];
  const otherSlots = recommendations.filter((_, i) => i !== safeIdx).slice(0, 5);

  const togglePerson = (id: string) => {
    setSelectedPeople((prev) => {
      if (prev[id]) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: "optional" };
    });
  };

  const setAttendance = (id: string, type: "required" | "optional") => {
    setSelectedPeople((prev) => ({ ...prev, [id]: type }));
  };

  const handleConfirm = (slot: ComputedSlot) => {
    const attendees = PEOPLE.filter((p) => selectedPeople[p.id]).map((p) => ({
      id: p.id, name: p.name, attendance: selectedPeople[p.id],
    }));
    const approvals: Record<string, "accepted" | "rejected" | "pending"> = {};
    attendees.forEach((a) => { approvals[a.id] = a.id === "f" ? "accepted" : "pending"; });

    const meeting: ConfirmedMeeting = {
      id: Date.now().toString(),
      title,
      day: slot.day,
      hour: slot.hour,
      label: slot.label,
      attendees,
      matchScore: slot.matchScore,
      confirmedAt: new Date().toISOString(),
      status: "pending",
      approvals,
    };
    addMeeting(meeting);
    setConfirmedSlot(slot);
    setStep("confirmed");
  };

  const dateLabel = dateStart && dateEnd
    ? `${dateStart.slice(5).replace("-", "/")} ~ ${dateEnd.slice(5).replace("-", "/")}`
    : "날짜 범위 선택";

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <h2 className="text-[18px] font-bold text-graphite">
              {step === "confirmed" ? "확정 완료" : "새 회의"}
            </h2>
          </div>
        </header>

        <div className="max-w-[1200px] mx-auto px-10 py-10">
          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === "input" && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <section className="bg-white rounded-[16px] shadow-card p-7 mb-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[12px] font-bold text-charcoal mb-2">제목</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        className="w-full h-12 px-4 bg-paper rounded-[10px] text-[14px] text-graphite placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-ink/10 focus:bg-white transition-all"
                        placeholder="회의 제목" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="relative">
                        <label className="block text-[12px] font-bold text-charcoal mb-2">소요 시간</label>
                        <CustomSelect
                          value={duration}
                          onChange={setDuration}
                          options={DURATION_OPTIONS}
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-[12px] font-bold text-charcoal mb-2">날짜</label>
                        <div className="relative">
                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="w-full h-12 px-4 pr-10 bg-paper rounded-[10px] text-[14px] text-graphite text-left tabular-nums hover:bg-mist transition-colors flex items-center"
                        >
                          <span className="flex-1">{dateLabel}</span>
                        </button>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <path d="M4 6l4 4 4-4" stroke="#8b95a1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        {showDatePicker && (
                          <MiniCalendarPicker
                            startDate={dateStart}
                            endDate={dateEnd}
                            onSelect={(s, e) => { setDateStart(s); setDateEnd(e); }}
                            onClose={() => setShowDatePicker(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 참석자 */}
                <section className="bg-white rounded-[16px] shadow-card mb-6">
                  <div className="px-7 py-5 border-b border-mist">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[12px] font-bold text-stone uppercase tracking-wider">참석자</h3>
                        <p className="text-[12px] text-slate mt-1 tabular-nums">{selectedCount}명 · 필수 {requiredCount} · 선택 {selectedCount - requiredCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-7 py-3 flex items-center gap-3 border-b border-mist">
                    <span className="w-5" />
                    <span className="w-9" />
                    <span className="flex-1 text-[12px] font-bold text-stone">이름</span>
                    <span className="w-[140px] text-[12px] font-bold text-stone text-center">참석 구분</span>
                  </div>

                  <div className="divide-y divide-mist">
                    {PEOPLE.map((person) => {
                      const isSelected = !!selectedPeople[person.id];
                      const attendance = selectedPeople[person.id];
                      return (
                        <div key={person.id}
                          className="flex items-center gap-3 px-7 py-4 transition-colors duration-150 cursor-pointer hover:bg-paper"
                          onClick={() => togglePerson(person.id)}>
                          <div className={`w-5 h-5 rounded-[8px] border-2 flex items-center justify-center transition-colors duration-150 shrink-0 ${
                            isSelected ? "bg-ink border-ink" : "border-silver"
                          }`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                            style={{ backgroundColor: person.color }}>{person.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-graphite">{person.name}</span>
                              <span className="text-[12px] text-slate">{person.role}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2 w-[140px] shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setAttendance(person.id, "required")}
                                className={`flex-1 h-8 rounded-[8px] text-[12px] font-bold transition-colors duration-150 ${
                                  attendance === "required"
                                    ? "bg-ink text-white"
                                    : "bg-mist text-stone hover:bg-silver"
                                }`}
                              >
                                필수
                              </button>
                              <button
                                onClick={() => setAttendance(person.id, "optional")}
                                className={`flex-1 h-8 rounded-[8px] text-[12px] font-bold transition-colors duration-150 ${
                                  attendance === "optional"
                                    ? "bg-ink text-white"
                                    : "bg-mist text-stone hover:bg-silver"
                                }`}
                              >
                                선택
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="flex flex-col items-end gap-2">
                  {selectedCount >= 2 && recommendations.length === 0 && (
                    <p className="text-[12px] text-error">
                      선택한 참석자들의 일정이 모두 겹쳐 가능한 시간대가 없어요. 필수 참석자를 줄이거나 선택 참석으로 변경해보세요.
                    </p>
                  )}
                  <Button size="lg" onClick={() => { setSelectedSlotIdx(0); setStep("recommend"); }} disabled={selectedCount < 2 || recommendations.length === 0}>
                    회의 시간 추천받기
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === "recommend" && (
              <motion.div key="recommend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!featuredSlot ? (
                  /* ── 빈 상태 ── */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-[16px] bg-mist flex items-center justify-center mb-5">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="3" y="5" width="22" height="20" rx="3" stroke="#d1d6db" strokeWidth="1.6" />
                        <path d="M3 12h22M9 2v5M19 2v5" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                        <path d="M10 17l8 0M14 14v6" stroke="#d1d6db" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h2 className="text-[20px] font-bold text-graphite mb-2">가능한 시간대를 찾지 못했어요</h2>
                    <p className="text-[14px] text-slate mb-1 leading-relaxed">필수 참석자의 일정이 겹쳐 모두 가능한 시간이 없어요.</p>
                    <p className="text-[13px] text-stone mb-8 leading-relaxed">일부 참석자를 선택 참석으로 바꾸거나<br />날짜 범위를 넓혀보세요.</p>
                    <Button size="lg" onClick={() => setStep("input")}>← 참석자 수정하기</Button>
                  </div>
                ) : (
                  /* ── 추천 결과 ── */
                  <>
                    <div className="mb-6">
                      <h2 className="text-[22px] font-bold text-graphite tracking-tight">
                        최적의 시간을 찾았어요
                      </h2>
                      <p className="text-[13px] text-stone mt-1">
                        {recommendations.length > 1 ? `${recommendations.length}개 후보 중 가장 좋은 시간이에요` : "가능한 시간이 1개예요"}
                      </p>
                    </div>

                    {/* 1위 Featured 카드 */}
                    <SlotCard slot={featuredSlot} onConfirm={() => handleConfirm(featuredSlot)} />

                    {/* 다른 시간 보기 */}
                    {otherSlots.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[12px] font-bold text-stone uppercase tracking-wider mb-3">다른 시간 보기</p>
                        <div className="space-y-2">
                          {otherSlots.map((slot) => {
                            const idx = recommendations.indexOf(slot);
                            return (
                              <button
                                key={`${slot.day}-${slot.hour}`}
                                onClick={() => setSelectedSlotIdx(idx)}
                                className="w-full bg-white rounded-[12px] shadow-card px-5 py-3.5 flex items-center gap-4 hover:shadow-card-hover transition-all text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-graphite">{slot.label.split("·")[0].trim()}</p>
                                  <p className="text-[12px] text-slate">{slot.label.split("·")[1]?.trim()}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {slot.attendeeStates.map((a) => <AttendeeAvatar key={a.id} a={a} compact />)}
                                </div>
                                <span className="text-[12px] font-bold text-stone tabular-nums shrink-0">{slot.matchScore}%</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 팀 가용성 히트맵 */}
                    <div className="mt-5">
                      <button
                        onClick={() => setShowHeatmap((v) => !v)}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-slate hover:text-graphite transition-colors mb-3"
                      >
                        팀 가용성 한눈에 보기
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform duration-200 ${showHeatmap ? "rotate-180" : ""}`}>
                          <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {showHeatmap && (
                        <div className="bg-white rounded-[16px] shadow-card p-5 overflow-x-auto">
                          {/* 히트맵 헤더 */}
                          <div className="grid grid-cols-[44px_repeat(5,1fr)] gap-1 mb-1 min-w-[360px]">
                            <div />
                            {["월", "화", "수", "목", "금"].map((d) => (
                              <div key={d} className="text-center text-[11px] font-bold text-stone">{d}</div>
                            ))}
                          </div>
                          {/* 히트맵 셀 */}
                          <div className="grid grid-cols-[44px_repeat(5,1fr)] gap-1 min-w-[360px]">
                            {[9,10,11,12,13,14,15,16,17,18].map((hour) => (
                              <>
                                <div key={`lbl-${hour}`} className="text-[10px] text-stone text-right pr-2 flex items-center justify-end tabular-nums">{hour}:00</div>
                                {[0,1,2,3,4].map((day) => {
                                  const slot = recommendations.find((s) => s.day === day && s.hour === hour);
                                  const isSelected = slot && recommendations.indexOf(slot) === safeIdx;
                                  if (!slot) {
                                    return <div key={day} className="h-7 rounded-[4px] bg-mist" title="필수 참석자 불가" />;
                                  }
                                  const ratio = slot.totalAttendees / slot.maxAttendees;
                                  const bg = ratio === 1 ? "bg-[#3182F6]" : ratio >= 0.7 ? "bg-[#3182F6]/55" : "bg-[#3182F6]/25";
                                  return (
                                    <button
                                      key={day}
                                      onClick={() => setSelectedSlotIdx(recommendations.indexOf(slot))}
                                      title={`${slot.totalAttendees}/${slot.maxAttendees}명 가능${slot.preferNotCount > 0 ? ` · 비선호 ${slot.preferNotCount}명` : ""}`}
                                      className={`relative h-7 rounded-[4px] ${bg} transition-all hover:opacity-80 ${isSelected ? "ring-2 ring-[#3182F6] ring-offset-1" : ""}`}
                                    >
                                      {slot.preferNotCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-warning" />
                                      )}
                                    </button>
                                  );
                                })}
                              </>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-mist">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate"><span className="w-3 h-3 rounded-sm bg-[#3182F6]" />전원 참석</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate"><span className="w-3 h-3 rounded-sm bg-[#3182F6]/55" />일부 참석</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate"><span className="w-3 h-3 rounded-sm bg-mist border border-silver" />불가</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate"><span className="w-1.5 h-1.5 rounded-full bg-warning" />비선호</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={() => setStep("input")}
                      className="w-full mt-5 py-3 text-[13px] font-semibold text-stone hover:text-charcoal transition-colors duration-150">
                      ← 참석자 수정
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === "confirmed" && confirmedSlot && (
              <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-[480px] mx-auto text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-success/8 flex items-center justify-center mx-auto mb-5">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="16" stroke="#03b26c" strokeWidth="2.5" />
                      <motion.path d="M13 20l4 4 10-10" stroke="#03b26c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
                    </svg>
                  </motion.div>
                  <h2 className="text-[22px] font-bold text-graphite mb-2">승인 요청을 보냈어요</h2>
                  <p className="text-[14px] text-slate mb-1">{title}</p>
                  <p className="text-[17px] font-bold text-graphite">{confirmedSlot.label}</p>
                  <p className="text-[12px] text-slate mt-2 mb-6">필수 참석자 전원 수락 시 자동 확정</p>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" fullWidth onClick={() => router.push("/")}>
                      대시보드
                    </Button>
                    <Button size="lg" fullWidth onClick={() => {
                      setStep("input"); setTitle(""); setConfirmedSlot(null);
                    }}>
                      다음 회의 만들기
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </AppShell>
  );
}
