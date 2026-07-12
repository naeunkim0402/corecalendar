# Corecalendar — Design System

> Monochrome Utility, Structured Clarity.
> 조율 없는 조율. 흑백의 절제된 팔레트 위에 기능이 말하게 하는 시스템.

**Theme:** light

---

## Brand Identity

**Name:** Corecalendar
**Tagline:** 조율 없는 조율
**Tone:** 군더더기 없이 정밀한 도구. 컬러를 배제하고 구조와 타이포그래피로 위계를 만든다. 장식 대신 기능이 말하고, 여백이 숨 쉰다.

**Design Principles:**
1. 사람의 성실성에 기대지 않는다 — 기본값이 이미 정답에 가깝게
2. 계산은 시스템이, 판단은 사람이 — 추천 + 근거 + 승인 구조
3. 컬러는 의미일 때만 — 모노크롬이 기본, 색은 상태(success/warning/error)에만 허용

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#101010` | `--color-ink` | Primary CTA, 최상위 강조, active state |
| White | `#ffffff` | `--color-white` | 카드 배경, 다크 버튼 위 텍스트 |
| Paper | `#f9fafb` | `--color-paper` | 페이지 배경 |
| Graphite | `#191f28` | `--color-graphite` | 헤드라인, 본문 텍스트 |
| Slate | `#6b7684` | `--color-slate` | 보조 텍스트, 설명 카피 |
| Stone | `#8b95a1` | `--color-stone` | 플레이스홀더, 비활성 요소 |
| Silver | `#e5e8eb` | `--color-silver` | 디바이더, 비활성 보더 |
| Mist | `#f2f4f6` | `--color-mist` | 태그 배경, 호버 배경, 구분선 |
| Success | `#03b26c` | `--color-success` | 확정, 완료, 긍정 상태 |
| Warning | `#fe9800` | `--color-warning` | 대기, 주의 상태 |
| Error | `#f04452` | `--color-error` | 거절, 삭제, 위험 상태 |

### Semantic Backgrounds

| Name | Value | Token |
|------|-------|-------|
| Success Surface | `rgba(3, 178, 108, 0.08)` | `--color-success-surface` |
| Success Badge | `rgba(3, 178, 108, 0.15)` | `--color-success-badge` |
| Warning Surface | `rgba(254, 152, 0, 0.08)` | `--color-warning-surface` |
| Warning Badge | `rgba(254, 152, 0, 0.15)` | `--color-warning-badge` |
| Error Surface | `rgba(240, 68, 82, 0.06)` | `--color-error-surface` |
| Error Badge | `rgba(240, 68, 82, 0.15)` | `--color-error-badge` |

---

## Tokens — Typography

### Pretendard Variable — 유일한 서체. 웨이트와 사이즈로 위계를 만든다. `--font-sans`
- **Fallback:** -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Source:** CDN (Pretendard Variable)

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Token |
|------|------|--------|-------------|----------------|-------|
| caption | 11px | 500 | 1.4 | 0 | `--text-caption` |
| label | 12px | 600 | 1.4 | 0 | `--text-label` |
| body-sm | 13px | 400 | 1.5 | -0.1px | `--text-body-sm` |
| body | 14px | 400 | 1.6 | -0.15px | `--text-body` |
| subheading | 15px | 600 | 1.4 | -0.15px | `--text-subheading` |
| heading-sm | 17px | 700 | 1.3 | -0.2px | `--text-heading-sm` |
| heading | 18px | 700 | 1.3 | -0.2px | `--text-heading` |
| heading-lg | 24px | 700 | 1.2 | -0.3px | `--text-heading-lg` |
| display | 32px | 700 | 1.15 | -0.4px | `--text-display` |

---

## Tokens — Spacing & Shapes

**Density:** compact

### Spacing Scale

| Value | Token |
|-------|-------|
| 4px | `--spacing-4` |
| 6px | `--spacing-6` |
| 8px | `--spacing-8` |
| 10px | `--spacing-10` |
| 12px | `--spacing-12` |
| 16px | `--spacing-16` |
| 20px | `--spacing-20` |
| 24px | `--spacing-24` |
| 32px | `--spacing-32` |
| 40px | `--spacing-40` |
| 48px | `--spacing-48` |
| 80px | `--spacing-80` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Tags, Pill Buttons | 9999px | `--radius-pill` |
| Cards | 16px | `--radius-card` |
| Inputs | 10px | `--radius-input` |
| Rectangular Buttons | 10px | `--radius-button` |
| Avatars | 9999px | `--radius-avatar` |

