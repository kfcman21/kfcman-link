---
omd: 0.1
brand: kfcman.link
bootstrapped_from: drdiary
bootstrapped_at: "2026-08-11"
revised_at: "2026-10-25"
revision: "v2 — 네이버 스타일(포털형 그린 단일 강조)로 전환"
tokens:
  source: live-implemented
  extracted: "2026-10-25"
  note: "v2: Dr.diary 기반 스카이블루+3단 그라데이션(v1)을 폐기하고 네이버 포털에서 영감을 받은 시각 문법으로 전환. 그린 #03C75A 단일 강조(면·테두리·아이콘), 초록 글자는 대비 확보용 #008A3E. 흰 캔버스 + #f5f6f7 회색 면 + #e3e5e8 테두리, 굵은 제목(700), 그라데이션·그림자 없음. 구현: index.html <style> 마지막 'NAVER-INSPIRED STYLE' 레이어(--nv-*, --ds-* 토큰). 네이버 로고·명칭·상표는 사용하지 않는다."
  colors:
    primary: "#03c75a"
    primary-hover: "#02b350"
    primary-text: "#008a3e"
    primary-tint: "#eafaf1"
    link-blue: "#0068c3"
    ink: "#222222"
    body: "#303038"
    slate: "#505055"
    muted: "#767678"
    faint: "#a8a8ad"
    canvas: "#ffffff"
    surface: "#f5f6f7"
    hairline: "#e3e5e8"
    on-primary: "#ffffff"
  colors_dark:
    primary-text: "#03c75a"
    primary-tint: "rgba(3,199,90,0.14)"
    ink: "#f2f2f4"
    body: "#dcdce0"
    slate: "#b4b4bb"
    muted: "#8e8e95"
    canvas: "#18181c"
    card: "#222227"
    surface: "#2a2a30"
    hairline: "#3a3a41"
  typography:
    family: { sans: "Pretendard" }
    wordmark:   { size: 44, weight: 800, lineHeight: 1.1, use: "히어로 워드마크 'kfcman.link' (kfcman 그린, .link 잉크)" }
    hero-title: { size: 26, weight: 700, lineHeight: 1.4, use: "히어로 한 줄 문구, 강조 구절만 그린 글자" }
    heading:    { size: 24, weight: 700, lineHeight: 1.4, use: "섹션 제목 (H2)" }
    card-title: { size: 18, weight: 700, lineHeight: 1.4, use: "타일/카드 제목 (H3), 카드형은 17" }
    body:       { size: 15, weight: 400, lineHeight: 1.55, use: "본문" }
    nav:        { size: 15, weight: 500, lineHeight: 1.2, use: "사이드바 메뉴, 활성 700" }
    button:     { size: 16, weight: 700, lineHeight: 1.2, use: "주요 버튼 라벨 (흰 글자, 그린 면)" }
    meta:       { size: 13, weight: 400, lineHeight: 1.4, use: "라벨·캡션·메타, muted" }
    min:        { size: 12, use: "UI 최소 글자 크기 — 9~11px 금지" }
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 40, section: 64 }
  rounded: { sm: 8, md: 12, icon: 16, pill: 9999 }
  shadow:
    none: "none"
    focus: "0 0 0 4px #eafaf1 (검색창 포커스 링 전용)"
  components:
    search-hero:   { type: input, border: "2px solid #03c75a", radius: "9999px", height: "60px", button: "그린 알약 '단축하기' 16px/700", use: "히어로 중앙 주소 입력창 — 포털 검색창 문법" }
    quick-launch:  { type: nav, icon: "52px 사각 아이콘(#f5f6f7, 1px #e3e5e8, 16px 라운드), 그린 아이콘", label: "13px slate", use: "히어로 아래 수업 도구 바로가기 (교실/프로젝트/마음챙김/과학실험실/MBL 가이드/설정)" }
    tile:          { type: card, bg: "#f5f6f7", radius: "12px", shadow: "none", use: "벤토 그리드 타일" }
    outline-card:  { type: card, bg: "#ffffff", border: "1px solid #e3e5e8", radius: "12px", hover: "border #03c75a", use: "최근 프로젝트/활용 사례 카드, 통계 큰 타일" }
    primary-button:{ type: button, bg: "#03c75a", hover: "#02b350", fg: "#ffffff", radius: "8px", font: "16px / 700", use: "새로 만들기 등 주요 액션" }
    nav-item:      { type: tab, fg: "#505055", active: "bg #eafaf1 + text #008a3e 700", radius: "8px", use: "좌측 사이드바 메뉴" }
    chip:          { type: badge, bg: "#ffffff", border: "1px solid #e3e5e8", radius: "9999px", icon: "그린", use: "특징 표시 칩" }
    type-badge:    { type: badge, bg: "#eafaf1", fg: "#008a3e", radius: "9999px", font: "13px / 700", use: "카드 유형 라벨" }
  components_harvested: true
