# Phase 6: 결제 취소 처리 PRD

## 목표
결제 취소 알림이 오면 해당 결제 내역을 달력에서 삭제한다.

## 배경
- 결제 취소 시 기존 결제 내역이 달력에 남아있으면 금액이 부정확해짐
- Phase 4에서 결제 삭제(hard delete) 방식을 채택함
- iOS 단축어로 취소 알림을 파싱하여 매칭되는 결제를 찾아 삭제

## 범위

### 1. 전체 흐름
```
은행 결제 취소 알림 수신
  → iOS 단축어 자동화 트리거
  → 사용자 탭 1번
  → 단축어가 취소 알림 파싱
  → 앱의 URL Scheme으로 취소 데이터 전달
  → 앱이 매칭되는 결제를 찾아 Firestore에서 삭제
```

### 2. URL Scheme (취소)
- 결제 취소 경로: `paymentcalendar://cancel`
- 파라미터:
  - `amount` (필수): 취소 금액 (양수 정수, 상한 1억)
  - `bank` (필수): 은행 코드 (kb, shinhan, nh, kakao, kbank만 허용)
  - `cancelEventId` (필수): 단축어에서 생성한 UUID (중복 취소 방지용)
  - `storeName` (선택): 가맹점명
  - `date` (선택): 취소 대상 결제 날짜 (YYYY-MM-DD)
- Validation: add와 동일 (금액 양수 + 상한, bank whitelist, cancelEventId 존재 검증)
- 중복 취소 방지: `cancelEventId`를 처리 이력으로 저장, 이미 처리된 이벤트면 무시
- 예시: `paymentcalendar://cancel?amount=5000&bank=kb&storeName=스타벅스&date=2026-04-10&cancelEventId=cancel-uuid-001`

### 3. 매칭 로직
취소 요청이 오면 같은 그룹 내에서 매칭되는 결제를 찾아 삭제한다.

**매칭 조건 (우선순위 순):**
1. `amount` + `bank` + `storeName` + `date` 모두 일치 → 삭제
2. `amount` + `bank` + `date` 일치 (storeName 없는 경우) → 삭제
3. `amount` + `bank` 일치 (date 없는 경우) → 최근 7일 이내에서 가장 최근 결제 삭제

**매칭 결과:**
- 1건 매칭 → 바로 삭제
- 여러 건 매칭 → 자동 삭제하지 않음, "여러 건이 매칭됩니다. 수동으로 삭제해주세요" 피드백
- 0건 매칭 → "매칭되는 결제를 찾을 수 없습니다" 피드백

**최신 판정 기준:** 매칭 시 정렬은 `createdAt`(Firestore Timestamp) 기준

### 4. 앱 내 처리
- `deep-link.ts`에 취소 핸들러 추가
- Validation: add와 동일 (금액 양수 + 상한, bank whitelist 검증)
- 미로그인 시 무시 (기존과 동일)
- 삭제 성공/실패 시 사용자 피드백 (Alert)

### 5. 수동 취소
- 이미 Phase 4에서 구현됨 (리스트에서 길게 누르기 → 삭제)
- 단축어 취소가 매칭 실패할 경우 수동으로 삭제 가능

### 6. 프로젝트 구조 변경
```
services/
  └── deep-link.ts             # cancel 핸들러 추가
  └── payments.ts              # 매칭 조회 함수 추가
```

## 이 단계에서 하지 않는 것
- 취소 이력 보관 (hard delete)
- 취소 알림 단축어 생성 (실제 취소 알림 텍스트 필요)
- 부분 취소 처리

## 완료 조건
- [ ] URL Scheme(paymentcalendar://cancel)으로 취소 요청 수신됨
- [ ] 매칭 조건에 따라 올바른 결제가 삭제됨
- [ ] 매칭 실패 시 사용자에게 피드백 표시
- [ ] 여러 건 매칭 시 자동 삭제되지 않고 수동 확인 안내됨
- [ ] 동일 cancelEventId 재전송 시 추가 삭제 없음
- [ ] 미로그인 시 취소 요청 무시됨
