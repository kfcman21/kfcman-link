---
omd: 0.1
brand: kfcman.link
bootstrapped_from: drdiary
bootstrapped_at: "2026-08-11"
tokens:
  source: live-extract
  extracted: "2026-07-02"
  note: "Base tokens preserved verbatim from Dr.diary reference (no live-capture override run on kfcman.link yet). primary = sky-blue gradient anchor (#3eaeff); brand identity is a tri-stop sweep #3eaeff→#ff5a8c→#dc6eff (+#00c8fa cyan tail). Headings ink-navy (#232f4d); body pure black (#000000) on white. Flat, shadow-free."
  colors:
    primary: "#3eaeff"
    accent-pink: "#ff5a8c"
    accent-purple: "#dc6eff"
    accent-cyan: "#00c8fa"
    accent-violet: "#4970f5"
    ink: "#232f4d"
    ink-pure: "#000000"
    slate: "#4f5971"
    muted: "#9197a6"
    faint: "#bdc1ca"
    canvas: "#ffffff"
    surface: "#f5f8fb"
    hairline: "#dee0e4"
    on-primary: "#ffffff"
  typography:
    family: { sans: "Pretendard" }
    heading:    { size: 40, weight: 600, lineHeight: 1.4, use: "Section headlines (H2), ink navy" }
    card-title: { size: 18, weight: 500, lineHeight: 1.4, use: "Link/wall/poll card titles (H3)" }
    nav:        { size: 20, weight: 400, lineHeight: 1.2, use: "Top navigation links, slate" }
    body:       { size: 16, weight: 400, lineHeight: 1.5, use: "Standard reading text, Pretendard" }
    button:     { size: 18, weight: 500, lineHeight: 1.2, use: "Primary CTA label (단축 URL 생성하기 등)" }
    more-link:  { size: 20, weight: 600, lineHeight: 1.2, use: "'전체보기' more-link, faint grey" }
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 40, section: 64 }
  rounded: { sm: 8, md: 16, pill: 100, full: 9999 }
  shadow:
    none: "none"
  components:
    recent-item-card: { type: card, bg: "#ffffff", border: "1px solid #dee0e4", radius: "16px", shadow: "none", use: "최근 프로젝트 그리드의 링크/게시판/설문 카드 — flat, hairline outline" }
    value-card:        { type: card, bg: "#f5f8fb", radius: "16px", use: "하이라이트(기능 소개) 카드 — 톤 배경 섹션" }
    primary-cta:       { type: button, fg: "#ffffff", border: "1px solid #ffffff", radius: "8px", padding: "12px 16px", font: "18px / 500 Pretendard", use: "단축 URL 생성하기 등 주요 액션, 강조 히어로 위 outline" }
    nav-link:          { type: tab, fg: "#4f5971", font: "20px / 400 Pretendard", active: "text sky-blue #3eaeff", use: "상단 네비게이션 항목 (단축 URL 생성/실시간 칸반/실시간 설문/으쓱 학급 보드/QR코드 생성/설정 및 관리)" }
    gradient-pill:     { type: badge, fg: "#ff5a8c", radius: "9999px", use: "강조 텍스트 / 클릭수·통계 수치의 시그니처 스윕" }
  components_harvested: true
---

# Design System for kfcman.link (bootstrapped from Dr.diary)

## 1. Visual Theme & Atmosphere

kfcman.link는 초등학교 수업 현장에서 교사와 학생을 잇는 단축 URL 서비스이자 실시간 수업 도구 모음이다. 링크 단축 외에도 실시간 설문, 협업 게시판(칸반), 학급 "으쓱점수" 대시보드 등을 한 계정으로 묶어 제공한다. 사이트는 순백 캔버스(`#ffffff`)에 쿨그레이 톤 밴드(`#f5f8fb`)를 간간이 얹어 콘텐츠를 가볍고 숨 쉴 틈 있는 구획으로 나눈다. 헤딩은 잉크 네이비(`#232f4d`), 본문은 순수 블랙(`#000000`)으로, 교사가 수업 중 빠르게 훑어도 신뢰가 가는 정밀함을 주되 오래된 행정 시스템 특유의 무거운 크롬은 배제한다.

