# Corecalendar — 진행 현황

> 토스 프로덕트 디자이너 챌린지 2026 제출용
> 마지막 업데이트: 2026-07-13

---

## 프로젝트 개요

- **프로덕트명**: Corecalendar
- **슬로건**: 조율 없는 조율 — 올인원 비즈니스 스케줄링
- **목적**: 팀 일정 조율, 회의 생성, 참석자 승인까지 한 플랫폼에서
- **배포 URL**: https://schedule-app-livid-one.vercel.app

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline` 토큰 시스템) |
| Animation | Framer Motion |
| State | localStorage (단일 진실 공급원) |
| Font | Pretendard Variable (CDN) |
| Analytics | Vercel Analytics |
| Deployment | Vercel (GitHub 연동 자동 배포) |

---

## 디자인 시스템

### 컬러 토큰 (globals.css)
```
--color-ink: #101010        (주요 텍스트, primary)
--color-graphite: #191f28   (기본 배경·텍스트)
--color-charcoal: #333d4b   (secondary)
--color-slate: #6b7684      (tertiary, WCAG AA 보장)
--color-stone: #8b95a1      (hint)
--color-silver: #e5e8eb     (border, muted)
--color-mist: #f2f4f6       (subtle bg)
--color-paper: #f9fafb      (page bg)
--color-success: #03b26c
--color-warning: #fe9800
--color-error: #f04452
```

### 레이아웃
- 3컬럼 그리드: `grid grid-cols-[240px_1fr_300px] h-screen overflow-hidden`
- 좌: 사이드바(240px), 중: 메인 컨텐츠, 우: ReviewerGuidePanel(300px)

---

## 페이지 구조

### 1. 대시보드 (`/`)
- 웰컴 모달: "토스 프로덕트 디자이너 챌린지 2026" (sessionStorage, 세션당 1회)
- **오늘 스케줄 섹션**: 예정 회의 섹션 위에 위치
  - 당일(day=0) 확정 회의 + `internal_schedules`(personId "f") 병합
  - 연속된 같은 groupId 블록은 하나의 타임라인 항목으로 그루핑
  - 시작 시각 오름차순 정렬, 시간·제목·타입 뱃지 표시
  - 빈 상태: "오늘은 비어 있어요"
- 예정 회의 섹션: 거절된 회의 미표시, `approved` 상태만 노출
- [일정 등록] 버튼 → `/timetable?add=1` (모달 자동 오픈)
- 온보딩 모달: 완료 시 `/timetable`로 라우팅
- 모달 공통: `pb-6` 하단 패딩, X버튼 `text-stone hover:text-graphite`

### 2. 주간 캘린더 (`/timetable`)
- **헤더**: "내 캘린더" 라벨 + 우측 팀원 드롭다운(커스텀 UI, 아바타·이름·직책·체크마크)
- **3개 액션 버튼** (bg-silver, 회색):
  - 불가능한 시간 선택하기
  - 비선호 시간 선택하기
  - 외부 캘린더 연동하기
- **편집 모드**: 버튼 클릭 시 배경 blur 오버레이 + 안내 배너 + [저장] 버튼
  - `editMode: null | "unavailable" | "prefer_not"`
  - 반대 상태 셀: `opacity-30 cursor-not-allowed` (비활성)
  - 드래그 페인트 지원
  - 일정 슬롯이 있는 셀은 페인트 차단 (`if (slotData[key]) return`)

#### 그리드 스타일 — 여백 분리형 듀오 컬러 블록 UI
- 외부 컨테이너: 흰색 카드 (`bg-white rounded-2xl shadow-sm`)
- 셀 간격: `gap-y-[3px] gap-x-[4px]`, 각 셀 `rounded-[6px]`
- 셀 상태 색상:
  - `available`: `bg-[#f4f5f7]` (기본 회색)
  - `unavailable`: `bg-[#fff0f1] text-[#f04452]` 라벨 "불가" (중앙 정렬)
  - `prefer_not`: `bg-[#fff5eb] text-[#ff9800]` 라벨 "비선호" (중앙 정렬)
- 시간 라벨: `absolute -top-[7px]` (행 경계선 기준 정렬)
- 00:00 행: 렌더 유지, 라벨 미노출 (`{hour > 0 && <label>}`)

#### 블록 병합 렌더링
- `slotData: Record<string, { tag, groupId, title }>` — 셀별 일정 메타
- `computeMergedBlocksForDay()`: 연속 동일 상태/groupId 블록 병합
- 절대 좌표 오버레이: `top = startIdx × 47`, `height = span × 44 + (span-1) × 3`
- **일정 블록**: 흰색 카드 + 좌측 색 바 (태그별 색상)
  - `기타 #94a3b8 / 외근 #f59e0b / 회의 #3182f6 / 휴가 #34c759 / 원온원 #af52de`
- **불가/비선호 병합 블록**: 상태 색상 그대로 병합 표시
- **삭제 팝오버**: 블록 클릭 시 "일정 삭제" / "취소" 팝오버 (click-away 오버레이)
- `groupId = sch-${Date.now()}` — 등록 시 자동 생성

#### 외부 캘린더 연동 패널
- 위치: 컨텐츠 영역 우측 (`right-0`), 숨김 시 `translate-x-[600px]`
- 동기화 완료 버튼 클릭 → 패널 닫힘 (`showSyncPanel = false`)

- **팀원 캘린더 보기**: 편집 패널·버튼 비활성화 (읽기 전용)
- `useSearchParams` → Suspense 경계 처리 (정적 프리렌더링 빌드 오류 해결)

### 3. 회의 생성 (`/create`)
- 참석자 선택 → 실시간 최적 슬롯 계산
- **추천 슬롯**: 가능한 전체 슬롯 중 시간 빠른 순 상위 3개만 카드로 표시
  - 카드 3개 가로 배치 (`grid grid-cols-3 gap-4`)
  - 비선호 시 아바타 주황 stroke 없음
- **히트맵**: 유효 슬롯 전체를 파란색으로 표시 ("더 많은 시간대 보기")
  - 상위 3개는 ring으로 강조
  - 비선호 주황 점 없음
  - 범례에 비선호 항목 없음
- 소요시간: CustomSelect 드롭다운
- 날짜 범위: `~` 구분자

### 4. 요청 회의건 (`/notifications`)
- 구 "알림" → "요청 회의건"으로 리네임
- 승인/거절 처리 → 처리 완료 섹션 이동
- 필수/선택 참석 타입 태그 표시
- 중복 생성 버그 수정 (custom event 제거, popstate/focus 리스너로 대체)

---

## 핵심 로직 (`src/lib/`)

### store.ts
- `useTimetable(personId)`: 개인 시간표 CRUD + localStorage 영속
- `useMeetings()`: 회의 목록 + 비동기 승인 흐름
  - `addMeeting` / `respondToMeeting` / `approveAllForMeeting` / `rejectMeeting` / `deleteMeeting`
  - `triggerFlywheel`: 전원 수락 시 참석자 시간표 자동 `unavailable` 처리
- `computeRecommendations`: 실시간 최적 슬롯 계산 (내부 알고리즘)
  - 회의 생성 페이지에서는 시간 빠른 순 정렬로 오버라이드

### data.ts
- `PEOPLE`: 팀원 6명 (id, name, role, avatar, color, description, tags)
  - `syncStatus` 필드 완전 제거
- `HOURS`: 0~23 (업무시간 = 9~18)
- `getPersonTimetable`: 인물별 시드 시간표 생성

---

## 컴포넌트

| 컴포넌트 | 위치 | 설명 |
|---------|------|------|
| Sidebar | `src/components/ui/Sidebar.tsx` | 좌측 네비게이션, "요청 회의건" 뱃지 |
| ReviewerGuidePanel | `src/components/ui/ReviewerGuidePanel.tsx` | 우측 토스 담당자 데모 가이드 |
| CustomSelect | timetable/create 페이지 내 인라인 | 커스텀 드롭다운 (팀원/시간/소요시간) |

### ReviewerGuidePanel 버튼
1. 웰컴 모달부터 시작하기
2. 온보딩 모달부터 시작하기
3. 6명 회의 바로 생성해보기
4. 데모 데이터 초기화 하기

---

## UX/접근성

- 12px 텍스트: `text-stone` → `text-slate` (WCAG AA 대비비 충족)
- 모달 X버튼: `text-stone hover:text-graphite`
- 삭제 아이콘: `text-stone`
- 커스텀 스크롤바: 6px, silver/stone 색상 (globals.css)
- 모든 모달 하단 패딩: 24px (`pb-6`)

---

## 배포 현황

| 항목 | 내용 |
|------|------|
| 저장소 | GitHub — naeunkim0402/corecalendar |
| 배포 플랫폼 | Vercel |
| 프로덕션 URL | https://schedule-app-livid-one.vercel.app |
| Analytics | Vercel Analytics (활성화 완료) |
| 마지막 커밋 | `revert: remove Vercel Geolocation feature` |

---

## 해결한 주요 버그

1. **빌드 오류** (`useSearchParams`): Suspense 경계 추가로 해결
2. **처리 완료 중복 생성**: `save()` 내 custom event dispatch 제거, popstate/focus로 대체
3. **01:00 라벨 잘림**: 00:00 행 유지 + 라벨만 조건부 미노출로 해결
4. **동기화 패널 미닫힘**: `showSyncPanel = false` 트리거 누락 수정
5. **동기화 패널 위치 겹침**: `right-0 + translate-x-[600px]`로 ReviewerGuidePanel과 분리
6. **`a.verified` TypeScript 오류**: 제거된 필드 참조 3곳 일괄 삭제

---

## 다음 단계 (미완료)

- [ ] 반응형/모바일 대응 (현재 데스크톱 사이드바 레이아웃)
- [ ] 확정 회의 상세 보기 / 취소 시 시간표 복원
- [ ] 시간표 페이지 저장 완료 토스트 피드백
- [ ] 다크 모드
- [ ] 접근성 개선 (키보드 네비게이션, ARIA)
