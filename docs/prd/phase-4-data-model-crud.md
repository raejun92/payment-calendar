# Phase 4: 데이터 모델 + CRUD PRD

## 목표
Firestore에 결제 데이터를 저장/조회/삭제하고, 달력 UI와 실시간으로 연동한다.

## 배경
- Phase 3에서 더미 데이터로 달력 UI를 완성함
- 이 단계에서 더미 데이터를 Firestore 실시간 데이터로 교체
- 같은 그룹의 결제 내역이 실시간으로 동기화되어야 함

## 범위

### 1. Firestore 컬렉션 구조
```
groups/
  {groupId}/
    payments/                    # 서브 컬렉션
      {paymentId}/
        amount: number           # 결제 금액
        date: string             # YYYY-MM-DD (KST 기준)
        time: string             # HH:mm:ss
        bank: string             # 은행/카드사 코드
        storeName?: string       # 가맹점명
        category?: string        # 카테고리 (추후 활용)
        userId: string           # 결제자 ID
        groupId: string          # 그룹 ID
        createdAt: Timestamp     # Firestore Timestamp (서버 시각)
```

> 결제 데이터를 `groups/{groupId}/payments`에 서브 컬렉션으로 저장하여, 같은 그룹 내에서만 조회되도록 한다.
> `createdAt`은 Firestore `Timestamp` 타입으로 저장하고, 앱에서 필요 시 ISO 문자열로 변환한다. (Phase 1의 `Payment.createdAt: string`은 앱 레벨 타입이고, Firestore에는 Timestamp으로 저장)

### 2. CRUD 함수
- **Create**: 결제 내역 추가 (iOS 단축어 연동 전, 수동 추가 UI 제공)
- **Read**: 월별 결제 내역 실시간 구독 (onSnapshot)
- **Delete**: 결제 내역 삭제

> Update는 이 단계에서 구현하지 않음. 잘못 입력 시 삭제 후 재등록.

### 3. 실시간 구독
- `onSnapshot`으로 결제 데이터 실시간 구독
- 한 쪽에서 추가/삭제하면 다른 쪽 달력에 즉시 반영
- 월 이동 시 해당 월 데이터만 구독 (쿼리 범위: `date >= "YYYY-MM-01"` AND `date < "YYYY-(MM+1)-01"`)
- 월 변경 시 기존 listener를 반드시 unsubscribe한 후 새 월 데이터를 구독 (중복 구독 방지)
- 오프라인 시 Firestore 기본 오프라인 캐시에 의존 (별도 처리 없음)

### 4. 수동 결제 추가 UI
- 하단 리스트 날짜 제목 옆 + 버튼으로 추가 모달 열기
- 입력 항목: 금액(필수), 가맹점명(선택), 은행 선택, 시간
- 날짜: 선택된 날짜 자동 적용 (입력 불필요)
- 시간 기본값: 현재 시간 (HH:mm)
- userId: 현재 로그인한 사용자의 ID 자동 세팅

### 5. 삭제 기능
- 하단 리스트에서 결제 항목을 길게 누르기 → 삭제 확인 Alert
- 삭제 확인 Alert
- 삭제 권한: 그룹 멤버 누구나 타인 결제도 삭제 가능 (부부 공동 관리 정책)

### 6. 더미 데이터 제거
- `constants/dummy-data.ts` 제거
- 달력 화면에서 Firestore 데이터 사용으로 교체

### 7. 결제 취소 처리 방식
- **실제 삭제** 방식 채택 (soft delete 아님)
- 이유: 두 명만 사용하는 앱에서 삭제 이력 관리는 불필요한 복잡성
- Phase 6에서 iOS 단축어의 취소 알림이 오면 해당 내역을 매칭하여 삭제

### 8. 프로젝트 구조 추가/변경
```
services/
  ├── firebase.ts              # 기존
  ├── auth.ts                  # 기존
  └── payments.ts              # 결제 CRUD + 실시간 구독
hooks/
  └── use-payments.ts          # 월별 결제 데이터 구독 훅
app/
  └── (tabs)/
      └── index.tsx            # Firestore 데이터로 교체
components/
  └── calendar/
      └── add-payment-modal.tsx # 결제 추가 모달
```

### 9. Firestore 보안 규칙 (Security Rules)
- 그룹 멤버만 해당 그룹의 payments를 read/write 가능
- 결제 추가 시 `userId == request.auth.uid` 검증 (다른 사람 명의로 추가 방지)
- 그룹 문서는 read/write 분리 (멤버가 memberIds를 임의 수정하지 못하도록)
- payments create 시 스키마 검증 (금액 양수, groupId 일치, 필수 필드)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      // 멤버는 읽기만 가능, 그룹 메타 수정은 생성자만
      allow read: if request.auth != null
        && request.auth.uid in resource.data.memberIds;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.createdBy
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['createdBy', 'memberIds', 'inviteCode']);
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.createdBy;

      match /payments/{paymentId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds;
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds
          && request.resource.data.userId == request.auth.uid
          && request.resource.data.groupId == groupId
          && request.resource.data.amount is int
          && request.resource.data.amount > 0
          && request.resource.data.date is string
          && request.resource.data.time is string
          && request.resource.data.bank is string;
        allow delete: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberIds;
      }
    }
  }
}
```

## 이 단계에서 하지 않는 것
- iOS 단축어 연동 (Phase 5)
- 결제 수정 기능
- 카테고리 분류 UI
- 검색/필터 기능

## 선행 조건
- Firestore 활성화 완료 (Phase 1에서 완료)
- 인증 + 그룹 완료 (Phase 2에서 완료)
- 달력 UI 완료 (Phase 3에서 완료)

## 완료 조건
- [ ] 결제 내역을 Firestore에 추가할 수 있음
- [ ] 달력에 Firestore 실시간 데이터가 표시됨
- [ ] 결제 추가 시 상대방 달력에도 즉시 반영됨
- [ ] 결제 내역을 스와이프로 삭제할 수 있음
- [ ] 월 이동 시 해당 월 데이터만 조회됨
- [ ] 더미 데이터 제거 완료
- [ ] 수동 결제 추가 UI 동작
- [ ] Firestore 보안 규칙 적용 완료
- [ ] 월 변경 시 기존 listener가 정리됨 (중복 구독 없음)
