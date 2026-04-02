import type { Payment } from '@/types/payment';

export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function getDailyTotal(payments: Payment[], date: string): number {
  return payments
    .filter((p) => p.date === date)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getMonthlyTotal(payments: Payment[], yearMonth: string): number {
  return payments
    .filter((p) => p.date.startsWith(yearMonth))
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getPaymentsForDate(payments: Payment[], date: string): Payment[] {
  return payments
    .filter((p) => p.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getSelectedDateForMonth(yearMonth: string, today: string): string {
  if (today.startsWith(yearMonth)) {
    return today;
  }
  return `${yearMonth}-01`;
}
