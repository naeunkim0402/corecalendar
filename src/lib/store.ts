"use client";

// [설계 의도]: 외부 캘린더 의존성을 끊고 플랫폼 내에서 모든 일정 등록, 회의 생성,
// 정성 맥락(선호/불가)이 유기적으로 순환하도록 올인원 아키텍처로 내재화한다.
// localStorage를 단일 진실 공급원(Single Source of Truth)으로 사용하며,
// 확정된 회의는 참석자 시간표에 즉시 피드백 루프를 형성한다.

import { useState, useEffect, useCallback } from "react";
import { type SlotState, type AttendanceType, getPersonTimetable, HOURS, isBusinessHour } from "./data";

// ── localStorage helpers ──
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── 시간표 훅 ──
export function useTimetable(personId: string) {
  const key = `timetable_${personId}`;
  const [timetable, setTimetable] = useState<Record<string, SlotState>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = load<Record<string, SlotState> | null>(key, null);
    setTimetable(saved ?? getPersonTimetable(personId));
    setLoaded(true);
  }, [key, personId]);

  const update = useCallback((newTable: Record<string, SlotState>) => {
    setTimetable(newTable);
    save(key, newTable);
  }, [key]);

  const reset = useCallback(() => {
    const initial = getPersonTimetable(personId);
    setTimetable(initial);
    save(key, initial);
  }, [key, personId]);

  return { timetable, update, reset, loaded };
}

// [설계 의도]: 추천 1개를 주최자가 픽하여 비동기 승인 요청을 보내고, 전원 수락 시
// 플랫폼 내에 타임블록이 자동 점유되는 구조를 통해 메신저 핑퐁 없는 최종 의사결정 안전망을 완성한다.

// ── 회의 (비동기 승인 구조) ──
export type MeetingStatus = "pending" | "approved" | "rejected";

export interface ConfirmedMeeting {
  id: string;
  title: string;
  day: number;
  hour: number;
  label: string;
  attendees: { id: string; name: string; attendance: AttendanceType }[];
  matchScore: number;
  confirmedAt: string;
  status: MeetingStatus;
  approvals: Record<string, "accepted" | "rejected" | "pending">;
}