### Shadows (elevation via shadow, not border)

| Name | Value | Token |
|------|-------|-------|
| card | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` | `--shadow-card` |
| card-hover | `0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)` | `--shadow-card-hover` |
| modal | `0 8px 32px rgba(0,0,0,0.12)` | `--shadow-modal` |

### Layout

| Property | Value |
|----------|-------|
| Page max-width | 1200px |
| Content max-width (forms) | 800px |
| Sidebar width | 240px |
| Section gap | 48px |
| Card padding | 24-28px |
| Header height | 64px |

---

## Components

### Primary CTA Button
Pill 형태. Background: Ink (`#101010`). Text: White. Font: 14px/600. Radius: 9999px. Height: 40px. Padding: 0 24px.
- Active: `#000000`
- Disabled: opacity 0.4

### Secondary Button
Pill outline. Background: transparent. Text: Graphite. Border: 없음, background Mist (`#f2f4f6`). Radius: 9999px. Height: 40px. Padding: 0 24px.
- Active: Silver background

### Ghost Button
텍스트만. Background: transparent. Text: Slate. Radius: 8px. Padding: 6px 12px.
- Hover: Mist background

### Danger Button
Background: Error Surface. Text: Error. Radius: 9999px.

### Tag / Badge
Pill. Background: Mist. Text: Graphite. Radius: 9999px. Padding: 4px 12px. Font: 12px/600.
- Status badges: Success/Warning/Error badge backgrounds with matching text color.

### Card
Background: White. Radius: 16px. Shadow: `--shadow-card`. Padding: 24px. **No border.**
- Hover (interactive cards): `--shadow-card-hover`

### Divider
Color: Mist (`#f2f4f6`). Height: 1px. **Not Silver** — 카드 내부 구분선은 더 연하게.

### Avatar
Circle (9999px). Size: 28px (compact), 36px (default), 44px (large). Font: 10-12px/700, White text on colored background.

---

## Do's and Don'ts

### Do
- Pretendard 하나로 통일. 웨이트(300-700)와 사이즈로 위계를 만든다.
- 99%의 UI를 모노크롬(Ink, Graphite, Slate, Stone, Silver, Mist, Paper, White)으로 구성한다.
- 컬러는 상태(Success/Warning/Error)에만 사용한다.
- CTA 버튼은 pill(9999px)로 통일한다.
- 카드는 border 없이 shadow로 분리한다.
- body 텍스트에 미세한 negative letter-spacing(-0.1 ~ -0.2px)을 적용한다.
- 시간/숫자에 tabular-nums를 적용한다.

### Don't
- 모노크롬 팔레트 외의 컬러를 UI에 도입하지 않는다. (상태 컬러 제외)
- 카드에 border를 사용하지 않는다. shadow로 분리한다.
- 버튼이나 카드에 그라데이션을 사용하지 않는다.
- font-weight 700을 초과하지 않는다.
- 장식적 요소(아이콘 배지, 컬러 dot 등)를 의미 없이 추가하지 않는다.
- 카드 내부에서 과도한 중첩 카드를 만들지 않는다.

---

## Elevation

| Level | Usage | Shadow |
|-------|-------|--------|
| 0 | 페이지 배경 | none |
| 1 | 카드, 컨테이너 | `--shadow-card` |
| 2 | 호버 카드, 드롭다운 | `--shadow-card-hover` |
| 3 | 모달, 바텀시트 | `--shadow-modal` |

---

## Quick Start — Tailwind v4

```css
@import "tailwindcss";

@theme inline {
  /* Colors — Monochrome */
  --color-ink: #101010;
  --color-paper: #f9fafb;
  --color-graphite: #191f28;
  --color-slate: #6b7684;
  --color-stone: #8b95a1;
  --color-silver: #e5e8eb;
  --color-mist: #f2f4f6;

  /* Colors — Semantic (status only) */
  --color-success: #03b26c;
  --color-warning: #fe9800;
  --color-error: #f04452;

  /* Typography */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  --shadow-card-hover: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.12);
}

body {
  background: var(--color-paper);
  color: var(--color-graphite);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```