---

# Design System for kfcman.link (v2 · 네이버 스타일)

> **v2 개정 (2026-10-25)** — v1(Dr.diary 기반 스카이블루 + 3단 그라데이션)을 폐기하고, 한국 사용자가 가장 익숙한 포털의 시각 문법(네이버 스타일)으로 전환했다. 그린 하나로 강조하고, 회색 면과 얇은 테두리로 나누고, 제목은 굵게 쓴다. 네이버의 로고·명칭·상표는 사용하지 않고 시각 문법만 차용한다.

## 1. Visual Theme & Atmosphere

kfcman.link는 초등학교 수업 현장에서 교사와 학생을 잇는 단축 URL 서비스이자 실시간 수업 도구 모음이다. v2는 **"매일 여는 포털처럼 익숙하게"**를 목표로 한다. 교사가 아침마다 여는 포털 첫 화면처럼, 가운데의 큰 초록 테두리 입력창에 주소를 붙여 넣고 바로 단축하며, 그 아래 아이콘 바로가기로 교실·마음챙김·과학실험실로 이동한다.

캔버스는 순백(`#ffffff`), 구획은 회색 면(`#f5f6f7`)과 1px 테두리(`#e3e5e8`)로만 나눈다. 강조색은 **그린 하나**(`#03C75A`)다. 버튼 면, 검색창 테두리, 아이콘, 활성 표시에 쓰고, 초록 글자가 필요할 때는 흰 배경 대비를 확보한 진한 그린(`#008A3E`)을 쓴다. 그라데이션과 그림자는 쓰지 않는다. 제목은 굵게(700) 써서 정보가 먼저 읽히게 한다.

**Key Characteristics:**
- 그린 단일 강조 — 면·테두리·아이콘 `#03C75A`, 글자 `#008A3E`
- 히어로 = 워드마크 + 초록 테두리 알약 입력창 + 아이콘 바로가기 (포털 검색창 문법)
- 흰 캔버스 + `#f5f6f7` 회색 면 + `#e3e5e8` 테두리, 그림자·그라데이션 없음
- 굵은 제목(700), 본문 15px, 메타 13px, UI 최소 12px
- 카드 12px · 버튼 8px · 검색창/칩 알약(9999px) 라운드
- Pretendard 단일 서체

## 2. Color Palette & Roles

### Primary
- **Green** (`#03C75A`): 유일한 브랜드 강조. 주요 버튼 면, 검색창 테두리, 아이콘, 활성 바, 오늘 막대. 흰 글자와의 대비가 2.25:1이라 **이 색 위의 라벨은 16px 이상 700**으로만 쓴다.
- **Green Hover** (`#02B350`): 버튼 호버.
- **Green Text** (`#008A3E`): 초록 글자 전용(링크, 활성 메뉴, 강조 구절, 통계 숫자). 흰 배경 대비 4.46:1.
- **Green Tint** (`#EAFAF1`): 활성 메뉴 배경, 유형 배지 배경, 포커스 링.
- **Link Blue** (`#0068C3`): 단축 주소 표기 등 '주소'임을 알리는 곳에만 드물게.

### Text
- **Ink** (`#222222`): 제목.
- **Body** (`#303038`): 본문.
- **Slate** (`#505055`): 메뉴, 보조 라벨.
- **Muted** (`#767678`): 캡션, 메타, 설명문 (흰 배경 대비 4.53:1).
- **Faint** (`#A8A8AD`): 플레이스홀더, 비활성.

