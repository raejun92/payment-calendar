# Phase 2: 인증 + 그룹 공유 PRD

## 목표
간단한 인증과 부부 간 달력 공유를 위한 그룹 기능을 구현한다.

## 배경
- 현재 사용자는 본인과 와이프, 2명만 사용 예정
- 인증은 최대한 간단하게 처리하고, 앱이 안정되면 추후 강화
- Firebase Auth + Firestore를 활용

## 범위

### 1. 인증 방식: 이메일/비밀번호 로그인
- Firebase Authentication의 이메일/비밀번호 방식 사용
- 회원가입 화면 (이메일, 비밀번호, 이름 입력 — 결제자 구분에 사용)
- 로그인 화면
- 로그아웃 (설정 화면에서)
- 로그인 상태 유지 (앱 재시작 시 자동 로그인)

> 추후 Google/Apple 로그인 등으로 확장 가능

### 2. 그룹 (가계부 공유)
- 사용자가 **그룹을 생성**하면 6자리 초대 코드가 생성됨
- 다른 사용자가 **초대 코드를 입력**하면 같은 그룹에 참여
- 같은 그룹의 결제 내역이 실시간으로 공유됨
- 한 사용자는 하나의 그룹에만 소속 가능

### 3. Firestore 데이터 구조
```
users/
  {userId}/
    email: string
    displayName: string
    groupId: string | null
    createdAt: timestamp

groups/
  {groupId}/
    name: string
    inviteCode: string        // 6자리 랜덤 코드
    expiresAt: timestamp | null  // 초대 코드 만료 시간 (현재는 null = 만료 없음, 추후 확장용)
    maxMembers: number        // 최대 인원 (현재 기본값: 2, 추후 확장용)
    memberIds: string[]
    createdBy: string         // userId
    createdAt: timestamp
```

### 4. 화면 흐름
```
앱 시작
  ├── 로그인 안 됨 → 로그인 화면
  │     ├── 로그인
  │     └── 회원가입 → 그룹 설정 화면
  │           ├── 새 그룹 만들기 → 초대 코드 표시
  │           └── 초대 코드 입력 → 그룹 참여
  └── 로그인 됨
        ├── 그룹 있음 → 달력 화면 (메인)
        └── 그룹 없음 → 그룹 설정 화면
```

### 5. 화면 구성
- `app/auth/login.tsx` — 로그인 화면
- `app/auth/register.tsx` — 회원가입 화면
- `app/group/setup.tsx` — 그룹 생성/참여 화면
- 설정 화면에 로그아웃 버튼, 그룹 정보(초대 코드) 표시 추가

### 6. 인증 상태 관리
- **AuthContext Provider** 패턴 사용
- 앱 전체에서 인증 상태(로그인 여부, 유저 정보, 그룹 정보)를 참조 가능
- `use-auth` 훅을 통해 각 화면에서 간편하게 접근

### 7. 프로젝트 구조 추가
```
contexts/
  └── auth-context.tsx      # AuthContext Provider
services/
  ├── firebase.ts           # 기존
  └── auth.ts               # 인증 관련 함수
hooks/
  └── use-auth.ts           # AuthContext를 사용하는 훅
types/
  ├── payment.ts            # 기존
  └── user.ts               # User, Group 타입 정의
```

## 이 단계에서 하지 않는 것
- 비밀번호 재설정
- 프로필 수정
- 그룹 탈퇴/삭제
- 소셜 로그인 (Google, Apple)

## 선행 조건
- Firebase 프로젝트 생성 및 `.env` 설정 완료
- Firebase Authentication 활성화 (이메일/비밀번호)
- Firestore 활성화

## 완료 조건
- [ ] 회원가입/로그인/로그아웃이 정상 동작
- [ ] 로그인 상태가 앱 재시작 후에도 유지됨
- [ ] 그룹 생성 시 초대 코드가 생성됨
- [ ] 초대 코드로 그룹 참여 가능
- [ ] 로그인 여부/그룹 여부에 따라 화면 분기 정상 동작
- [ ] 설정 화면에서 그룹 정보 확인 및 로그아웃 가능
