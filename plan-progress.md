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
- **셀 상태**: `available`(기본) / `unavailable`(빨강) / `prefer_not`(주황, 라벨: 비선호)
- **00:00 행**: 렌더는 유지하되 라벨 미노출 (`{hour > 0 && <label>}`)
- **시간 라벨**: `absolute -top-[7px]` (행 경계선 기준 정렬)
- **요일 헤더**: 세로 배치 (요일 위, 날짜 아래), 그리드 상단 여백 없음
- **일정 등록 모달**: 시작~끝 시간 범위 선택 (CustomSelect)
- **팀원 캘린더 보기**: 편집 패널·버튼 비활성화 (읽기 전용)
- `useSearchParams` → Suspense 경계 처리 (정적 프리렌더링 빌드 오류 해결)

### 3. 회의 생성 (`/create`)
- 참석자 선택 → 최적 시간 추천 (matchScore 알고리즘)
- 제목: "선택한 기간에서 최적의 시간 N개를 찾았어요" (bold 없음)
- 소요시간: CustomSelect 드롭다운
- 날짜 범위: `~` 구분자

### 4. 요청 회의건 (`/notifications`)
- 구 "알림" → "요청 회의건"으로 리네임
- 승인/거절 처리 → 처리 완료 섹션 이동
- 중복 생성 버그 수정 (custom event 제거, popstate/focus 리스너로 대체)

---

## 핵심 로직 (`src/lib/`)

### store.ts
- `useTimetable(personId)`: 개인 시간표 CRUD + localStorage 영속
- `useMeetings()`: 회의 목록 + 비동기 승인 흐름
  - `addMeeting` / `respondToMeeting` / `approveAllForMeeting` / `rejectMeeting` / `deleteMeeting`
  - `triggerFlywheel`: 전원 수락 시 참석자 시간표 자동 `unavailable` 처리
- `computeRecommendations`: 실시간 최적 슬롯 계산
  - 점수 = 참석자(60) + 비선호 패널티(30) + 필수참석(10)
  - 정렬: matchScore 내림차순 → 비선호 최소 → 참석 최대 → 이른 시간

### data.ts
- `PEOPLE`: 팀원 6명 (id, name, role, avatar)
- `HOURS`: 0~23 (업무시간 = 9~18)
- `getPersonTimetable`: 인물별 시드 시간표 생성

---

## 컴포넌트

| 컴포넌트 | 위치 | 설명 |
|---------|------|------|
| Sidebar | `src/components/ui/Sidebar.tsx` | 좌측 네비게이션, "요청 회의건" |
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
| 저장소 | GitHub (자동 연동) |
| 배포 플랫폼 | Vercel |
| 프로덕션 URL | https://schedule-app-livid-one.vercel.app |
| Analytics | Vercel Analytics (활성화 완료) |
| 마지막 커밋 | `fix: onboarding navigates to timetable, darker action buttons` |

---

## 해결한 주요 버그

1. **빌드 오류** (`useSearchParams`): Suspense 경계 추가로 해결
2. **처리 완료 중복 생성**: `save()` 내 custom event dispatch 제거, popstate/focus로 대체
3. **01:00 라벨 잘림**: 00:00 행 유지 + 라벨만 조건부 미노출로 해결
