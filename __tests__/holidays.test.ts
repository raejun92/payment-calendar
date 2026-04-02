import { isHoliday, getHolidayName } from '@/constants/holidays';

describe('한국 공휴일', () => {
  it('공휴일인 날짜를 판별한다', () => {
    expect(isHoliday('2026-01-01')).toBe(true);  // 신정
    expect(isHoliday('2026-03-01')).toBe(true);  // 삼일절
    expect(isHoliday('2026-05-05')).toBe(true);  // 어린이날
    expect(isHoliday('2026-06-06')).toBe(true);  // 현충일
    expect(isHoliday('2026-08-15')).toBe(true);  // 광복절
    expect(isHoliday('2026-10-03')).toBe(true);  // 개천절
    expect(isHoliday('2026-10-09')).toBe(true);  // 한글날
    expect(isHoliday('2026-12-25')).toBe(true);  // 크리스마스
  });

  it('공휴일이 아닌 날짜를 판별한다', () => {
    expect(isHoliday('2026-04-02')).toBe(false);
    expect(isHoliday('2026-07-15')).toBe(false);
  });

  it('공휴일 이름을 반환한다', () => {
    expect(getHolidayName('2026-01-01')).toBe('신정');
    expect(getHolidayName('2026-03-01')).toBe('삼일절');
    expect(getHolidayName('2026-12-25')).toBe('크리스마스');
  });

  it('공휴일이 아니면 null을 반환한다', () => {
    expect(getHolidayName('2026-04-02')).toBeNull();
  });

  it('일요일도 빨간 날이지만 공휴일 함수와는 별개다', () => {
    // 공휴일 함수는 법정 공휴일만 판별
    expect(isHoliday('2026-04-05')).toBe(false); // 일요일이지만 공휴일 아님
  });
});
