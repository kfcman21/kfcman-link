# kfcman.link

초등학교 수업 현장에서 쓰는 단축 URL 서비스 + 실시간 수업 도구 모음입니다. 긴 링크를 짧게 줄이는 것 외에도, 실시간 설문, 협업 게시판(칸반), 학급 "으쓱점수" 대시보드, 테트리스 대전 등 수업 중 바로 꺼내 쓰는 도구들을 한 계정으로 묶어 제공합니다.

## 주요 기능

### 🔗 단축 URL
- 로그인한 회원별로 링크를 생성·수정·삭제하고, 클릭 통계(유입 경로, 시간대별 로그)를 확인
- 일반회원은 자동 생성 코드만, **우수회원**은 한글 지원 커스텀 코드까지 사용 가능
- QR 코드 즉시 생성 및 이미지 다운로드
- 유해 사이트·욕설 별칭 자동 차단

### 👥 회원 시스템
- 가입 신청 → 관리자 승인 방식의 회원제 (`/api/register`, `/api/admin/pending`, `/api/admin/approve`)
- 역할(일반회원 / 우수회원 / 관리자) 및 이용량 기반 제한 관리
- 관리자 패널에서 사용자 차단·경고·비밀번호 초기화·메시지 발송 지원

### 🗳️ 실시간 설문 광장
- 로그인 없이도 참여 가능한 즉석 투표(선호도 도넛, 워드클라우드, 개방형 질문 등)
- 실시간 집계 및 재투표 지원

### 🧩 실시간 협업 게시판 (kfcman-wall)
- 수업 중 학생 아이디어를 칸반 보드로 수집·정리
- 카드별 댓글·좋아요, AI 이미지 생성, 요약, 공지 고정 등

### 🏅 으쓱점수 학급 대시보드
- 학급 명렬표 기반 스티커 점수 부여, 학급 온도계 달성 이벤트

### 🕹️ 테트리스 대전
- WebSocket(`ws`) 기반 실시간 멀티플레이어 대전, 참가 코드로 입장 제한

### 🎨 디자인 시스템
- 단일 강조색(clay-grass, 민트/그린 계열)으로 통일된 라이트/다크 테마

## 기술 스택

- **백엔드**: Node.js + Express (`server.js`), 자체 JSON 파일 기반 저장소(`database.js`)
- **실시간**: `ws` (테트리스 대전)
- **프런트엔드**: 정적 HTML + Tailwind CSS(Play CDN) + Vanilla JS (`public/js/app.js`)
- **AI 연동**: Google Gemini / Imagen (게시판 이미지 생성, 주제 추천 등)
- **레거시 호환**: `public/api.php` — dothome 등 PHP 전용 정적 호스팅 환경을 위한 축소판 API (단일 관리자 비밀번호 기반, 회원별 소유권 없음)

## 프로젝트 구조

```
server.js           # Node.js/Express 메인 백엔드 (실제 운영 서버)
database.js         # JSON 파일 기반 데이터 저장소 (users, links, polls, wall ...)
tetris-server.js     # 테트리스 대전 WebSocket 서버
public/, www/        # 정적 프런트엔드 — 두 폴더는 항상 동일하게 유지합니다
  ├─ index.html
  ├─ js/app.js
  ├─ css/style.css
  ├─ api.php          # PHP 전용 호스팅용 축소 API (레거시)
  └─ redirect.php      # PHP 전용 호스팅용 단축 링크 리다이렉트
data/db.json          # 런타임 데이터베이스 (git에 포함되지 않음)
config.json           # 관리자 비밀번호 · Gemini API 키 (git에 포함되지 않음)
```

> ⚠️ `public/`과 `www/`는 배포 환경에 따라 동일한 정적 자산을 담고 있어야 합니다. 한쪽만 수정하고 다른 쪽을 빼먹지 않도록 주의하세요.

## 시작하기

### 요구 사항
- Node.js 18 이상

### 설치 및 설정
```bash
npm install
cp config.json.example config.json
# config.json을 열어 adminPassword, geminiApiKey를 실제 값으로 채워주세요
```

### 실행
```bash
npm start
```
기본적으로 `server.js`가 정적 파일 서빙과 API를 함께 담당합니다.

## 보안 참고사항

- `config.json`, `data/db.json`, `.env`는 `.gitignore`에 등록되어 있으며 **절대 커밋하지 마세요**. 실제 비밀번호·API 키가 담깁니다.
- 저장소가 public일 경우, 과거 커밋 히스토리에 시크릿이 남아있지 않은지 주기적으로 확인해 주세요.

## 라이선스

비공개 개인/학급 운영 프로젝트입니다 (`package.json`의 `"private": true` 참고).