브랜드의 핵심 시그니처는 **3단 그라데이션 스윕** — 스카이블루(`#3eaeff`)가 핫핑크(`#ff5a8c`)와 바이올렛퍼플(`#dc6eff`)로 흐르고, 강조 텍스트에는 시안(`#00c8fa`) 꼬리가 붙는다. 이 그라데이션이 곧 정체성이다: 히어로 헤드라인과 통계 수치에 클립 텍스트로 렌더링되고, 주요 섹션 아래 수평 강조 바로도 쓰인다. 스카이블루 쪽은 팔레트를 고정하는 단일 "신뢰" 색으로 기능하며(가장 빈번한 단색 강조), 핑크-퍼플 쪽은 소비자 앱다운 따뜻함을 더한다 — 링크 관리·학급 소통이 딱딱한 행정 업무가 아니라 가볍고 편한 일이 될 수 있다는 시각적 주장이다. 실제로 현재 홈페이지 히어로 카피 "학교의 모든 연결을, 더 가볍고 빠르게."가 이 주장을 그대로 담고 있다.

타이포그래피는 한국어 모던 & 절제 기조: **Pretendard**가 전 영역을 담당하는 사실상 한국어 제품 폰트다. 섹션 헤드라인은 40px / weight 600 잉크 네이비; 본문은 조용한 16px / weight 400 순수 블랙; 네비는 20px / weight 400 슬레이트(`#4f5971`). 무엇보다 이 시스템을 다른 대시보드형 서비스와 구분 짓는 것은 **완전한 평면성**이다 — 히어로, 네비, 헤딩, 모든 카드에서 `box-shadow: none`을 유지한다. 구분은 오직 톤 배경(`#f5f8fb`), 얇은 헤어라인(`#dee0e4`), 16px 라운드 카드로만 이루어진다. 결과는 빠르고 모바일 네이티브한, 교실에서 바로 켜서 쓰는 도구다운 감각이다 — 데이터를 다룰 만큼 정교하되, 수업 보조 도구답게 가볍고 친근하다.

**Key Characteristics:**
- 시그니처 3단 그라데이션 — 스카이블루 `#3eaeff` → 핑크 `#ff5a8c` → 퍼플 `#dc6eff` (+`#00c8fa` 시안 꼬리), 클립 텍스트 및 강조 바로 사용
- 스카이블루(`#3eaeff`)를 단일 앵커/신뢰 색으로 — 가장 빈번한 단색
- Pretendard가 전체 타입 시스템 담당 — 헤드라인 40px/600, 본문 16px/400
- 잉크 네이비(`#232f4d`) 헤딩 + 순수 블랙(`#000000`) 본문, 흰색(`#ffffff`) 캔버스
- 플랫, 그림자 없는 뎁스: 어디서든 `box-shadow: none`; 구분은 `#f5f8fb` 톤 + `#dee0e4` 헤어라인
- 16px 라운드 카드가 컨테이너의 기본형; 아웃라인 CTA는 8px
- 쿨 슬레이트그레이 텍스트 사다리(`#4f5971` → `#9197a6` → `#bdc1ca`)로 위계 표현
- 보조 블루바이올렛(`#4970f5`)은 링크/아이콘 강조에 드물게 사용

## 2. Color Palette & Roles

### Primary & Gradient
- **Sky Blue** (`#3eaeff`): 주 브랜드 색이자 그라데이션 앵커. 수평 브랜드 스윕의 첫 스톱이자 가장 빈번한 단색 강조 — "신뢰/액션" 색.
- **Accent Pink** (`#ff5a8c`): 시그니처 그라데이션의 따뜻한 중간 지점; 딱딱할 수 있는 관리 도구 팔레트에 소비자 앱다운 친근함을 더함.
- **Accent Purple** (`#dc6eff`): 그라데이션의 바이올렛-마젠타 스톱; 강조/통계 텍스트와 강조 바에 사용.
- **Accent Cyan** (`#00c8fa`): 3단 헤드라인 그라데이션의 시안 꼬리 (`#ff5a8c` → `#dc6eff` → `#00c8fa`).
- **Accent Violet** (`#4970f5`): 링크/아이콘 강조에 드물게 쓰는 보조 블루바이올렛.

### Text & Ink
- **Ink Navy** (`#232f4d`): 주 헤딩 색 — 딱딱하지 않게 신뢰를 담는 짙은 블루블랙.
- **Pure Black** (`#000000`): 흰 캔버스 위 본문·조밀한 읽기 텍스트.
- **Slate** (`#4f5971`): 내비게이션 링크와 보조 라벨.
- **Muted Slate** (`#9197a6`): 3차 텍스트, 캡션, 메타데이터.
- **Faint Blue-Grey** (`#bdc1ca`): 최저 강조 라벨("전체보기" 등), 비활성 텍스트, 플레이스홀더.

