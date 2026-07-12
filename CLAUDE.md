# Corecalendar — 조율 없는 조율

@AGENTS.md
@.claude/skills/frontend-design/SKILL.md

## 프로젝트 개요

토스 프로덕트 디자이너 과제용 프로토타입. **"조율 없는 조율"** 콘셉트로, 회의 시간 조율의 핑퐁을 구조적으로 제거하는 일정 관리 앱.

**핵심 아이디어**: 최초 1회 외부 캘린더 이관 후, 모든 일정·회의·맥락 관리를 플랫폼 내부에서 처리하는 올인원 일정 관리 플랫폼. 각자의 시간표(불가/비선호)를 내부에서 관리하면 회의 생성 시 실시간 계산으로 최적 슬롯을 즉시 추천.

**설계 원칙**:
1. 사람의 성실성에 기대지 않는다 — 기본값이 이미 정답에 가깝게
2. 계산은 시스템이, 판단은 사람이 — 추천 + 근거 + 승인 구조
3. 단편적 개선이 아닌 구조적 해결 — 문제가 발생하지 않는 제품 구조

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **CSS**: Tailwind CSS v4 (`@theme inline` 방식)
- **Animation**: Framer Motion
- **Language**: TypeScript
- **State**: localStorage 기반 커스텀 훅 (`useTimetable`, `useMeetings`)
- **Font**: Pretendard Variable (CDN)
- **Backend**: 없음 (클라이언트 전용 프로토타입)

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx          # RootLayout (Pretendard CDN, lang="ko")
│   ├── globals.css          # Tailwind v4 + 토스 디자인 토큰 (@theme inline)
│   ├── page.tsx             # 대시보드 (히어로, 3단계 플로우, 확정 회의 목록, 팀 멤버)
│   ├── create/page.tsx      # 회의 생성 (3-step: 입력→추천→확정)
│   └── timetable/page.tsx   # 시간표 세팅 (브러시 페인팅 UI)
├── components/ui/
│   ├── index.ts             # barrel export
│   ├── Sidebar.tsx          # 좌측 네비게이션 (240px 고정)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── TopBar.tsx
│   ├── BottomCTA.tsx
│   └── ListItem.tsx
└── lib/
    ├── data.ts              # 페르소나 6명, 시간표 시뮬레이션, 타입 정의
    └── store.ts             # localStorage 훅 + 추천 알고리즘 (computeRecommendations)
```

## 완료된 기능

- [x] 대시보드 — 히어로 섹션, 3단계 플로우 카드, 확정 회의 목록, 팀 멤버 + 제약 태그 + 데이터 신뢰도
- [x] 시간표 세팅 — 브러시 페인팅 (불가/비선호/지우개), 6명 페르소나 시점 전환, 캘린더 연동 초안
- [x] 회의 생성 — 참석자 선택 (필수/선택 토글), 실시간 추천 계산, Top 3 슬롯 카드 + 매칭률 원형
- [x] 확정 → 피드백 루프 — 확정 시 참석자 시간표 자동 불가 반영, 다음 회의 추천에 즉시 반영
- [x] 사이드바 네비게이션 (pathname 기반 활성 상태)
- [x] 토스 스타일 디자인 토큰 (globals.css @theme inline)

## 다음 단계

- [ ] 반응형/모바일 대응 (현재 데스크톱 사이드바 레이아웃)
- [ ] 시간표 페이지 저장 완료 피드백 개선 (토스트 등)
- [ ] 확정 회의 상세 보기 / 취소 시 시간표 복원
- [ ] 다크 모드
- [ ] 접근성 개선 (키보드 네비게이션, ARIA)

## 코드 스타일 & 규칙

### Tailwind v4
- `@theme inline` 블록에서 CSS 커스텀 프로퍼티로 토큰 정의 (globals.css)
- `tailwind.config.js` 없음 — v4는 CSS-first 설정
- 커스텀 색상: `toss-blue`, `toss-blue-light`, `toss-blue-dark`, `bg-primary/secondary/tertiary`, `success`, `warning`, `error`

### 상태 관리
- 서버 없이 `localStorage` + React 훅으로 관리
- `useTimetable(personId)` — 개인별 시간표 CRUD
- `useMeetings()` — 확정 회의 CRUD + 피드백 루프 (확정 시 시간표 자동 갱신)
- `computeRecommendations()` — 선택된 참석자 시간표 기반 실시간 슬롯 계산

### 데이터
- 6명 페르소나 (필수 4 + 선택 2), 각각 제약 조건 태그 + 플랫폼 상태(active_internal/migrated)
- 시간 범위: 월~금 9-17시, 점심 12-13시 제외
- 슬롯 키 형식: `"${day}-${hour}"` (day: 0~4, hour: 9~17)

### 레이아웃
- 사이드바(240px) + 메인 콘텐츠 (`flex min-h-dvh`)
- 콘텐츠 max-width: 960px (대시보드), 800px (회의 생성)
- 모든 페이지 `"use client"` (클라이언트 전용 프로토타입)
