# PickS — AI 쇼핑 큐레이터

> "수천 개의 상품 대신 당신에게 딱 맞는 것만 픽(Pick)해드립니다"

## 시연 영상

<video src="https://raw.githubusercontent.com/yurimeeee/smart-shopping-agent/main/public/picks_demo.mp4" controls autoplay muted loop playsinline width="100%"></video>

## 소개

**PickS**는 네이버 쇼핑 실시간 검색 결과에 Gemini AI 분석을 붙인 개인 맞춤형 쇼핑 큐레이터입니다.

쇼핑할 때 검색 결과가 너무 많아 비교가 피곤하거나, 리뷰는 많은데 핵심만 골라 읽기 어렵거나, 가격/스펙/배송을 비교하려고 탭을 여러 개 띄워야 했던 경험에서 시작했습니다. PickS에서는 원하는 걸 자연어로 한 번 말하면 실제 상품 검색부터 장단점 분석, 스펙 비교, 리뷰 요약까지 한 화면에서 끝납니다.

## 주요 기능

- **AI 쇼핑 채팅**: Gemini와 자연어로 대화하며 상품 추천 요청
- **실시간 상품 분석**: 네이버 쇼핑 검색 결과를 Gemini가 분석해 장단점과 AI 추천 지수 제공
- **상품 비교 테이블**: 스펙·가격·배송·AI 종합 점수를 한 화면에서 비교
- **리뷰 감성 분석**: 리뷰를 긍정/부정 키워드로 압축 요약
- **관심상품 위시리스트**: 상품 저장, 카테고리/가격 하락 필터, 모바일 그리드 선택
- **소비 리포트**: 관심상품 기반 예상 소비 패턴 시각화
- **취향 프로필**: 소비 성향·라이프스타일 태그로 추천 개인화
- **드래그 리사이즈 패널**: 채팅·분석 패널 너비 자유 조절 (데스크톱)
- 모바일/데스크톱 반응형 레이아웃

## 기술 스택

**Frontend**: Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4, Zustand, Radix UI / shadcn/ui, Recharts

**Backend / API**: Next.js Route Handlers, Google Gemini AI (`gemini-2.5-flash` 채팅 스트리밍, `gemini-2.0-flash` 상품 분석 구조화 출력), Naver Shopping Search API

**인프라 / 데이터**: Firebase Authentication (Google OAuth), Firebase Firestore (대화, 관심상품, 취향 프로필 저장)

## 실행 방법

### 사전 준비