### Surface & Border
- **Pure White** (`#ffffff`): 페이지 배경, 카드 표면, 그라데이션/다크 히어로 위 텍스트. on-primary 텍스트 색이기도 함.
- **Surface Grey** (`#f5f8fb`): 하이라이트/기능 섹션용 쿨그레이 톤 밴드 — 주 구획 장치.
- **Hairline** (`#dee0e4`): 얇은 1px 테두리와 카드 아웃라인 — 그림자 없는 시스템의 구분 장치.

## 3. Typography Rules

### Font Family
- **Sans (all roles)**: `Pretendard` (fallback: `Pretendard Fallback`, 그다음 `-apple-system` / `system-ui`) — 헤드라인·네비·본문·UI 전체의 기본. 별도 디스플레이 서체 없음; 위계는 weight로만 표현(본문 400 → 타이틀 500 → 헤드라인 600).

### Hierarchy

| Role | Font | Size | Weight | Line Height | Color | Notes |
|------|------|------|--------|-------------|-------|-------|
| Section Heading | Pretendard | 40px (2.50rem) | 600 | 1.4 | `#232f4d` | H2 섹션 타이틀 |
| Card Title | Pretendard | 18px (1.13rem) | 500 | 1.4 | `#232f4d` | 링크/게시판/설문 카드 헤딩 (H3) |
| Nav Link | Pretendard | 20px (1.25rem) | 400 | 1.2 | `#4f5971` | 상단 네비게이션 항목 |
| Button | Pretendard | 18px (1.13rem) | 500 | 1.2 | `#ffffff` | 주요 CTA 라벨 |
| More Link | Pretendard | 20px (1.25rem) | 600 | 1.2 | `#bdc1ca` | "전체보기" more-link |
| Body | Pretendard | 16px (1.00rem) | 400 | 1.5 (24px) | `#000000` | 표준 읽기 텍스트 |

### Principles
- **폰트 하나, weight로 위계**: Pretendard가 모든 역할을 담당; 400(본문) → 600(헤드라인)의 도약이 1차 위계 신호이지 폰트 교체가 아니다.
- **헤드라인은 잉크 네이비, 순수 블랙 아님**: 헤딩은 `#232f4d`(따뜻한 블루블랙)를, 본문은 `#000000`을 사용 — 헤드라인을 프리미엄하게 유지하는 미묘한 투톤.
- **한글 우선 사이징**: 본문은 16px / 1.5 줄간격으로, 정보 밀도가 높은 교실 관리 화면에서도 한글 가독성을 넉넉히 확보.
- **그라데이션은 타입 처리**: 브랜드 그라데이션은 히어로 단어와 통계 숫자에 클립 텍스트로만 등장하고, 문단 배경을 채우는 무거운 필로는 절대 쓰지 않는다 — 컬러 에너지는 강조에만 예약.

## 4. Component Stylings

### Buttons

**Primary CTA (Outline)**
- Background: transparent
- Text: `#ffffff`
- Border: 1px solid `#ffffff`
- Radius: 8px
- Padding: 12px 16px
- Font: 18px Pretendard weight 500
- Height: 54px
- Use: "단축 URL 생성하기" 등 강조 히어로 위 outline 형태의 주 액션 버튼

### Cards & Containers

**Recent-Item Card (링크 / 게시판 / 설문)**
- Background: `#ffffff`
- Border: 1px solid `#dee0e4`
- Radius: 16px
- Shadow: none
- Use: "최근 프로젝트" 그리드의 단축 링크·칸반·설문 카드 — flat, 헤어라인 아웃라인

**Value / Feature Card (Tinted)**
- Background: `#f5f8fb`
- Text: `#232f4d`
- Radius: 16px
- Shadow: none
- Use: 하이라이트(기능 소개) 카드, 쿨그레이 톤 섹션 밴드 위

### Navigation

**Top Nav Link**
- Text: `#4f5971`
- Font: 20px Pretendard weight 400
- Padding: 12px 8px
- Height: 48px
- Active: sky-blue `#3eaeff` text
- Use: 상단 네비게이션 항목 (단축 URL 생성, 실시간 칸반, 실시간 설문, 으쓱 학급 보드, 주제별 특강, QR코드 생성, 최근 프로젝트, 설정 및 관리)

**More Link**
- Text: `#bdc1ca`
- Font: 20px Pretendard weight 600
- Use: "전체보기" 섹션 more-link (최저 강조)

