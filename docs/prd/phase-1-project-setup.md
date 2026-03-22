# Phase 1: 프로젝트 셋업 PRD

## 목표
Expo + Firebase 기반의 프로젝트 초기 구조를 세팅하고, 개발 환경을 구성한다.

## 범위

### 1. Expo 프로젝트 초기화
- Expo SDK 최신 버전 사용
- TypeScript 기반
- pnpm 패키지 매니저
- 기본 네비게이션 구조 설정 (Expo Router)
  - `/` — 달력 화면 (메인)
  - `/settings` — 설정 화면

### 2. Firebase 연동
- Firebase 프로젝트 생성은 사용자가 직접 수행 (가이드 제공)
- 앱에 Firebase SDK 설치 및 초기화 코드 작성
- 환경 변수(`.env`)에서 Firebase 설정값을 읽도록 구성 (`expo-constants`)
- Firestore 연결 확인용 테스트 코드

### 3. 프로젝트 구조
```
payment-calendar/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/
│   │   ├── index.tsx       # 달력 화면
│   │   └── settings.tsx    # 설정 화면
│   └── _layout.tsx         # 루트 레이아웃
├── components/             # 공통 컴포넌트
├── services/               # Firebase, API 관련
│   └── firebase.ts         # Firebase 초기화 + 설정 (환경 변수에서 읽음)
├── hooks/                  # 커스텀 훅 (Firebase 구독 등)
├── parsers/                # 은행별 알림 파싱 모듈 (이후 단계에서 구현)
├── types/                  # TypeScript 타입 정의
│   └── payment.ts          # 결제 데이터 타입
├── constants/              # 상수 정의
├── docs/                   # PRD 등 문서
│   └── prd/
├── .env                    # Firebase 설정값 등 환경 변수 (gitignore 대상)
├── .npmrc                  # pnpm hoisted 설정 (완료)
└── app.json                # Expo 설정
```

### 4. 데이터 타입 사전 정의
```typescript
interface Payment {
  id: string;
  amount: number;            // 결제 금액
  date: string;              // 결제 날짜 (YYYY-MM-DD, 달력 조회용)
  time: string;              // 결제 시각 (HH:mm:ss)
  bank: string;              // 은행/카드사 코드
  storeName?: string;        // 가맹점명 (추후 활용)
  category?: string;         // 카테고리 (추후 활용)
  userId: string;            // 결제자 ID
  groupId: string;           // 공유 그룹 ID
  createdAt: string;         // 생성 시각 (ISO 8601)
}
```

> **참고**: 결제 취소 처리 방식(soft delete vs 실제 삭제)은 4단계에서 결정한다.

### 5. 환경 설정
- `.gitignore`에 Firebase 설정 파일, 환경 변수 파일 추가
- ESLint, Prettier 기본 설정

## 이 단계에서 하지 않는 것
- Firebase 인증 구현 (2단계)
- 달력 UI 구현 (3단계)
- 은행 파싱 로직 구현 (5단계)
- 실제 Firestore 데이터 읽기/쓰기 (4단계)

## 완료 조건
- [ ] Expo 앱이 시뮬레이터에서 정상 실행
- [ ] 탭 네비게이션으로 달력/설정 화면 전환 가능
- [ ] Firebase 초기화 코드 작성 완료
- [ ] Payment 타입 정의 완료
- [ ] parsers 디렉토리 구조 준비 (빈 모듈)
