import { formatCurrency, getDailyTotal, getMonthlyTotal, getPaymentsForDate, getSelectedDateForMonth } from '@/utils/calendar';
import type { Payment } from '@/types/payment';

const mockPayments: Payment[] = [
  {
    id: '1',
    amount: 5000,
    date: '2026-04-01',
    time: '14:30:00',
    bank: 'kb',
    storeName: '스타벅스',
    userId: 'user-1',
    groupId: 'group-1',
    createdAt: '2026-04-01T05:30:00.000Z',
  },
  {
    id: '2',
    amount: 7000,
    date: '2026-04-01',
    time: '18:20:00',
    bank: 'shinhan',
    storeName: '쿠팡',
    userId: 'user-2',
    groupId: 'group-1',
    createdAt: '2026-04-01T09:20:00.000Z',
  },
  {
    id: '3',
    amount: 32000,
    date: '2026-04-05',
    time: '12:00:00',
    bank: 'kakao',
    storeName: '배달의민족',
    userId: 'user-1',
    groupId: 'group-1',
    createdAt: '2026-04-05T03:00:00.000Z',
  },
  {
    id: '4',
    amount: 150000,
    date: '2026-03-15',
    time: '09:00:00',
    bank: 'nh',
    userId: 'user-2',
    groupId: 'group-1',
    createdAt: '2026-03-15T00:00:00.000Z',
  },
];

describe('formatCurrency', () => {
  it('금액을 ₩ + 천 단위 콤마 형식으로 표시한다', () => {
    expect(formatCurrency(5000)).toBe('₩5,000');
    expect(formatCurrency(352000)).toBe('₩352,000');
    expect(formatCurrency(1500000)).toBe('₩1,500,000');
  });

  it('0원을 표시한다', () => {
    expect(formatCurrency(0)).toBe('₩0');
  });
});

describe('getDailyTotal', () => {
  it('특정 날짜의 결제 총액을 반환한다', () => {
    expect(getDailyTotal(mockPayments, '2026-04-01')).toBe(12000);
  });

  it('결제가 없는 날짜는 0을 반환한다', () => {
    expect(getDailyTotal(mockPayments, '2026-04-02')).toBe(0);
  });
});

describe('getMonthlyTotal', () => {
  it('특정 월의 결제 총액을 반환한다', () => {
    expect(getMonthlyTotal(mockPayments, '2026-04')).toBe(44000);
  });

  it('결제가 없는 월은 0을 반환한다', () => {
    expect(getMonthlyTotal(mockPayments, '2026-05')).toBe(0);
  });
});

describe('getPaymentsForDate', () => {
  it('특정 날짜의 결제 내역을 시간순으로 반환한다', () => {
    const result = getPaymentsForDate(mockPayments, '2026-04-01');
    expect(result).toHaveLength(2);
    expect(result[0].time).toBe('14:30:00');
    expect(result[1].time).toBe('18:20:00');
  });

  it('결제가 없는 날짜는 빈 배열을 반환한다', () => {
    const result = getPaymentsForDate(mockPayments, '2026-04-02');
    expect(result).toEqual([]);
  });
});

describe('getSelectedDateForMonth', () => {
  it('오늘이 해당 월에 포함되면 오늘을 반환한다', () => {
    const today = '2026-04-01';
    expect(getSelectedDateForMonth('2026-04', today)).toBe('2026-04-01');
  });

  it('오늘이 해당 월에 포함되지 않으면 1일을 반환한다', () => {
    const today = '2026-04-01';
    expect(getSelectedDateForMonth('2026-03', today)).toBe('2026-03-01');
    expect(getSelectedDateForMonth('2026-05', today)).toBe('2026-05-01');
  });
});