### Badges

**Gradient Emphasis Pill**
- Text: `#ff5a8c`
- Radius: 9999px (full)
- Use: 강조 텍스트 / 클릭수·통계 수치의 시그니처 `#ff5a8c` → `#dc6eff` → `#00c8fa` 스윕

---

## 5. Layout Principles

### Spacing System
- Base unit: ~4px
- Scale: 4px, 8px, 12px, 16px, 24px, 40px, 64px
- Notable: 네비 링크는 12px 8px 패딩; 아웃라인 CTA는 12px 16px; 섹션 헤드라인은 40px 스텝에 안착 — 밴드 간 수직 리듬의 앵커 역할도 겸함

### Grid & Container
- 그라데이션 클립 헤드라인을 앵커로 한 중앙 정렬 단일 컬럼 히어로
- 하이라이트/기능 콘텐츠는 흰색(`#ffffff`)과 톤 그레이(`#f5f8fb`) 풀와이드 밴드를 번갈아 가며 카드로 그룹핑
- "최근 프로젝트"는 가로 카드 행/그리드 (타일당 ~280px 높이, 16px 라운드)
- 주요 CTA는 강조 히어로 위 outline 형태로 배치

### Whitespace Philosophy
- **밀도보다 여백**: 정보 밀도가 높은 관리 도구임에도 마케팅/대시보드 표면은 밴드 사이 수직 리듬을 넉넉히 준다.
- **플랫 구획**: 섹션은 배경 톤(`#f5f8fb` vs `#ffffff`)과 헤어라인(`#dee0e4`)으로만 나뉘고, 그림자나 두꺼운 테두리는 쓰지 않는다.
- **컬러 에너지는 예약**: 선명한 그라데이션은 헤드라인 단어, 통계 숫자, 얇은 강조 바에만 머물고 나머지는 차분한 흰색과 슬레이트.

### Border Radius Scale
- Small (8px): 아웃라인 CTA, 소형 컨트롤
- Medium (16px): 카드, 콘텐츠 컨테이너 — 기본형
- Pill (100px): 보조 네비게이션 pill
- Full (9999px): 그라데이션 강조 pill / 원형 칩

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | 페이지 배경, 인라인 텍스트, 대부분의 표면 |
| Tint (Level 1) | `#f5f8fb` 배경 시프트 | 엘리베이션 없는 카드/섹션 구분 |
| Hairline (Level 2) | `1px solid #dee0e4` 테두리 | 흰 카드 아웃라인, 구분선 |
| Overlay (hero) | `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))` scrim | 히어로 이미지 위 텍스트 가독성 확보용 |

**Shadow Philosophy**: kfcman.link는 그림자를 거의 쓰지 않는 시스템이다. 히어로, 네비, 헤딩, 기능 카드, 최근 항목 카드 전반에 `box-shadow: none`을 유지한다. 뎁스와 그룹핑은 오직 톤 배경(`#f5f8fb`)과 얇은 `#dee0e4` 헤어라인으로만 전달한다. 톤 있는 뎁스가 등장하는 유일한 지점은 히어로 이미지 위의 다크 톱스크림 그라데이션으로, 흰 오버레이 텍스트 가독성을 위한 기능적 장치이지 장식적 엘리베이션이 아니다. 강조가 필요하면 브랜드 그라데이션(`#3eaeff` → `#ff5a8c` → `#dc6eff`) 또는 잉크 네이비(`#232f4d`)를 쓰고, 드롭 섀도는 쓰지 않는다. 이 원칙이 관리 UI를 깔끔하고 빠르고 모바일 네이티브하게 유지시킨다.

## 7. Do's and Don'ts

### Do
- Pretendard로 전체 타입 시스템 구성 — 헤드라인 40px/600, 본문 16px/400
- 팔레트를 스카이블루(`#3eaeff`)에 앵커링하고 3단 그라데이션(`#3eaeff` → `#ff5a8c` → `#dc6eff`)은 강조 텍스트와 얇은 강조 바에만 예약
- 헤딩엔 잉크 네이비(`#232f4d`), 본문엔 순수 블랙(`#000000`)
- 섹션은 플랫 톤(`#f5f8fb`)과 `#dee0e4` 헤어라인으로 구분, 그림자 금지
- 카드는 16px 라운드 + 1px 헤어라인 아웃라인 + 그림자 없음 유지
- 페이지 대부분은 차분한 흰색/슬레이트로 유지 — 컬러 에너지는 그라데이션 강조에만
- 쿨 슬레이트 사다리(`#4f5971` → `#9197a6` → `#bdc1ca`)로 텍스트 위계 표현

