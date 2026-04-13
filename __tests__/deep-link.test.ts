jest.mock('@/services/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('@/services/payments', () => ({
  deletePayment: jest.fn(),
}));

import { parsePaymentUrl, validatePaymentParams } from '@/services/deep-link';

describe('parsePaymentUrl', () => {
  it('유효한 URL에서 파라미터를 파싱한다', () => {
    const url = 'paymentcalendar://add?amount=5000&bank=kb&storeName=스타벅스&eventId=abc-123&date=2026-04-08&time=14:30';
    const result = parsePaymentUrl(url);

    expect(result).toEqual({
      amount: 5000,
      bank: 'kb',
      storeName: '스타벅스',
      eventId: 'abc-123',
      date: '2026-04-08',
      time: '14:30',
    });
  });

  it('선택 파라미터가 없으면 undefined로 반환한다', () => {
    const url = 'paymentcalendar://add?amount=5000&bank=kb&eventId=abc-123';
    const result = parsePaymentUrl(url);

    expect(result?.storeName).toBeUndefined();
    expect(result?.date).toBeUndefined();
    expect(result?.time).toBeUndefined();
  });

  it('add 경로가 아니면 null을 반환한다', () => {
    const url = 'paymentcalendar://other?amount=5000';
    const result = parsePaymentUrl(url);

    expect(result).toBeNull();
  });

  it('paymentcalendar 스킴이 아니면 null을 반환한다', () => {
    const url = 'https://example.com/add?amount=5000';
    const result = parsePaymentUrl(url);

    expect(result).toBeNull();
  });
});

describe('validatePaymentParams', () => {
  it('유효한 파라미터를 통과시킨다', () => {
    expect(validatePaymentParams({
      amount: 5000,
      bank: 'kb',
      eventId: 'abc-123',
    })).toBe(true);
  });

  it('amount가 0이면 거부한다', () => {
    expect(validatePaymentParams({
      amount: 0,
      bank: 'kb',
      eventId: 'abc-123',
    })).toBe(false);
  });

  it('amount가 음수이면 거부한다', () => {
    expect(validatePaymentParams({
      amount: -1000,
      bank: 'kb',
      eventId: 'abc-123',
    })).toBe(false);
  });

  it('amount가 1억 초과이면 거부한다', () => {
    expect(validatePaymentParams({
      amount: 100000001,
      bank: 'kb',
      eventId: 'abc-123',
    })).toBe(false);
  });

  it('지원하지 않는 bank 코드를 거부한다', () => {
    expect(validatePaymentParams({
      amount: 5000,
      bank: 'unknown',
      eventId: 'abc-123',
    })).toBe(false);
  });

  it('eventId가 없으면 거부한다', () => {
    expect(validatePaymentParams({
      amount: 5000,
      bank: 'kb',
      eventId: '',
    })).toBe(false);
  });

  it('amount가 NaN이면 거부한다', () => {
    expect(validatePaymentParams({
      amount: NaN,
      bank: 'kb',
      eventId: 'abc-123',
    })).toBe(false);
  });

  it('지원하는 모든 bank 코드를 허용한다', () => {
    const banks = ['kb', 'shinhan', 'nh', 'kakao', 'kbank'];
    banks.forEach(bank => {
      expect(validatePaymentParams({
        amount: 5000,
        bank,
        eventId: 'abc-123',
      })).toBe(true);
    });
  });
});
