import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { BankNames, type BankCode } from '@/types/payment';

const VALID_BANKS = Object.keys(BankNames);
const MAX_AMOUNT = 100000000; // 1억

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
    // paymentcalendar://add?... 형식 확인
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

export async function handleDeepLink(
  url: string,
  userId: string,
  groupId: string,
): Promise<boolean> {
  const params = parsePaymentUrl(url);
  if (!params) return false;
  if (!validatePaymentParams(params)) return false;

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

  // eventId를 문서 ID로 사용하여 중복 자연 방지 (setDoc)
  await setDoc(doc(db, 'groups', groupId, 'payments', params.eventId), cleanData);
  return true;
}
