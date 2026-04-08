const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn((...args: any[]) => ({ id: 'mock-doc-id', path: args.join('/') }));
const mockCollection = jest.fn((...args: any[]) => ({ path: args.join('/') }));
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOnSnapshot = jest.fn();
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');

jest.mock('@/services/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: any[]) => mockAddDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

import { addPayment, deletePayment, subscribeToMonthlyPayments, getNextMonthStart } from '@/services/payments';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addPayment', () => {
  it('Firestore에 결제 데이터를 추가한다', async () => {
    mockAddDoc.mockResolvedValue({ id: 'payment-1' });

    const result = await addPayment('group-1', {
      amount: 5000,
      date: '2026-04-01',
      time: '14:30:00',
      bank: 'kb',
      storeName: '스타벅스',
      userId: 'user-1',
      groupId: 'group-1',
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(result).toBe('payment-1');
  });
});

describe('deletePayment', () => {
  it('Firestore에서 결제 데이터를 삭제한다', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await deletePayment('group-1', 'payment-1');

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe('subscribeToMonthlyPayments', () => {
  it('월별 결제 데이터를 구독하고 unsubscribe 함수를 반환한다', () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const callback = jest.fn();
    const unsubscribe = subscribeToMonthlyPayments('group-1', '2026-04', callback);

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    expect(typeof unsubscribe).toBe('function');
  });

  it('unsubscribe를 호출하면 구독이 해제된다', () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const unsubscribe = subscribeToMonthlyPayments('group-1', '2026-04', jest.fn());
    unsubscribe();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('getNextMonthStart', () => {
  it('다음 달 1일을 반환한다', () => {
    expect(getNextMonthStart('2026-04')).toBe('2026-05-01');
    expect(getNextMonthStart('2026-11')).toBe('2026-12-01');
  });

  it('12월이면 다음 해 1월 1일을 반환한다', () => {
    expect(getNextMonthStart('2026-12')).toBe('2027-01-01');
  });
});