### Surface & Border
- **Canvas** (`#FFFFFF`), **Surface** (`#F5F6F7`), **Hairline** (`#E3E5E8`).

### 상태색 (의미가 있을 때만)
- 성공 emerald, 삭제·위험 rose, 경고 amber는 **상태 표시 배지에만** 남긴다. 버튼·강조 장식에 보라·인디고·주황을 쓰지 않는다 (v2에서 그린으로 통일).

### Dark Mode
- Canvas `#18181C`, Card `#222227`, Surface `#2A2A30`, Hairline `#3A3A41`, Ink `#F2F2F4`, Body `#DCDCE0`, Muted `#8E8E95`. 다크에서는 초록 글자도 `#03C75A`(대비 7.8:1)를 쓴다.

## 3. Typography Rules

### Font Family
- **Pretendard** 단일 (fallback: `Pretendard Fallback`, `-apple-system`, `system-ui`). 위계는 크기와 굵기로만.

### Hierarchy

| Role | Size | Weight | Line Height | Color | Notes |
|------|------|--------|-------------|-------|-------|
| Wordmark | 44px (모바일 숨김) | 800 | 1.1 | `#008A3E` + `#222222` | 히어로 'kfcman.link' |
| Hero Title | 26px | 700 | 1.4 | `#222222`, 강조 구절 `#008A3E` | 한 줄 문구 |
| Section Heading | 24px | 700 | 1.4 | `#222222` | H2 |
| Tile/Card Title | 18px (카드 17px) | 700 | 1.4 | `#222222` | H3 |
| Body | 15px | 400 | 1.55 | `#303038` | 본문 |
| Nav | 15px | 500 / 활성 700 | 1.2 | `#505055` / `#008A3E` | 사이드바 |
| Button | 16px | 700 | 1.2 | `#FFFFFF` on `#03C75A` | 주요 액션 |
| Meta | 13px | 400 | 1.4 | `#767678` | 라벨·캡션 |

### Principles
- **제목은 굵게**: 700이 기본. 800·900은 워드마크와 큰 통계 숫자에만.
- **최소 12px**: 9~11px 글자는 쓰지 않는다 (교실 TV·태블릿 가독성).
- **강조는 색 한 가지**: 강조 구절은 그린 글자로만, 그라데이션 텍스트 금지.

## 4. Component Stylings

### Hero Search (히어로 입력창)
- 높이 60px(모바일 54px), `2px solid #03C75A`, 알약 라운드, 흰 면
- 왼쪽 그린 링크 아이콘, 플레이스홀더 "긴 주소를 붙여 넣으세요"
- 오른쪽 그린 알약 버튼 "단축하기" (16px/700). 회원은 붙여 넣은 주소를 채운 단축 창이 열리고, 게스트는 가입 창이 열린다.
- 포커스 시 `0 0 0 4px #EAFAF1` 링 — 시스템에서 허용하는 유일한 box-shadow

### Quick Launch (아이콘 바로가기)
- 52px 사각 아이콘(16px 라운드, `#F5F6F7` 면, `#E3E5E8` 테두리), 그린 아이콘 24px, 아래 13px 라벨
- 호버 시 테두리 그린. 모바일은 3열 그리드.

### Buttons
- **Primary**: `#03C75A` 면, 흰 글자 16px/700, 8px 라운드, 호버 `#02B350`
- **Text link**: 그린 글자 `#008A3E` 700, 밑줄은 호버 시만

### Cards & Tiles
- **Tile**: `#F5F6F7` 면, 12px 라운드, 테두리 없음, 그림자 없음
- **Outline card**: 흰 면 + `1px #E3E5E8`, 12px 라운드, 호버 시 테두리 그린
- **Type badge**: `#EAFAF1` 면 + `#008A3E` 13px/700 알약

### Navigation
- **Sticky header** 56px(모바일 52px): 흰 면 96%, 하단 1px 테두리. 좌측 워드마크(사이드바가 접힐 때) 또는 현재 위치, 우측 검색(회원) + 그린 '새로 만들기'.
- **Sidebar**: 메뉴 44px, 15px/500 slate. 활성 = `#EAFAF1` 면 + `#008A3E` 700 + 그린 아이콘. 1024px 미만에서는 서랍 메뉴 + 반투명 가림막.

## 5. Layout Principles

