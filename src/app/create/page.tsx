"use client";

// [설계 의도]: 장식적인 dot UI와 서술형 문구를 걷어내어 정보 밀도를 극대화하고,
// 드롭다운 아이콘 및 캘린더 피커의 인터랙션을 일관되게 정제하여 정품 B2B SaaS의 시각적 완성도를 부여한다.

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell, Button } from "@/components/ui";
import { PEOPLE, type Person } from "@/lib/data";
import { computeRecommendations, useMeetings, type ComputedSlot, type ConfirmedMeeting } from "@/lib/store";

// ── 매칭률 원형 ──
function MatchCircle({ score, grade, size = 64 }: { score: number; grade: "green" | "yellow"; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = grade === "green" ? "#03b26c" : "#fe9800";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e8eb" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-graphite tabular-nums">{score}</span>
      </div>
    </div>
  );
}

// ── 추천 카드 ──
function SlotCard({ slot, isTop, onConfirm, rank }: {
  slot: ComputedSlot; isTop?: boolean; onConfirm: () => void; rank: number;
}) {
  const grade = slot.preferNotCount === 0 ? "green" : "yellow";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
      className={`rounded-[16px] p-7 transition-all ${isTop
        ? "bg-white shadow-card-hover"
        : "bg-white shadow-card hover:shadow-card-hover"
      }`}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          {isTop && (
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                grade === "green" ? "text-success bg-success/10" : "text-warning bg-warning/10"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${grade === "green" ? "bg-success" : "bg-warning"}`} />
                {grade === "green" ? "최적" : "양해 필요"}
              </span>
              <span className="text-[12px] font-bold text-stone">TOP PICK</span>
            </div>
          )}
          <h3 className={`${isTop ? "text-[22px]" : "text-[17px]"} font-bold text-graphite tracking-tight`}>
            {slot.label.split("·")[0].trim()}
          </h3>
          <p className={`${isTop ? "text-[15px]" : "text-[13px]"} font-bold text-charcoal mt-1`}>
            {slot.label.split("·")[1]?.trim()}
          </p>
        </div>
        <MatchCircle score={slot.matchScore} grade={grade} size={isTop ? 72 : 56} />
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#03b26c" strokeWidth="1.4" />
            <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#03b26c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-medium text-charcoal">필수 참석자 전원 가능</span>
        </div>
        {slot.preferNotCount === 0 ? (
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#03b26c" strokeWidth="1.4" />
              <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#03b26c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[12px] font-medium text-charcoal">조정 충돌 없음</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#fe9800" strokeWidth="1.4" />
              <path d="M8 6v2.5M8 10.5h.01" stroke="#fe9800" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] font-medium text-warning">조정 {slot.preferNotCount}건</span>
          </div>
        )}
      </div>

      <div className="bg-paper rounded-[10px] px-5 py-3.5 mb-5">
        <p className="text-[12px] text-slate leading-relaxed">{slot.tradeoff}</p>
      </div>

      <div className="flex items-center gap-2 mb-6 text-[12px] text-stone tabular-nums">
        참석 {slot.totalAttendees}/{slot.maxAttendees}명
        {slot.absentees.length > 0 && ` · ${slot.absentees.join(", ")} 불참`}
      </div>

      {isTop ? (
        <Button fullWidth size="lg" onClick={onConfirm}>이 시간으로 승인 요청</Button>
      ) : (
        <Button fullWidth size="md" variant="secondary" onClick={onConfirm}>이 시간 선택</Button>
      )}
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

  const toDateStr = (day: number) =>
    `${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayClick = (day: number) => {
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
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const selected = start || end;
          const hasRange = tempStart && tempEnd;

          // Connected bar: start gets right half bg, end gets left half bg, middle gets full bg
          let rangeBg = "";
          if (hasRange) {
            if (start && !end) rangeBg = "bg-gradient-to-r from-transparent to-ink/10";
            else if (end && !start) rangeBg = "bg-gradient-to-l from-transparent to-ink/10";
            else if (inRange) rangeBg = "bg-ink/10";
            // When start === end, no range bg
            if (start && end) rangeBg = "";
          }

          return (
            <div key={day} className={`relative h-9 flex items-center justify-center ${rangeBg}`}>
              <button
                onClick={() => handleDayClick(day)}
                className={`relative z-10 w-9 h-9 text-[12px] font-semibold tabular-nums transition-colors duration-100 rounded-full ${
                  selected
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
        <span className="text-[12px] text-stone tabular-nums">
          {tempStart && tempEnd
            ? `${tempStart.slice(5)} ~ ${tempEnd.slice(5)}`
            : tempStart
            ? `${tempStart.slice(5)} ~ 종료일 선택`
            : "날짜를 선택하세요"}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="h-8 px-3 text-[12px] font-bold text-stone rounded-full hover:bg-mist transition-colors">
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
            className="h-8 px-4 bg-ink text-white text-[12px] font-bold rounded-full disabled:opacity-40 transition-colors"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Duration options ──
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

  const selectedCount = Object.keys(selectedPeople).length;
  const requiredCount = Object.values(selectedPeople).filter((v) => v === "required").length;

  const recommendations = useMemo(() => {
    const people = PEOPLE.filter((p) => selectedPeople[p.id]).map((p) => ({
      id: p.id, name: p.name, attendance: selectedPeople[p.id],
    }));
    return computeRecommendations(people);
  }, [selectedPeople]);

  const topSlots = recommendations.slice(0, 3);

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
    ? `${dateStart.slice(5).replace("-", "/")} – ${dateEnd.slice(5).replace("-", "/")}`
    : "날짜 범위 선택";

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-10">
            <h2 className="text-[18px] font-bold text-graphite">
              {step === "input" ? "새 회의" : step === "recommend" ? "최적 시간 발견" : "확정 완료"}
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
                        <div className="relative">
                          <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-12 px-4 pr-10 bg-paper rounded-[10px] text-[14px] text-graphite text-left focus:outline-none focus:ring-2 focus:ring-ink/10 transition-all cursor-pointer appearance-none"
                          >
                            {DURATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <path d="M4 6l4 4 4-4" stroke="#8b95a1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-[12px] font-bold text-charcoal mb-2">날짜</label>
                        <button
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="w-full h-12 px-4 pr-10 bg-paper rounded-[10px] text-[14px] text-graphite text-left tabular-nums hover:bg-mist transition-colors flex items-center"
                        >
                          <span className="flex-1">{dateLabel}</span>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2">
                            <path d="M4 6l4 4 4-4" stroke="#8b95a1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
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
                        <p className="text-[12px] text-stone mt-1 tabular-nums">{selectedCount}명 · 필수 {requiredCount} · 선택 {selectedCount - requiredCount}</p>
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
                          <div className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors duration-150 shrink-0 ${
                            isSelected ? "bg-ink border-ink" : "border-silver"
                          }`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                            style={{ backgroundColor: person.color }}>{person.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-graphite">{person.name}</span>
                              <span className="text-[12px] text-stone">{person.role}</span>
                              {person.id === "e" && isSelected && (
                                <span className="text-[12px] text-warning bg-warning/10 px-2 py-0.5 rounded-full font-bold">이관 데이터</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2 w-[140px] shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setAttendance(person.id, "required")}
                                className={`flex-1 h-8 rounded-full text-[12px] font-bold transition-colors duration-150 ${
                                  attendance === "required"
                                    ? "bg-ink text-white"
                                    : "bg-mist text-stone hover:bg-silver"
                                }`}
                              >
                                필수
                              </button>
                              <button
                                onClick={() => setAttendance(person.id, "optional")}
                                className={`flex-1 h-8 rounded-full text-[12px] font-bold transition-colors duration-150 ${
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

                <div className="flex justify-end">
                  <Button size="lg" onClick={() => setStep("recommend")} disabled={selectedCount < 2 || recommendations.length === 0}>
                    회의 시간 추천받기
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === "recommend" && (
              <motion.div key="recommend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-10">
                  <p className="text-[12px] font-bold text-stone mb-2 tabular-nums">{selectedCount}명의 조건을 분석했어요</p>
                  <h2 className="text-[24px] font-bold text-graphite tracking-tight">
                    최적의 시간 <span className="text-ink font-black">{topSlots.length}개</span>를 찾았어요
                  </h2>
                  <p className="text-[13px] text-stone mt-2 tabular-nums">
                    {recommendations.length}개 가능 슬롯 중 상위 매칭률 순
                  </p>
                </div>

                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="text-[12px] font-medium text-slate">최적</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <span className="text-[12px] font-medium text-slate">양해 필요</span>
                  </div>
                </div>

                <div className="space-y-5">
                  {topSlots.map((slot, i) => (
                    <SlotCard key={`${slot.day}-${slot.hour}`} slot={slot} rank={i} isTop={i === 0}
                      onConfirm={() => handleConfirm(slot)} />
                  ))}
                </div>

                <button onClick={() => setStep("input")}
                  className="w-full mt-5 py-3 text-[13px] font-semibold text-stone hover:text-charcoal transition-colors duration-150">
                  ← 참석자 수정
                </button>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === "confirmed" && confirmedSlot && (
              <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center mb-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-success/8 flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="16" stroke="#03b26c" strokeWidth="2.5" />
                      <motion.path d="M13 20l4 4 10-10" stroke="#03b26c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
                    </svg>
                  </motion.div>
                  <h2 className="text-[24px] font-bold text-graphite mb-2">승인 요청을 보냈어요</h2>
                  <p className="text-[14px] text-slate mb-1">{title}</p>
                  <p className="text-[17px] font-bold text-graphite">{confirmedSlot.label}</p>
                  <p className="text-[12px] text-stone mt-2 tabular-nums">매칭률 {confirmedSlot.matchScore}% · 참석자 전원 수락 시 자동 확정</p>
                </div>

                <div className="bg-white rounded-[16px] shadow-card p-7 mb-6">
                  <h3 className="text-[12px] font-bold text-stone uppercase tracking-wider mb-5">진행 상태</h3>
                  <div className="space-y-3.5">
                    {[
                      "참석자 전원에게 승인 요청 알림 발송",
                      "알림 페이지에서 수락/거절 대기 중",
                      "전원 수락 시 → 시간표 자동 불가 반영",
                      "다음 회의부터 갱신된 시간표로 추천",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                          <circle cx="8" cy="8" r="6" stroke="#03b26c" strokeWidth="1.4" />
                          <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#03b26c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[13px] text-slate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-graphite rounded-[16px] p-7 text-white mb-6">
                  <p className="text-[12px] font-bold text-white/60 uppercase tracking-wider mb-2">비동기 승인 → 플라이휠</p>
                  <p className="text-[14px] font-semibold leading-[1.7]">
                    알림 페이지에서 참석자 시점으로 수락해보세요.<br />
                    <span className="text-white/50">전원 수락 시 슬롯 자동 불가 처리 →</span>{" "}
                    <span className="text-white font-bold">다음 회의는 다른 시간이 추천됩니다</span>
                  </p>
                </div>

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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </AppShell>
  );
}
