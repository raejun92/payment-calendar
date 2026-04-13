import { setDoc, doc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { BankNames } from '@/types/payment';
import type { Payment } from '@/types/payment';
import { deletePayment } from './payments';

const VALID_BANKS = Object.keys(BankNames);
const MAX_AMOUNT = 100000000; // 1억

// ===== Add (결제 추가) =====

export interface PaymentUrlParams {
  amount: number;
  bank: string;
  eventId: string;
  storeName?: string;
  date?: string;
  time?: string;
}

export function parsePaymentUrl(url: string): PaymentUrlParams | null {
  try {
    if (!url.startsWith('paymentcalendar://add')) return null;

    const queryString = url.split('?')[1];
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);

    const amount = parseInt(params.get('amount') ?? '', 10);
    const bank = params.get('bank') ?? '';
    const eventId = params.get('eventId') ?? '';
    const storeName = params.get('storeName') || undefined;
    const date = params.get('date') || undefined;
    const time = params.get('time') || undefined;

    return { amount, bank, eventId, storeName, date, time };
  } catch {
    return null;
  }
}

export function validatePaymentParams(params: PaymentUrlParams): boolean {
  const { amount, bank, eventId } = params;

  if (!eventId) return false;
  if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) return false;
  if (!VALID_BANKS.includes(bank)) return false;

  return true;
}

// ===== Cancel (결제 취소) =====

export interface CancelUrlParams {
  amount: number;
  bank: string;
  cancelEventId: string;
  storeName?: string;
  date?: string;
}

export function parseCancelUrl(url: string): CancelUrlParams | null {
  try {
    if (!url.startsWith('paymentcalendar://cancel')) return null;

    const queryString = url.split('?')[1];
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);

    const amount = parseInt(params.get('amount') ?? '', 10);
    const bank = params.get('bank') ?? '';
    const cancelEventId = params.get('cancelEventId') ?? '';
    const storeName = params.get('storeName') || undefined;
    const date = params.get('date') || undefined;

    return { amount, bank, cancelEventId, storeName, date };
  } catch {
    return null;
  }
}

export function validateCancelParams(params: CancelUrlParams): boolean {
  const { amount, bank, cancelEventId } = params;

  if (!cancelEventId) return false;
  if (isNaN(amount) || amount <= 0 || amount > MAX_AMOUNT) return false;
  if (!VALID_BANKS.includes(bank)) return false;

  return true;
}

export interface MatchResult {
  status: 'found' | 'multiple' | 'not_found';
  payment?: Payment;
}

export function findMatchingPayment(
  payments: Payment[],
  params: CancelUrlParams,
  today?: string,
): MatchResult {
  const { amount, bank, storeName, date } = params;

  let candidates: Payment[];

  if (date && storeName) {
    // 1순위: amount + bank + storeName + date
    candidates = payments.filter(
      (p) => p.amount === amount && p.bank === bank && p.storeName === storeName && p.date === date,
    );
    if (candidates.length === 1) return { status: 'found', payment: candidates[0] };
    if (candidates.length > 1) return { status: 'multiple' };
  }

  if (date) {
    // 2순위: amount + bank + date
    candidates = payments.filter(
      (p) => p.amount === amount && p.bank === bank && p.date === date,
    );
    if (candidates.length === 1) return { status: 'found', payment: candidates[0] };
    if (candidates.length > 1) return { status: 'multiple' };
  }

  // 3순위: amount + bank (최근 7일 이내)
  const todayDate = today || new Date().toISOString().substring(0, 10);
  const sevenDaysAgo = getDateDaysAgo(todayDate, 7);

  candidates = payments.filter(
    (p) => p.amount === amount && p.bank === bank && p.date >= sevenDaysAgo && p.date <= todayDate,
  );

  if (candidates.length === 1) return { status: 'found', payment: candidates[0] };
  if (candidates.length > 1) return { status: 'multiple' };

  return { status: 'not_found' };
}

function getDateDaysAgo(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00+09:00');
  date.setDate(date.getDate() - days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===== Deep Link Handlers =====

function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().substring(0, 10);
}

function getCurrentTimeKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().substring(11, 16);
}

async function fetchRecentPayments(groupId: string): Promise<Payment[]> {
  const today = getTodayKST();
  const sevenDaysAgo = getDateDaysAgo(today, 7);

  const q = query(
    collection(db, 'groups', groupId, 'payments'),
    where('date', '>=', sevenDaysAgo),
    where('date', '<=', today),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  })) as Payment[];
}

export async function handleDeepLink(
  url: string,
  userId: string,
  groupId: string,
): Promise<{ type: 'added' | 'deleted' | 'multiple' | 'not_found' | 'ignored' }> {
  // 결제 추가
  if (url.startsWith('paymentcalendar://add')) {
    const params = parsePaymentUrl(url);
    if (!params || !validatePaymentParams(params)) return { type: 'ignored' };

    const date = params.date || getTodayKST();
    const time = `${params.time || getCurrentTimeKST()}:00`;

    const cleanData: Record<string, any> = {
      amount: params.amount,
      date,
      time,
      bank: params.bank,
      userId,
      groupId,
      createdAt: serverTimestamp(),
    };
    if (params.storeName) cleanData.storeName = params.storeName;

    await setDoc(doc(db, 'groups', groupId, 'payments', params.eventId), cleanData);
    return { type: 'added' };
  }

  // 결제 취소
  if (url.startsWith('paymentcalendar://cancel')) {
    const params = parseCancelUrl(url);
    if (!params || !validateCancelParams(params)) return { type: 'ignored' };

    // 중복 취소 방지: cancelEventId 이력 확인
    const cancelRef = doc(db, 'groups', groupId, 'cancelEvents', params.cancelEventId);
    const cancelDoc = await getDoc(cancelRef);
    if (cancelDoc.exists()) return { type: 'ignored' };

    const payments = await fetchRecentPayments(groupId);
    if (payments.length === 0) return { type: 'not_found' };

    const match = findMatchingPayment(payments, params, getTodayKST());

    if (match.status === 'found' && match.payment) {
      await deletePayment(groupId, match.payment.id);
      // 처리 이력 저장
      await setDoc(cancelRef, {
        cancelEventId: params.cancelEventId,
        deletedPaymentId: match.payment.id,
        createdAt: serverTimestamp(),
      });
      return { type: 'deleted' };
    }

    if (match.status === 'multiple') return { type: 'multiple' };
    return { type: 'not_found' };
  }

  return { type: 'ignored' };
}
