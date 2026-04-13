jest.mock('@/services/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((...args: any[]) => ({ id: args[args.length - 1], path: args.join('/') })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

import { parseCancelUrl, validateCancelParams, findMatchingPayment } from '@/services/deep-link';
import type { Payment } from '@/types/payment';

describe('parseCancelUrl', () => {
  it('유효한 취소 URL에서 파라미터를 파싱한다', () => {
    const url = 'paymentcalendar://cancel?amount=5000&bank=kb&storeName=스타벅스&date=2026-04-10&cancelEventId=cancel-001';
    const result = parseCancelUrl(url);

    expect(result).toEqual({
      amount: 5000,
      bank: 'kb',
      storeName: '스타벅스',
      date: '2026-04-10',
      cancelEventId: 'cancel-001',
    });
  });

  it('선택 파라미터가 없으면 undefined로 반환한다', () => {
    const url = 'paymentcalendar://cancel?amount=5000&bank=kb&cancelEventId=cancel-001';
    const result = parseCancelUrl(url);

    expect(result?.storeName).toBeUndefined();
    expect(result?.date).toBeUndefined();
  });

  it('cancel 경로가 아니면 null을 반환한다', () => {
    const url = 'paymentcalendar://add?amount=5000&bank=kb&cancelEventId=cancel-001';
    const result = parseCancelUrl(url);

    expect(result).toBeNull();
  });
});

describe('validateCancelParams', () => {
  it('유효한 파라미터를 통과시킨다', () => {
    expect(validateCancelParams({
      amount: 5000,
      bank: 'kb',
      cancelEventId: 'cancel-001',
    })).toBe(true);
  });

  it('amount가 0이면 거부한다', () => {
    expect(validateCancelParams({
      amount: 0,
      bank: 'kb',
      cancelEventId: 'cancel-001',
    })).toBe(false);
  });

  it('지원하지 않는 bank를 거부한다', () => {
    expect(validateCancelParams({
      amount: 5000,
      bank: 'unknown',
      cancelEventId: 'cancel-001',
    })).toBe(false);
  });

  it('cancelEventId가 없으면 거부한다', () => {
    expect(validateCancelParams({
      amount: 5000,
      bank: 'kb',
      cancelEventId: '',
    })).toBe(false);
  });
});

describe('findMatchingPayment', () => {
  const payments: Payment[] = [
    {
      id: 'p1',
      amount: 5000,
      date: '2026-04-10',
      time: '14:30:00',
      bank: 'kb',
      storeName: '스타벅스',
      userId: 'user-1',
      groupId: 'group-1',
      createdAt: '2026-04-10T05:30:00.000Z',
    },
    {
      id: 'p2',
      amount: 5000,
      date: '2026-04-10',
      time: '18:00:00',
      bank: 'kb',
      storeName: '이디야',
      userId: 'user-1',
      groupId: 'group-1',
      createdAt: '2026-04-10T09:00:00.000Z',
    },
    {
      id: 'p3',
      amount: 7000,
      date: '2026-04-08',
      time: '12:00:00',
      bank: 'shinhan',
      userId: 'user-2',
      groupId: 'group-1',
      createdAt: '2026-04-08T03:00:00.000Z',
    },
    {
      id: 'p4',
      amount: 5000,
      date: '2026-04-05',
      time: '09:00:00',
      bank: 'kb',
      storeName: '스타벅스',
      userId: 'user-1',
      groupId: 'group-1',
      createdAt: '2026-04-05T00:00:00.000Z',
    },
  ];

  it('amount + bank + storeName + date 모두 일치하면 해당 결제를 반환한다', () => {
    const result = findMatchingPayment(payments, {
      amount: 5000,
      bank: 'kb',
      storeName: '스타벅스',
      date: '2026-04-10',
      cancelEventId: 'c1',
    });

    expect(result.status).toBe('found');
    expect(result.payment?.id).toBe('p1');
  });

  it('amount + bank + date 일치 (storeName 없는 경우) 1건이면 삭제한다', () => {
    const result = findMatchingPayment(payments, {
      amount: 7000,
      bank: 'shinhan',
      date: '2026-04-08',
      cancelEventId: 'c2',
    });

    expect(result.status).toBe('found');
    expect(result.payment?.id).toBe('p3');
  });

  it('여러 건 매칭 시 자동 삭제하지 않는다', () => {
    const result = findMatchingPayment(payments, {
      amount: 5000,
      bank: 'kb',
      date: '2026-04-10',
      cancelEventId: 'c3',
    });

    expect(result.status).toBe('multiple');
    expect(result.payment).toBeUndefined();
  });

  it('0건 매칭 시 not_found를 반환한다', () => {
    const result = findMatchingPayment(payments, {
      amount: 99999,
      bank: 'kb',
      cancelEventId: 'c4',
    });

    expect(result.status).toBe('not_found');
    expect(result.payment).toBeUndefined();
  });

  it('date 없이 amount + bank만 일치할 때 최근 7일 이내 1건이면 삭제한다', () => {
    // p3만 매칭 (shinhan + 7000)
    const result = findMatchingPayment(payments, {
      amount: 7000,
      bank: 'shinhan',
      cancelEventId: 'c5',
    }, '2026-04-11');

    expect(result.status).toBe('found');
    expect(result.payment?.id).toBe('p3');
  });

  it('date 없이 여러 건 매칭되면 자동 삭제하지 않는다', () => {
    // kb + 5000 → p1, p2, p4 중 7일 이내 p1, p2
    const result = findMatchingPayment(payments, {
      amount: 5000,
      bank: 'kb',
      cancelEventId: 'c6',
    }, '2026-04-11');

    expect(result.status).toBe('multiple');
  });
});
