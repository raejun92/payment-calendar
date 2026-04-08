import { useState, useEffect } from 'react';
import { subscribeToMonthlyPayments } from '@/services/payments';
import type { Payment } from '@/types/payment';

export function usePayments(groupId: string | undefined, yearMonth: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMonthlyPayments(groupId, yearMonth, (data) => {
      setPayments(data);
      setLoading(false);
    });

    // 월 변경 시 기존 listener unsubscribe
    return unsubscribe;
  }, [groupId, yearMonth]);

  return { payments, loading };
}
