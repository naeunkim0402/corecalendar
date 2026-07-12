// ── 페르소나 & 시뮬레이션 데이터 ──
// [설계 의도]: 유연근무제 및 글로벌 협업 환경을 지원하기 위해 24시간 전체 타임라인으로 확장하되,
// 스크롤 위계와 채도 조절을 통해 시각적 소음을 통제하고 주차 이동 내비게이션을 통해 탐색 자유도를 보장한다.

export type SlotState = "available" | "unavailable" | "prefer_not";
export type AttendanceType = "required" | "optional";
// [설계 의도]: 외부 캘린더 의존성을 끊고 플랫폼 내에서 모든 일정 등록, 회의 생성,
// 정성 맥락(선호/불가)이 유기적으로 순환하도록 올인원 아키텍처로 내재화한다.
export type SyncStatus = "migrated" | "active_internal";

export interface ConstraintTag {
  text: string;
  type: "critical" | "warning" | "neutral";
}

export interface Person {
  id: string;
  name: string;
  role: string;
  attendance: AttendanceType;
  avatar: string;
  color: string;
  description: string;
  syncStatus: SyncStatus;
  tags: ConstraintTag[];
}

export interface TimeSlot {
  day: number; // 0=월 ~ 4=금
  hour: number; // 0~23
}

export const SYNC_STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; dot: string }> = {
  active_internal: { label: "Corecalendar 활성화 중", color: "text-[#03b26c]", dot: "bg-[#03b26c]" },
  migrated: { label: "외부 캘린더 이관 완료 (내부 미세팅)", color: "text-[#fe9800]", dot: "bg-[#fe9800]" },
};

export const PEOPLE: Person[] = [
  {
    id: "a", name: "김지원", role: "팀장", attendance: "required",
    avatar: "지", color: "#3182F6",
    description: "월 오전 경영진 보고 등 일정 최다. 가장 빡빡한 필수 참석자.",
    syncStatus: "active_internal",
    tags: [
      { text: "월 오전 불가", type: "critical" },
      { text: "일정 밀도 높음", type: "warning" },
      { text: "필수 참석", type: "neutral" },
    ],
  },
  {
    id: "b", name: "이서연", role: "디자이너", attendance: "required",
    avatar: "서", color: "#34C759",
    description: "매일 13-14시 점심 직후 기피. 집중 시간 보호.",
    syncStatus: "active_internal",
    tags: [
      { text: "점심 직후 기피", type: "warning" },
      { text: "13-14시 조정 고정", type: "warning" },
      { text: "필수 참석", type: "neutral" },
    ],
  },
  {
    id: "c", name: "박민준", role: "세일즈 엔지니어", attendance: "required",
    avatar: "민", color: "#FF9F0A",
    description: "화·목 외근. 목요일은 캘린더에 없어 본인이 직접 등록.",
    syncStatus: "active_internal",
    tags: [
      { text: "화 외근", type: "critical" },
      { text: "목 외근", type: "critical" },
      { text: "이동 시간 버퍼 필요", type: "warning" },
    ],
  },
  {
    id: "d", name: "최하은", role: "마케터", attendance: "optional",
    avatar: "하", color: "#AF52DE",
    description: "수 오전 워크숍. 금 오후 외부 교육.",
    syncStatus: "active_internal",
    tags: [
      { text: "수 10-12 워크숍", type: "critical" },
      { text: "금 오후 외부 교육", type: "warning" },
      { text: "선택 참석", type: "neutral" },
    ],
  },
  {
    id: "e", name: "정우진", role: "데이터 분석가", attendance: "optional",
    avatar: "우", color: "#FF3B30",
    description: "외부 캘린더 이관만 완료. 내부 선호/불가 미세팅.",
    syncStatus: "migrated",
    tags: [
      { text: "내부 세팅 미완료", type: "critical" },
      { text: "이관 데이터만 반영", type: "warning" },
      { text: "선택 참석", type: "neutral" },
    ],
  },
  {
    id: "f", name: "김나은", role: "프로덕트 디자이너", attendance: "required",
    avatar: "나", color: "#007AFF",
    description: "본인도 참석.",
    syncStatus: "active_internal",
    tags: [
      { text: "필수 참석", type: "neutral" },
    ],
  },
];

export const DAYS = ["월", "화", "수", "목", "금"];
export const FULL_DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일"];
// [설계 의도]: 24시간 전체 슬롯을 연산 대상으로 포함하여 유연근무·글로벌 협업 시나리오를 지원한다.
export const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// [설계 의도]: 9to6 외 시간은 토글 인터랙션을 배제한 채 고정 불가로 처리하여
// 제품의 비즈니스 골격을 명확히 하고, 시간 라벨을 그리드 시작선에 정렬하여 타임블록 가독성을 극대화한다.

// 코어 업무 시간 (9:00–18:59 = 10시간 블록)
export const CORE_HOURS_START = 9;
export const CORE_HOURS_END = 18;