// 플라이휠: approved 전환 시 참석자 시간표 자동 불가 반영
function triggerFlywheel(meeting: ConfirmedMeeting) {
  meeting.attendees.forEach((a) => {
    const key = `timetable_${a.id}`;
    const saved = load<Record<string, SlotState> | null>(key, null);
    const table = saved ?? getPersonTimetable(a.id);
    table[`${meeting.day}-${meeting.hour}`] = "unavailable";
    save(key, table);
  });
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<ConfirmedMeeting[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMeetings(load<ConfirmedMeeting[]>("meetings", []));
    setLoaded(true);
  }, []);

  const addMeeting = useCallback((meeting: ConfirmedMeeting) => {
    setMeetings((prev) => {
      const next = [...prev, meeting];
      save("meetings", next);
      // pending 상태로 추가 — 플라이휠은 전원 수락 시에만 트리거
      return next;
    });
  }, []);

  const respondToMeeting = useCallback((meetingId: string, personId: string, response: "accepted" | "rejected") => {
    setMeetings((prev) => {
      const next = prev.map((m) => {
        if (m.id !== meetingId || m.status !== "pending") return m;
        const updated = { ...m, approvals: { ...m.approvals, [personId]: response } };

        // 거절 시 즉시 rejected
        if (response === "rejected") {
          updated.status = "rejected";
          return updated;
        }

        // 전원 수락 체크
        const allAccepted = updated.attendees.every((a) => updated.approvals[a.id] === "accepted");
        if (allAccepted) {
          updated.status = "approved";
          triggerFlywheel(updated);
        }

        return updated;
      });
      save("meetings", next);
      return next;
    });
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings((prev) => {
      const next = prev.filter((m) => m.id !== id);
      save("meetings", next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setMeetings([]);
    save("meetings", []);
  }, []);

  return { meetings, addMeeting, respondToMeeting, deleteMeeting, clearAll, loaded };
}

// ── 추천 로직 (실시간 계산) ──
export interface ComputedSlot {
  day: number;
  hour: number;
  label: string;
  requiredAllAvailable: boolean;
  preferNotCount: number;
  totalAttendees: number;
  maxAttendees: number;
  tradeoff: string;
  matchScore: number;
  absentees: string[];
  preferNotNames: string[];
}

const DAY_LABELS = ["월", "화", "수", "목", "금"];

export function computeRecommendations(
  selectedPeople: { id: string; name: string; attendance: AttendanceType }[],
): ComputedSlot[] {
  const timetables: Record<string, Record<string, SlotState>> = {};
  selectedPeople.forEach((p) => {
    const key = `timetable_${p.id}`;
    const saved = load<Record<string, SlotState> | null>(key, null);
    timetables[p.id] = saved ?? getPersonTimetable(p.id);
  });

  const required = selectedPeople.filter((p) => p.attendance === "required");
  const optional = selectedPeople.filter((p) => p.attendance === "optional");
  const maxAttendees = selectedPeople.length;

  const slots: ComputedSlot[] = [];

  for (let day = 0; day < 5; day++) {
    for (const hour of HOURS) {
      // 업무 시간 외는 추천 대상에서 제외
      if (!isBusinessHour(hour)) continue;

      const slotKey = `${day}-${hour}`;

      // 필수 참석자 체크
      let requiredAllAvailable = true;
      let preferNotCount = 0;
      let totalAttendees = 0;
      const absentees: string[] = [];
      const preferNotNames: string[] = [];

      for (const p of required) {
        const state = timetables[p.id]?.[slotKey] || "available";
        if (state === "unavailable") {
          requiredAllAvailable = false;
          break;
        }
        if (state === "prefer_not") {
          preferNotCount++;
          preferNotNames.push(p.name);
        }
        totalAttendees++;
      }

      if (!requiredAllAvailable) continue;

      for (const p of optional) {
        const state = timetables[p.id]?.[slotKey] || "available";
        if (state === "unavailable") {
          absentees.push(p.name);
          continue;
        }
        if (state === "prefer_not") {
          preferNotCount++;
          preferNotNames.push(p.name);
        }
        totalAttendees++;
      }

      // 매칭률 계산
      const attendeeScore = (totalAttendees / maxAttendees) * 60;
      const preferScore = Math.max(0, 30 - preferNotCount * 15);
      const requiredScore = 10;
      const matchScore = Math.round(attendeeScore + preferScore + requiredScore);

      // 트레이드오프 텍스트
      let tradeoff = "";
      if (absentees.length > 0 && preferNotNames.length > 0) {
        tradeoff = `${absentees.join(", ")} 불참 · ${preferNotNames.join(", ")} 비선호`;
      } else if (absentees.length > 0) {
        tradeoff = `${absentees.join(", ")} 불참`;
      } else if (preferNotNames.length > 0) {
        tradeoff = `${preferNotNames.join(", ")}이 피하고 싶은 시간`;
      } else {
        tradeoff = "전원 참석 가능, 비선호 없음";
      }

      const dateNum = 14 + day;
      const label = `${DAY_LABELS[day]}요일 7/${dateNum} · ${hour}:00 – ${hour + 1}:00`;

      slots.push({
        day, hour, label,
        requiredAllAvailable, preferNotCount,
        totalAttendees, maxAttendees,
        tradeoff, matchScore,
        absentees, preferNotNames,
      });
    }
  }

  // 정렬: 매칭률 내림차순 → 비선호 최소 → 참석 인원 최대 → 이른 시간
  slots.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.preferNotCount !== b.preferNotCount) return a.preferNotCount - b.preferNotCount;
    if (b.totalAttendees !== a.totalAttendees) return b.totalAttendees - a.totalAttendees;
    if (a.day !== b.day) return a.day - b.day;
    return a.hour - b.hour;
  });

  return slots;
}