- 회원 홈 순서: **스티키 헤더 → 히어로(워드마크·입력창·바로가기) → '바로 읽는 반응' 벤토 → '최근 프로젝트' 카드 그리드**
- 게스트 홈 순서: 헤더 → 히어로 → '한 계정으로 쓰는 수업 도구' 벤토 → '이렇게 쓰고 있어요' 카드
- 벤토: 4열(>1280) → 2열(≤1280) → 1열(<640). 큰 타일 2×2, 세로 타일, 가로 전체 타일을 섞되 빈칸이 생기지 않게 배치
- 간격 스케일 4/8/12/16/24/40/64, 섹션 사이 64px(모바일 40px)
- 라운드: 버튼 8 · 카드 12 · 아이콘 16 · 입력창/칩 9999

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | 흰 캔버스 | 페이지 |
| 1 | `#F5F6F7` 면 | 타일, 아이콘 박스, 입력 필드 |
| 2 | `1px #E3E5E8` 테두리 | 카드, 헤더·사이드바 경계 |
| Focus | `2px #03C75A` 아웃라인 / 검색창 링 | 키보드 포커스 |

그림자로 높이를 만들지 않는다. 구분은 면 색과 테두리로만 한다.

## 7. Do's and Don'ts

### Do
- 강조는 그린 한 가지로 — 면은 `#03C75A`, 글자는 `#008A3E`
- 제목 700, 본문 15px, 메타 13px, 최소 12px
- 카드 12px 라운드 + 1px 테두리, 타일은 회색 면
- 히어로는 입력창 중심으로 — "붙여 넣고 바로 단축"
- 상태색(emerald/rose/amber)은 상태 배지에만

### Don't
- 그라데이션(텍스트·면·바) 금지
- 드롭 섀도 금지 (검색창 포커스 링 예외)
- 보라·인디고·주황을 액션/장식 색으로 쓰지 말 것
- 9~11px 글자, 800·900 굵기 남발 금지
- 네이버 로고·명칭·상표 사용 금지 — 시각 문법만 차용
- `#03C75A` 위에 16px 미만 또는 400 굵기 흰 글자 금지 (대비 부족)

## 8. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | 헤더 52px·검색 숨김, 히어로 워드마크 숨김, 입력창 54px, 바로가기 3열, 벤토·카드 1열 |
| Tablet | 640–1023px | 사이드바 → 서랍, 헤더에 워드마크, 벤토 2열 |
| Desktop | ≥1024px | 사이드바 고정, 벤토 4열(>1280), 헤더 검색 표시 |

- 터치 타깃 최소 44px (메뉴 44, 입력창 버튼 46, 헤더 버튼 40+여백)
- 어떤 폭에서도 가로 스크롤 없음

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary (fill/border/icon): `#03C75A` · hover `#02B350`
- Green text: `#008A3E` · tint `#EAFAF1`
- Ink `#222222` · Body `#303038` · Slate `#505055` · Muted `#767678` · Faint `#A8A8AD`
- Canvas `#FFFFFF` · Surface `#F5F6F7` · Hairline `#E3E5E8`

### Example Component Prompts
- "히어로: 가운데 'kfcman.link' 워드마크 44px/800(kfcman은 #008A3E). 아래 26px/700 한 줄 문구, 강조 구절만 #008A3E. 그 아래 높이 60px 알약 입력창, 2px solid #03C75A, 오른쪽에 #03C75A 알약 버튼 '단축하기' 16px/700 흰 글자."
- "바로가기: 52px 사각 아이콘(#F5F6F7, 1px #E3E5E8, 16px 라운드), 그린 아이콘, 아래 13px #505055 라벨, 6개 가로 정렬, 모바일 3열."
- "카드: 흰 면, 1px #E3E5E8, 12px 라운드, 그림자 없음, 제목 17px/700 #222222, 유형 배지 #EAFAF1/#008A3E 알약."

### Iteration Guide
1. 그린은 하나 — 글자에는 #008A3E
2. 그라데이션·그림자 없음
3. 제목 700, 최소 12px
4. 카드 12 · 버튼 8 · 입력창 알약
5. 상태색은 상태 배지에만

## 10. Voice & Tone