// 업무 시간 판별 — 9~18시만 인터랙션 허용, 그 외는 고정 불가
export function isBusinessHour(h: number): boolean {
  return h >= CORE_HOURS_START && h <= CORE_HOURS_END;
}

// 시간표 초기 상태: 업무 시간 외(0–8시, 19–23시)는 무조건 unavailable 고정.
// 업무 시간(9–18시) 내에서만 available/prefer_not/unavailable 토글 가능.
// 개인별 제약 조건은 switch 문에서 오버라이드.
export function getPersonTimetable(personId: string): Record<string, SlotState> {
  const table: Record<string, SlotState> = {};

  for (let d = 0; d < 5; d++) {
    for (const h of HOURS) {
      // 업무 시간 외는 고정 불가 (UI에서 클릭 차단)
      table[`${d}-${h}`] = isBusinessHour(h) ? "available" : "unavailable";
    }
  }

  switch (personId) {
    case "a": // 김지원 — 월 오전 경영진 보고, 기타 일정 많음
      table["0-9"] = "unavailable";
      table["0-10"] = "unavailable";
      table["0-11"] = "unavailable";
      table["0-13"] = "unavailable";
      table["0-14"] = "unavailable";
      table["1-14"] = "unavailable";
      table["1-15"] = "unavailable";
      table["3-9"] = "unavailable";
      table["3-10"] = "unavailable";
      table["4-14"] = "unavailable";
      break;
    case "b": // 이서연 — 매일 13-14시 피하고 싶음
      for (let d = 0; d < 5; d++) {
        table[`${d}-13`] = "prefer_not";
      }
      table["0-9"] = "unavailable";
      table["0-10"] = "unavailable";
      table["1-16"] = "unavailable";
      table["3-15"] = "unavailable";
      table["3-16"] = "unavailable";
      break;
    case "c": // 박민준 — 화 외근(캘린더), 목 외근(직접 칠함)
      for (const h of HOURS) {
        table[`1-${h}`] = "unavailable"; // 화요일 전체
        table[`3-${h}`] = "unavailable"; // 목요일 전체
      }
      table["0-9"] = "unavailable";
      table["0-10"] = "unavailable";
      table["4-13"] = "unavailable";
      break;
    case "d": // 최하은 — 수 10-12 워크숍, 금 오후 외부 교육
      table["2-10"] = "unavailable";
      table["2-11"] = "unavailable";
      table["4-15"] = "unavailable";
      table["4-16"] = "unavailable";
      table["4-17"] = "unavailable";
      table["0-9"] = "unavailable";
      table["0-10"] = "unavailable";
      break;
    case "e": // 정우진 — 캘린더 기준 (본인 미확인)
      table["0-9"] = "unavailable";
      table["0-11"] = "unavailable";
      table["2-14"] = "unavailable";
      table["2-15"] = "unavailable";
      table["4-9"] = "unavailable";
      table["4-10"] = "unavailable";
      break;
    case "f": // 김나은
      table["0-9"] = "unavailable";
      table["0-10"] = "unavailable";
      table["0-14"] = "unavailable";
      table["1-9"] = "unavailable";
      table["3-11"] = "unavailable";
      table["3-14"] = "unavailable";
      table["4-16"] = "unavailable";
      break;
  }

  return table;
}

// ── 추천 결과 (시뮬레이션) ──
export interface Recommendation {
  day: number;
  hour: number;
  label: string;
  requiredAllAvailable: boolean;
  preferNotCount: number;
  totalAttendees: number;
  maxAttendees: number;
  tradeoff: string;
  rank: number;
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    day: 2, hour: 10, label: "수요일 7/16 · 10:00 – 11:00",
    requiredAllAvailable: true, preferNotCount: 0,
    totalAttendees: 5, maxAttendees: 6,
    tradeoff: "최하은님(선택)은 워크숍으로 불참",
    rank: 1,
  },
  {
    day: 2, hour: 11, label: "수요일 7/16 · 11:00 – 12:00",
    requiredAllAvailable: true, preferNotCount: 0,
    totalAttendees: 5, maxAttendees: 6,
    tradeoff: "최하은님(선택)은 워크숍으로 불참",
    rank: 2,
  },
  {
    day: 2, hour: 13, label: "수요일 7/16 · 13:00 – 14:00",
    requiredAllAvailable: true, preferNotCount: 1,
    totalAttendees: 6, maxAttendees: 6,
    tradeoff: "전원 참석 가능하나 이서연님이 피하고 싶은 시간",
    rank: 3,
  },
  {
    day: 4, hour: 10, label: "금요일 7/18 · 10:00 – 11:00",
    requiredAllAvailable: true, preferNotCount: 0,
    totalAttendees: 5, maxAttendees: 6,
    tradeoff: "정우진님(선택) 불참 — 고객 콜",
    rank: 4,
  },
  {
    day: 4, hour: 15, label: "금요일 7/18 · 15:00 – 16:00",
    requiredAllAvailable: true, preferNotCount: 0,
    totalAttendees: 5, maxAttendees: 6,
    tradeoff: "최하은님(선택) 불참 — 외부 교육",
    rank: 5,
  },
];
