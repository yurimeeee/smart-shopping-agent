# PickS — AI 쇼핑 큐레이터

> "수천 개의 상품 대신 당신에게 딱 맞는 것만 픽(Pick)해드립니다"

---

## 시연 영상

<video src="public/picks_demo.mp4" controls autoplay muted loop playsinline width="100%"></video>

---

## 서비스명 및 한 줄 소개

**PickS** — 네이버 쇼핑 실시간 검색 + Gemini AI 분석을 결합한 개인 맞춤형 AI 쇼핑 큐레이터 플랫폼

---

## 문제 정의

온라인 쇼핑 시 다음과 같은 문제가 반복됩니다.

- 검색 결과가 수백~수천 개로 비교 자체가 피로함
- 리뷰가 많아도 핵심 정보를 추출하기 어려움
- 가격·스펙·배송 조건을 여러 탭을 오가며 직접 비교해야 함
- 취향과 상황에 맞는 추천을 받을 수 없음

PickS는 이 과정을 AI와의 자연어 대화 한 번으로 압축합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 쇼핑 채팅 | Gemini AI와 자연어 대화로 상품 추천 요청 |
| 실시간 상품 분석 | 네이버 쇼핑 API 검색 결과를 Gemini가 분석, 장단점·AI 추천 지수 제공 |
| 상품 비교 테이블 | 스펙·가격·배송·AI 종합 점수를 한 화면에서 비교 |
| 리뷰 감성 분석 | 수천 건 리뷰를 긍정/부정 키워드로 압축 요약 |
| 관심상품 위시리스트 | 상품 저장, 카테고리·가격 하락 필터, 모바일 그리드 선택 |
| 소비 리포트 | 관심상품 기반 예상 소비 패턴 시각화 |
| 취향 프로필 | 소비 성향·라이프스타일 태그 설정 → AI 추천 개인화 |
| 드래그 리사이즈 패널 | 채팅·분석 패널 너비 자유 조절 (데스크톱) |
| 반응형 UI | 모바일/데스크톱 레이아웃 완전 지원 |

---

## 사용 기술 스택

**Frontend**
- Next.js 16 (App Router, React 19)
- TypeScript
- Tailwind CSS v4
- Zustand (전역 상태 관리)
- Radix UI / shadcn/ui (컴포넌트)
- Recharts (차트)

**Backend / API**
- Next.js Route Handlers (서버리스 API)
- Google Gemini AI (`gemini-2.5-flash` 채팅 스트리밍, `gemini-2.0-flash` 상품 분석 구조화 출력)
- Naver Shopping Search API (실제 상품 검색 + 이미지)

**인프라 / 데이터**
- Firebase Authentication (Google OAuth)
- Firebase Firestore (대화, 관심상품, 취향 프로필 저장)

---

## 실행 방법

### 사전 준비