1. [Firebase 프로젝트 생성](https://console.firebase.google.com) → Authentication(Google), Firestore 활성화
2. [Google AI Studio](https://aistudio.google.com)에서 Gemini API 키 발급
3. [네이버 개발자센터](https://developers.naver.com/apps)에서 검색 API 앱 등록 (Client ID/Secret 발급)

### 설치 및 실행

```bash
git clone https://github.com/yurimeeee/smart-shopping-agent.git
cd smart-shopping-agent

pnpm install   # 또는 npm install

cp .env.example .env.local
# .env.local 에 Firebase, Gemini, Naver API 키 입력

pnpm dev       # http://localhost:3000
```

### 환경변수 목록 (`.env.local`)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

## 배포 URL

🔗 https://smart-shopping-agent-34al.vercel.app/

## 주의사항

> Gemini API를 무료 티어로 사용 중이라 일일/분당 토큰·요청 한도가 있습니다. 시연 중 AI 채팅이나 상품 분석 응답이 오지 않는다면 버그보다는 **토큰 사용량 초과**일 가능성이 높습니다. 잠시 후 다시 시도해 주세요.

## 테스트 계정 정보

| 항목 | 값 |
|------|-----|
| 이메일 | test@picks.com |
| 비밀번호 | test1234 |

Google 계정으로 소셜 로그인도 가능합니다.

## 동작 구조

사용자가 채팅에 메시지를 보내면 두 가지가 동시에 진행됩니다.

1. **채팅 응답** — `POST /api/chat`이 Gemini 2.5-flash에 취향 프로필을 포함한 시스템 프롬프트를 전달하고, 응답을 스트리밍으로 받아 채팅 패널에 바로 표시합니다.
2. **상품 분석** — 메시지에 상품 관련 키워드가 있으면 `POST /api/products`가 병렬로 실행됩니다. 네이버 쇼핑 API로 실제 상품 5개를 검색한 뒤, Gemini 2.0-flash에 `responseSchema`로 구조화 출력을 강제해 장단점·추천 점수·스펙 비교·리뷰 요약을 뽑아냅니다. 네이버에서 받은 이미지/가격/링크와 Gemini 분석 결과를 합쳐 워크스페이스 패널에 표시하고, Firestore에 대화별로 저장합니다.

인증은 Firebase Auth(Google 로그인)로 처리하고, 대화 기록과 관심상품, 취향 프로필은 모두 `users/{uid}` 하위에 Firestore로 저장해 유저별로 완전히 분리됩니다. 위시리스트 페이지는 `onSnapshot`으로 실시간 구독합니다.

## 본인이 중점적으로 구현한 부분

**Naver Shopping + Gemini 하이브리드 분석 파이프라인** — LLM이 상품을 지어내는 대신, 실제 존재하는 상품을 먼저 검색하고 그 결과를 Gemini가 분석하도록 설계했습니다. `responseSchema`로 JSON 출력을 강제해 파싱이 깨지지 않도록 했습니다.

**드래그 리사이즈 패널** — CSS Grid 대신 flex + pixel width 방식으로 바꾸고, `useRef` + `useEffect` 동기화로 stale closure 문제를 해결했습니다. 사이드바 토글 시 초기 너비 계산 타이밍은 `requestAnimationFrame`으로 보정했습니다.

**유저별 상태 완전 격리** — Zustand persist 범위를 theme으로만 제한하고, `onAuthStateChanged`에서 UID 변경을 감지하면 전역 상태를 초기화합니다. 취향 프로필은 localStorage가 아니라 Firestore `users/{uid}/profile/taste`에 저장합니다.

**이미지 프록시 서버** — `/api/image-proxy`로 네이버 CDN 이미지를 서버 사이드에서 받아와 핫링크 차단을 우회하고 캐시 헤더를 붙였습니다.

## 구현하지 못한 부분

- 실제 리뷰 데이터 연동: 지금 리뷰 요약은 Gemini가 추정한 값이고, 실제 크롤링/API 기반 데이터는 아닙니다
- 가격 히스토리 추적 및 알림 미구현
- Coupang / 29CM 등 타 플랫폼 직접 연동 (비공개 API라 네이버 쇼핑 경유만 가능)
- 소비 리포트는 더미 데이터 기반, 실 구매 내역 연동 미구현
- 단위/통합 테스트 미작성

## 향후 개선 방향

- 멀티턴 대화 컨텍스트: 이전 대화를 Gemini 컨텍스트에 누적해 맥락 기반 추천
- 가격 알림: Cloud Functions + FCM으로 관심상품 가격 하락 푸시
- 구매 이력 연동: 영수증 OCR 또는 이메일 파싱으로 실제 소비 리포트 생성
- 상품 URL 붙여넣으면 바로 분석하는 기능
- 여러 상품을 직접 골라 커스텀 비교표 만들기

## AI 개발 도구 활용 여부

**Claude Code (Anthropic)**을 주요 개발 도구로 활용했습니다. 컴포넌트 설계·구현(위시리스트 리디자인, 드래그 리사이즈 패널, 모바일 반응형 UI), 버그 디버깅(stale closure, 이미지 CDN 차단, 유저 상태 격리), Firestore 데이터 구조 설계, Gemini 구조화 출력 스키마 및 네이버 API 연동 파이프라인 구현, 커밋 메시지 작성 등에 사용했습니다.

코드 생성 비율은 높지만 전체 아키텍처 결정, 기능 방향, 디버깅 판단 등 핵심 의사결정은 직접 했습니다.