### Don't
- 엘리베이션 목적의 드롭 섀도 추가 금지 — 플랫, 그림자 없는 시스템
- 넓은 표면을 선명한 그라데이션으로 채우지 말 것 — 헤드라인 단어와 통계 숫자 전용
- 헤딩에 순수 블랙(`#000000`) 사용 금지 — 헤드라인 무게감은 잉크 네이비(`#232f4d`) 전용
- 오래된 행정/관리 시스템 특유의 무거운 크롬 도입 금지
- 두 번째 디스플레이 폰트 도입 금지 — Pretendard가 모든 역할을 담당, 위계는 weight로
- 스카이블루 강조를 모든 요소에 흩뿌리지 말 것 — 단일 앵커 색으로 유지
- 카드에 각진 직각 모서리 쓰지 말 것 — 컨테이너 라운드는 16px

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | 단일 컬럼, 헤드라인 축소, 카드 스택, 네비 접힘 |
| Tablet | 640-1024px | 중간 패딩, 2단 카드 |
| Desktop | 1024-1440px | 전체 레이아웃, 중앙 정렬 히어로, 다중 컬럼 하이라이트/최근 밴드 |

### Touch Targets
- 네비 링크는 48px 높이 행에 12px 8px 패딩으로 편안하게
- 아웃라인 CTA는 54px 높이, 12px 16px 패딩 — 명확히 탭 가능
- 최근 항목 카드는 큰 풀타일 탭 타겟 (~280px)

### Collapsing Strategy
- 히어로: 그라데이션 클립 헤드라인이 모바일에서 축소되되 weight 600 유지
- 하이라이트/최근 밴드: 다중 컬럼 → 스택형 단일 컬럼
- 톤/흰색 교차 섹션은 좁은 화면에서도 풀와이드 유지
- CTA 페어는 좁은 화면에서 세로 스택

### Image Behavior
- 히어로 이미지는 모든 사이즈에서 다크 톱스크림 그라데이션으로 오버레이 텍스트 가독성 확보
- 카드/썸네일은 모든 사이즈에서 그림자 없음, 플랫 시스템과 일관
- 카드는 브레이크포인트 전반 16px 라운드 유지

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary / trust accent: Sky Blue (`#3eaeff`)
- Gradient sweep: `#3eaeff` → `#ff5a8c` → `#dc6eff` (cyan tail `#00c8fa`)
- Secondary accent: Blue-Violet (`#4970f5`)
- Heading text: Ink Navy (`#232f4d`)
- Body text: Pure Black (`#000000`)
- Nav / secondary text: Slate (`#4f5971`)
- Muted text: Muted Slate (`#9197a6`)
- Faint / disabled: Faint Blue-Grey (`#bdc1ca`)
- Background: Pure White (`#ffffff`)
- Tinted surface: Surface Grey (`#f5f8fb`)
- Hairline: `#dee0e4`

### Example Component Prompts
- "흰 배경 위 중앙 정렬 헤드라인, 40px Pretendard weight 600. 강조 단어에 그라데이션 텍스트클립: linear-gradient(270deg, #ff5a8c 60%, #dc6eff 75%, #00c8fa 100%). 본문 16px Pretendard 400, #000000. 아래엔 아웃라인 CTA: 투명 배경, 1px solid #ffffff, #ffffff 텍스트, 8px 라운드, 12px 16px 패딩, 18px/500."
- "최근 항목 카드: 흰색 #ffffff 배경, 1px solid #dee0e4 테두리, 16px 라운드, 그림자 없음. 타이틀 18px Pretendard weight 500, #232f4d."
- "하이라이트 섹션 만들기: #f5f8fb 톤 밴드, 풀와이드. 섹션 타이틀 40px Pretendard weight 600, #232f4d. 내부 카드는 #f5f8fb 톤 표면, 16px 라운드, 그림자 없음. 얇은 강조 바 linear-gradient(to right, #3eaeff, #ff5a8c, #dc6eff) 추가."
- "흰 배경 상단 네비 만들기. Pretendard 20px weight 400 링크, #4f5971 텍스트, 활성 시 스카이블루 #3eaeff. 48px 행 높이, 12px 8px 링크 패딩."

