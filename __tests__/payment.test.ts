import { BankNames, type Payment, type BankCode } from '@/types/payment';

describe('Payment 타입', () => {
  it('Payment 객체가 올바른 구조를 가진다', () => {
    const payment: Payment = {
      id: 'test-1',
      amount: 15000,
      date: '2026-03-22',
      time: '14:30:00',
      bank: 'kb',
      userId: 'user-1',
      groupId: 'group-1',
      createdAt: '2026-03-22T14:30:00.000Z',
    };

    expect(payment.id).toBe('test-1');
    expect(payment.amount).toBe(15000);
    expect(payment.date).toBe('2026-03-22');
    expect(payment.time).toBe('14:30:00');
    expect(payment.bank).toBe('kb');
  });

  it('선택적 필드(storeName, category)가 없어도 된다', () => {
    const payment: Payment = {
      id: 'test-2',
      amount: 5000,
      date: '2026-03-22',
      time: '10:00:00',
      bank: 'shinhan',
      userId: 'user-1',
      groupId: 'group-1',
      createdAt: '2026-03-22T10:00:00.000Z',
    };

    expect(payment.storeName).toBeUndefined();
    expect(payment.category).toBeUndefined();
  });

  it('선택적 필드를 포함할 수 있다', () => {
    const payment: Payment = {
      id: 'test-3',
      amount: 32000,
      date: '2026-03-22',
      time: '19:00:00',
      bank: 'kakao',
      storeName: '스타벅스',
      category: '카페',
      userId: 'user-2',
      groupId: 'group-1',
      createdAt: '2026-03-22T19:00:00.000Z',
    };

    expect(payment.storeName).toBe('스타벅스');
    expect(payment.category).toBe('카페');
  });
});

describe('BankNames', () => {
  it('지원하는 은행 목록이 정확하다', () => {
    expect(BankNames.kb).toBe('국민은행');
    expect(BankNames.shinhan).toBe('신한은행');
    expect(BankNames.nh).toBe('농협은행');
    expect(BankNames.kakao).toBe('카카오페이');
  });

  it('4개의 은행을 지원한다', () => {
    const bankCodes = Object.keys(BankNames) as BankCode[];
    expect(bankCodes).toHaveLength(4);
  });
});
