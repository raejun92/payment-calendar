// 한국 법정 공휴일 (음력 공휴일은 매년 날짜가 바뀌므로 연도별로 관리)
// 추후 공공데이터포털 API 연동으로 대체 가능

const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '크리스마스',
};

// 음력 기반 공휴일 (연도별)
const LUNAR_HOLIDAYS: Record<string, Record<string, string>> = {
  '2025': {
    '01-28': '설날 전날',
    '01-29': '설날',
    '01-30': '설날 다음날',
    '05-05': '부처님오신날',
    '10-05': '추석 전날',
    '10-06': '추석',
    '10-07': '추석 다음날',
  },
  '2026': {
    '02-16': '설날 전날',
    '02-17': '설날',
    '02-18': '설날 다음날',
    '05-24': '부처님오신날',
    '09-24': '추석 전날',
    '09-25': '추석',
    '09-26': '추석 다음날',
  },
  '2027': {
    '02-05': '설날 전날',
    '02-06': '설날',
    '02-07': '설날 다음날',
    '05-13': '부처님오신날',
    '10-14': '추석 전날',
    '10-15': '추석',
    '10-16': '추석 다음날',
  },
};

export function isHoliday(date: string): boolean {
  return getHolidayName(date) !== null;
}

export function getHolidayName(date: string): string | null {
  const monthDay = date.substring(5); // MM-DD
  const year = date.substring(0, 4);

  if (FIXED_HOLIDAYS[monthDay]) {
    return FIXED_HOLIDAYS[monthDay];
  }

  const yearHolidays = LUNAR_HOLIDAYS[year];
  if (yearHolidays && yearHolidays[monthDay]) {
    return yearHolidays[monthDay];
  }

  return null;
}