v1과 동일한 원칙을 유지한다 — **따뜻하고 명료하며 힘을 실어주는** 수업 도우미. 포털처럼 짧고 즉시 실행 가능한 문구를 우선한다("긴 주소를 붙여 넣으세요", "단축하기", "새로 만들기").

| Context | Tone |
|---|---|
| 히어로 | 한 줄 가치 문구. "학교의 모든 연결을, 더 가볍고 빠르게." |
| 입력창·버튼 | 동사 하나로 끝나는 행동 문구. "단축하기", "시작하기" |
| 섹션 타이틀 | 평이하고 짧게. "바로 읽는 반응", "최근 프로젝트" |
| 오류/경고 | 원인 + 다음 행동. 예: "일반회원은 단축 주소를 최대 50개까지 만들 수 있어요. 더 필요하면 '우수회원👑' 등급업을 요청해 주세요." |

**Forbidden register**: 공포 기반 관리 압박, 정의 없는 관리자 용어, 사용량 죄책감 프레이밍, 느낌표 남발.

## 11. Brand Narrative

kfcman.link는 초등학교 수업 현장에서 긴 링크를 손으로 옮겨 적던 반복 업무를 줄이려고 시작한 단축 URL 서비스다. 실시간 설문, 협업 게시판, 으쓱점수 학급 보드, 마음챙김, 과학실험실까지 수업 중 바로 꺼내 쓰는 도구를 한 계정에 묶었다. v2는 이 도구 모음을 **교사가 매일 여는 포털처럼 익숙한 화면**으로 정리한다 — 입력창 하나와 바로가기 아이콘으로 하루를 시작하게 하는 것이다.

## 12. Principles

1. **익숙함이 곧 속도다.** 포털의 검색창·바로가기 문법을 빌려 학습 비용을 없앤다.
2. **강조는 한 가지 색으로.** 그린이 보이면 그곳이 할 일이다.
3. **설명하되, 위협하지 않는다.** 제한·경고는 원인과 다음 행동을 함께.
4. **읽히는 것이 먼저.** 굵은 제목, 12px 이상 글자, 면과 테두리만으로 구분.
5. **차용은 문법까지만.** 다른 브랜드의 로고·이름·상표는 쓰지 않는다.

## 13. Personas

*실제 회원 등급(일반/우수회원/관리자)과 기능에 근거한 가상의 원형이며 실존 인물을 가리키지 않는다.*

- **박선생, 34, 초등 3학년 담임** — 아침에 포털처럼 kfcman.link를 열고 입력창에 구글폼 주소를 붙여 넣어 QR을 띄운다.
- **김학생, 10, 4학년** — 로그인 없이 공유된 설문·게시판에 참여한다.
- **이관리자, 41, 정보부장** — 관리자 콘솔에서 계정 승인과 유해 링크 차단을 관리한다.

## 14. States

| State | Treatment |
|---|---|
| Empty (링크 없음) | `#F5F6F7` 면 12px 라운드 안에 13~15px muted 한 줄 + 히어로 입력창으로 유도 |
| Empty (검색 결과 없음) | muted 한 줄 + 필터 초기화 경로 |
| Loading | 최종 크기의 `#F5F6F7` 스켈레톤, 플랫 펄스 |
| Error | 잉크 글자로 원인 + 재시도. 위험 상태만 rose 배지 |
| Validation | 필드 아래 12~13px로 무엇이 유효한지 설명 |
| Success | 짧은 인라인 확인, 그린 체크 아이콘, 과한 이모지 없음 |
| Disabled | 글자 `#A8A8AD`, 그린 버튼은 회색 대신 투명도 50% |
| Focus | `2px solid #03C75A` 아웃라인 |

## 15. Motion & Easing

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 120ms | 호버, 테두리 색 전환 |
| `motion-standard` | 220ms | 카드 등장, 서랍 메뉴 |
| `motion-slow` | 320ms | 페이지 전환 |

Easing: `ease-enter cubic-bezier(0.2,0.6,0.25,1)`, `ease-exit cubic-bezier(0.4,0,1,1)`, `ease-standard cubic-bezier(0.25,0.1,0.25,1)`. 바운스·스프링 없음. `prefers-reduced-motion: reduce`에서는 모든 전환을 즉시로 축소한다.