### Iteration Guide
1. 모든 역할에 Pretendard; weight가 위계 레버 (400 → 500 → 600)
2. 스카이블루(`#3eaeff`)가 단일 앵커 강조; 그라데이션은 강조 텍스트와 얇은 바 전용
3. 그림자 없음 — `#f5f8fb` 톤과 `#dee0e4` 헤어라인으로 구분
4. 카드는 16px 라운드; 아웃라인 CTA는 8px
5. 헤딩 `#232f4d` 잉크 네이비; 본문 `#000000` 순수 블랙
6. 페이지 대부분은 차분한 흰색/슬레이트로; 컬러 에너지는 그라데이션에 예약
7. 슬레이트 사다리 `#4f5971` → `#9197a6` → `#bdc1ca`로 텍스트 위계 낮추기

---

## 10. Voice & Tone

kfcman.link의 보이스는 **따뜻하고 명료하며 힘을 실어주는** 톤이다 — 매일 반복되는 학급 관리·소통 업무를, 부담이 아니라 가볍고 빠르게 해치울 수 있는 일로 재구성하는 수업 도우미다. 히어로/기능 소개는 확신에 찬 가치 중심 문구를, 실제 도구 화면(단축 URL 생성, 설문, 게시판)은 친근하고 즉시 실행 가능한 어조를 쓴다. 카피는 기술 용어를 감추지 않고 평범한 한국어로 풀어내며, 교사를 "관리당하는 대상"이 아니라 자신의 학급 데이터를 스스로 다루는 유능한 사용자로 대한다.

| Context | Tone |
|---|---|
| 히어로 / 가치 헤드라인 | 선언적, 가치 중심. "학교의 모든 연결을, 더 가볍고 빠르게." 확신에 차 있고 데이터/도구 지향적이며 겁주지 않는다. |
| 섹션 타이틀 | 평이하고 가치 지향적. "짧고 명확한 연결", "함께 만드는 수업", "바로 읽는 반응". |
| 기능 소개 | 사실 기반, 3인칭, 신뢰 구축(단축 URL·실시간 설문·협업 게시판·으쓱점수 대시보드). |
| 오류/경고 메시지 | 사람 목소리, 원인과 다음 행동을 함께 안내. 예: "일반회원은 단축 주소를 최대 50개까지만 생성할 수 있습니다. ... '우수회원👑'으로 등급업을 요청해 주세요!" |
| 기능/버튼 카피 | 결과 중심; 관리 업무 용어(단축 코드, 클릭 로그 등)를 일상어로 풀어 설명. |

**Voice samples (실제 라이브 화면에서 발췌):**
- "학교의 모든 연결을, 더 가볍고 빠르게." — 히어로 헤드라인, 가치 중심. *(2026-08-10 확인, kfcman.link)*
- "짧고 명확한 연결 / 함께 만드는 수업 / 바로 읽는 반응" — 하이라이트 섹션 타이틀 3종. *(2026-08-10 확인, kfcman.link)*
- "일반회원은 단축 주소를 최대 50개까지만 생성할 수 있습니다 ... '우수회원👑'으로 등급업을 요청해 주세요!" — 이용 한도 안내 메시지, 원인 설명 + 다음 행동 제시. *(server.js 확인)*
- "kfcman.link — 초등학교 수업 현장에서 쓰는 단축 URL 서비스 + 실시간 수업 도구 모음" — README 포지셔닝 문구. *(README.md 확인)*

**Forbidden register**: 공포 기반의 관리 압박, 정의 없는 관리자 전용 용어 남발, 사용량/제한 관련 죄책감 프레이밍, 과도한 느낌표 남발, 교사를 수동적인 "관리 대상"으로 다루는 어조.

## 11. Brand Narrative

kfcman.link는 초등학교 실제 수업 현장에서 시작된 단축 URL 서비스다. 교사들이 매 수업 학생들에게 긴 링크(설문지, 발표 자료, 공유 문서)를 손으로 옮겨 적거나 QR을 다시 만들어야 했던 반복 업무를 줄이자는, 단순하지만 현실적인 문제의식에서 출발했다. 링크를 짧게 줄이는 기본 기능에서 시작해, 실시간 설문 광장·협업 게시판(칸반)·학급 "으쓱점수" 대시보드·테트리스 대전 같은 수업 중 바로 꺼내 쓰는 도구들을 한 계정으로 묶는 방향으로 확장했다. 히어로 카피 "학교의 모든 연결을, 더 가볍고 빠르게."가 이 방향을 그대로 요약한다: 학교에서 오가는 모든 연결(링크, 설문, 소통, 피드백)을 데이터로 가볍게 만들면, 수업 준비는 부담이 아니라 몇 번의 클릭으로 끝나는 일이 될 수 있다는 믿음이다.