1. [Firebase 프로젝트 생성](https://console.firebase.google.com) → Authentication(Google), Firestore 활성화
2. [Google AI Studio](https://aistudio.google.com)에서 Gemini API 키 발급
3. [네이버 개발자센터](https://developers.naver.com/apps)에서 검색 API 앱 등록 (Client ID/Secret 발급)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/yurimeeee/smart-shopping-agent.git
cd smart-shopping-agent

# 패키지 설치
pnpm install   # 또는 npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 에 Firebase, Gemini, Naver API 키 입력

# 개발 서버 실행
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

---

## 배포 URL

🔗 https://smart-shopping-agent-34al.vercel.app/

---

## 테스트 계정 정보

| 항목 | 값 |
|------|-----|
| 이메일 | test@picks.com |
| 비밀번호 | test1234 |

또는 **Google 계정으로 소셜 로그인**도 가능합니다.

---

## LLM / Agent 동작 구조

```
사용자 입력 (자연어 쿼리)
        │
        ├─ [채팅 응답] ──────────────────────────────────────────┐
        │   POST /api/chat                                        │
        │   └─ Gemini 2.5-flash (스트리밍)                       │
        │       시스템 프롬프트: 쇼핑 큐레이터 역할 + 취향 컨텍스트  │
        │       → 텍스트 스트림으로 즉시 응답                      │
        │                                                         ▼
        │                                               채팅 패널에 실시간 표시
        │
        └─ [상품 분석] (상품 관련 키워드 감지 시 병렬 실행)
            POST /api/products
            │
            ├── Step 1: Naver Shopping API 검색
            │   쿼리로 실제 상품 5개 fetch
            │   → 상품명, 브랜드, 가격, 이미지, 링크
            │
            ├── Step 2: Gemini 2.0-flash 분석 (구조화 출력)
            │   실제 상품 데이터를 프롬프트로 전달
            │   responseSchema로 JSON 강제 출력:
            │   → 장점/단점, AI 추천 점수(0~100), 태그
            │   → 스펙 비교 테이블, 리뷰 감성 요약
            │
            └── Step 3: 병합 & 반환
                Naver 데이터(이미지/가격/링크) + Gemini 분석 결합
                → 워크스페이스 패널에 큐레이션/비교/리뷰 탭으로 표시
                → Firestore에 대화별 분석 결과 저장
```

---

## 데이터 흐름

```
[사용자]
  │
  │ 1. Google 로그인
  ▼
[Firebase Auth] ──── UID 반환 ──────────────────────────────┐
                                                             │
  │ 2. 쇼핑 질문 입력                                         │
  ▼                                                          │
[ChatPanel]                                                  │
  ├── POST /api/chat ──► Gemini Stream ──► 텍스트 응답         │
  │   Firestore: users/{uid}/chats/{chatId}/messages 저장     │
  │                                                           │
  └── POST /api/products (병렬)                               │
        │                                                     │
        ├── Naver Shopping API ──► 실제 상품 목록              │
        │                                                     │
        ├── Gemini API ──► 구조화 분석 JSON                   │
        │                                                     │
        └── 병합 결과                                          │
              │                                               │
              ├── WorkspacePanel 업데이트 (Zustand)            │
              └── Firestore: chats/{chatId}.analysis 저장     │
                                                              │
  │ 3. 관심상품 추가                                           │
  ▼                                                           │
[Firestore] users/{uid}/favorites ◄──────────────────────────┘
  │
  ▼
[위시리스트 페이지] onSnapshot 실시간 구독
  │
  └── [취향 프로필] users/{uid}/profile/taste 유저별 독립 저장
```

---

## 본인이 중점적으로 구현한 부분

**1. Naver Shopping + Gemini 하이브리드 분석 파이프라인**
- LLM이 가상 상품을 생성하는 대신, 실제 존재하는 상품을 검색 후 Gemini가 분석하는 구조로 설계
- `responseSchema`를 활용한 구조화 출력으로 안정적인 JSON 파싱 보장

**2. 드래그 리사이즈 패널**
- CSS Grid 대신 flex + pixel width 방식으로 전환
- `useRef` + `useEffect` 동기화 패턴으로 stale closure 문제 해결
- `requestAnimationFrame`으로 사이드바 토글 시 초기 너비 계산 타이밍 보정

**3. 유저별 상태 완전 격리**
- Zustand persist 범위를 theme만으로 제한
- `onAuthStateChanged`에서 UID 변경 감지 시 전역 상태 초기화
- 취향 프로필을 localStorage가 아닌 Firestore `users/{uid}/profile/taste`에 저장

**4. 이미지 프록시 서버**
- `/api/image-proxy`를 통해 Naver CDN 이미지를 서버 사이드에서 fetch
- CDN 핫링크 차단 우회 + 캐시 헤더 적용

---

## 구현하지 못한 부분

- **실제 리뷰 데이터 연동**: 현재 리뷰 요약은 Gemini가 추정하는 값으로, 실제 크롤링/API 기반 리뷰 데이터가 아님
- **가격 히스토리 추적**: 관심상품 추가 시 가격 변동 이력 저장 및 알림 미구현
- **Coupang / 29CM 등 플랫폼 직접 연동**: 비공개 API로 인해 네이버 쇼핑 경유만 가능
- **소비 리포트 실데이터**: 현재 더미 데이터 기반, 실제 구매 내역 연동 미구현
- **테스트 코드**: 단위/통합 테스트 미작성

---

## 향후 개선 방향

- **멀티턴 대화 컨텍스트**: 이전 대화 내용을 Gemini 컨텍스트로 누적하여 맥락 기반 추천
- **가격 알림**: Cloud Functions + FCM으로 관심상품 가격 하락 푸시 알림
- **구매 이력 연동**: 영수증 이미지 OCR 또는 이메일 파싱으로 실제 소비 리포트 생성
- **상품 URL 직접 분석**: 쿠팡/네이버 상품 URL 붙여넣기 → 해당 상품 즉시 분석
- **비교 즐겨찾기**: 여러 상품을 직접 선택해 커스텀 비교표 생성

---

## AI 개발 도구 활용 여부

**Claude Code (Anthropic)** 를 주요 개발 도구로 활용했습니다.

- 컴포넌트 설계 및 구현 (위시리스트 리디자인, 드래그 리사이즈 패널, 모바일 반응형 UI 등)
- 버그 디버깅 (stale closure, 이미지 CDN 차단, 유저 상태 격리 문제 등)
- Firebase Firestore 데이터 구조 설계 및 CRUD 함수 작성
- Gemini API 구조화 출력 스키마 설계 및 Naver Shopping API 연동 파이프라인 구현
- git 커밋 메시지 작성

코드 생성 비율이 높으나, 전체 아키텍처 결정, 기능 방향 설정, 디버깅 판단 등 핵심 의사결정은 직접 수행했습니다.