회원 등급(일반/우수회원/관리자) 구조와 학교별 관리자 콘솔은, 소규모 학급 운영에서 실제로 필요한 이용량 통제(스팸/유해링크 차단, 이용 한도, 계정 관리)를 데이터 중심으로 다루면서도 절차를 무겁게 만들지 않으려는 시도다. 관통하는 축은 속도다: 만들고, 공유하고, 실시간으로 반응을 확인한다.

kfcman.link가 거부하는 것은 옛 학교 행정 시스템 특유의 무겁고 관료적인 크롬과, 사용량 제한을 겁주듯 안내하는 어조다. 대신 받아들이는 것은 — 플랫하고 빠른 모바일 네이티브 인터페이스; 신뢰감 있는 스카이블루를 핑크-퍼플 그라데이션으로 데운 팔레트; 그리고 기술 용어를 숨기지 않고 풀어서 설명하는 카피다.

## 12. Principles

1. **부담을 가볍게 재구성한다.** 학급 관리·소통은 딱딱한 행정 업무가 아니라 가볍고 빠르게 끝내는 일이어야 한다. *UI implication:* 신뢰감 있는 스카이블루를 핑크-퍼플 그라데이션으로 데우고, 표면은 플랫하고 여백 있게, 모바일 네이티브하게 — 옛 행정 소프트웨어의 무거운 크롬은 절대 쓰지 않는다.
2. **연결을 읽기 쉽게 만든다.** 서비스의 가치는 흩어진 링크·설문·소통을 하나의 짧고 명확한 흐름으로 만드는 데 있다. *UI implication:* 그라데이션/컬러 에너지는 정말 중요한 숫자와 헤드라인에만 예약하고, 나머지는 차분한 흰색과 슬레이트로 두어 정보가 먼저 읽히게 한다.
3. **설명하되, 위협하지 않는다.** 이용 한도·권한 같은 관리 용어는 평범한 말로 풀어 설명한다. *UI implication:* 모든 제한/경고 메시지는 원인과 다음 행동을 함께 안내한다; 카피는 설명하지, 겁주거나 가로막지 않는다.
4. **절제로 신뢰를 만든다.** 신뢰는 장식이 아니라 차분한 정밀함에서 온다. *UI implication:* 그림자 없음; 잉크 네이비 헤딩; 헤어라인 구분 — 그 아래 데이터가 꼼꼼하다는 시각적 근거.
5. **앵커 하나, 시그니처 하나.** 스카이블루(`#3eaeff`)는 신뢰 색, 3단 그라데이션은 기억에 남는 시그니처. *UI implication:* 둘 다 희석하지 말 것 — 앵커는 단일하게, 그라데이션은 강조에만 예약해서 유지한다.

## 13. Personas

*아래 페르소나는 kfcman.link의 실제 회원 등급(일반회원/우수회원/관리자)과 관찰 가능한 기능(단축 URL, 실시간 설문, 협업 게시판, 으쓱점수 대시보드)에 근거한 가상의 원형이며, 특정 실존 인물을 가리키지 않는다.*

**박선생, 34, 초등 3학년 담임.** 매 수업 구글폼·발표 자료 링크를 학생들에게 나눠주는 게 일이었다. kfcman.link로 QR 하나 찍으면 바로 접속되니 수업 준비 시간이 줄었다. 이용 한도(50개) 안내를 보고 우수회원 등급업을 문의했다.

**김학생, 10, 4학년.** 로그인 없이 선생님이 공유한 실시간 설문에 참여하고, 학급 칸반 보드에 모둠 아이디어 카드를 올린다. 화면이 알록달록하고 바로 반응이 보여서 수업이 지루하지 않다고 느낀다.

**이관리자, 41, 학교 정보부장.** 전교 계정을 관리자 콘솔에서 승인·차단하고, 유해 링크 자동 차단과 이용량 모니터링으로 학교 전체의 링크 사용을 관제한다. 절차가 무겁지 않고 한눈에 상태가 보이는 걸 중요하게 생각한다.

## 14. States

| State | Treatment |
|---|---|
| **Empty (링크 없음)** | 흰 캔버스. 잉크 네이비(`#232f4d`) 한 줄로 첫 단축 링크 생성을 권유, 스카이블루(`#3eaeff`) CTA 하나. 겁주는 일러스트 없이 차분하고 권유하는 톤. |
| **Empty (검색/필터 결과 없음)** | 뮤트 슬레이트(`#9197a6`) 한 줄로 조건에 맞는 항목이 없음을 안내, 필터 초기화 경로 제공. 담백하고 절제된 톤. |
| **Loading (목록 조회)** | `#f5f8fb` 톤 표면 위 최종 16px 라운드 크기의 스켈레톤 카드. 그림자 시머 없는 플랫 펄스 — 그림자 없는 시스템과 일관. |
| **Loading (통계 계산)** | 카드 내 인라인 진행 표시; 이전 값이 계속 보여 통계 화면이 비어 보이지 않게 유지. |
| **Error (데이터 저장 실패)** | 잉크 네이비(`#232f4d`) 인라인 메시지에 평범한 말로 원인 설명 + 재시도 — 맨 "오류가 발생했습니다"만 던지지 않는다. 다음 행동을 명시. |
| **Error (입력값 검증)** | 입력 필드 아래 무엇이 유효한지 설명하는 필드 레벨 메시지, 단순히 "필수"만 표시하지 않음. 따뜻하고 비난하지 않는 톤. |
| **Success (링크 생성 / 목표 달성)** | 차분하고 격려하는 톤의 짧은 인라인 확인; 통계 수치에 그라데이션 강조를 잠깐 사용할 수 있음. 공포/죄책감 프레이밍 없음, 과한 이모지 없음. |
| **Skeleton** | `#f5f8fb` 블록, 최종 크기, 16px 라운드, 플랫 펄스. |
| **Disabled** | 페인트 블루그레이(`#bdc1ca`) 텍스트에 저채도 표면; 스카이블루 액션은 회색으로 바뀌지 않고 페이드되어 브랜드 색을 유지. |

## 15. Motion & Easing

**Durations**:

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 120ms | 호버, 탭 피드백, 포커스 |
| `motion-standard` | 220ms | 카드/섹션 등장, 시트, 드롭다운 |
| `motion-slow` | 320ms | 페이지 레벨 전환, 히어로 등장, 그라데이션 스윕인 |

**Easings**:

| Token | Curve | Use |
|---|---|---|
| `ease-enter` | `cubic-bezier(0.2, 0.6, 0.25, 1)` | 등장 — 카드, 시트, 데이터 노출 |
| `ease-exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | 닫힘/해제 |
| `ease-standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 양방향 전환 |

**Motion rules**: 모션은 기능적이고 차분하다 — 플랫하고 빠르고 신뢰 우선인 미학과 일관. 카드와 데이터 뷰는 `motion-standard / ease-enter`로 아래에서 페이드인; 시그니처 그라데이션은 히어로 등장 시 `motion-slow`로 한 번 스윕인한 뒤 정지한다. 바운스나 스프링 없음 — 학급 관리 도구는 안정감과 신뢰를 신호해야지, 장난스러운 즐거움을 신호하지 않는다. `prefers-reduced-motion: reduce`에서는 모든 전환이 즉시로 축소되고 그라데이션은 정적으로 렌더링된다; 기능은 완전히 유지된다.

<!--
omd:bootstrap-sources — kfcman.link DESIGN.md

Base reference: Dr.diary (drdiary), .claude/data/references/drdiary/DESIGN.md — tokens (§1-9)
copied verbatim (no delta_set customization requested; no live-capture override run on
kfcman.link at bootstrap time).

Philosophy layer (§10-15) sourced from project-provided facts, not fabricated:
- README.md: project positioning ("초등학교 수업 현장에서 쓰는 단축 URL 서비스 + 실시간 수업 도구 모음"),
  feature list (단축 URL, 실시간 설문, 협업 게시판, 으쓱점수 대시보드), member roles (일반/우수회원/관리자),
  usage-limit copy quoted from server.js.
- Live site inspection (2026-08-10, kfcman.link): hero headline "학교의 모든 연결을, 더 가볍고 빠르게.",
  highlight section titles ("짧고 명확한 연결" / "함께 만드는 수업" / "바로 읽는 반응").
- Personas (§13) are fictional archetypes informed by the app's own role system (일반회원/우수회원/관리자)
  and observed features; names are illustrative and do not refer to real people.
- Interpretive claims (e.g. "부담을 가볍게 재구성한다", "절제로 신뢰를 만든다") are editorial readings
  connecting kfcman.link's observed design/copy to the Dr.diary reference's philosophy pattern, not
  quoted kfcman.link statements.
-->
