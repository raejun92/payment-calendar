import {
  addDoc,
  deleteDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Payment } from '@/types/payment';

interface AddPaymentData {
  amount: number;
  date: string;
  time: string;
  bank: string;
  storeName?: string;
  category?: string;
  userId: string;
  groupId: string;
}

export async function addPayment(groupId: string, data: AddPaymentData): Promise<string> {
  // Firestore는 undefined 값을 허용하지 않으므로 제거
  const cleanData: Record<string, any> = {
    amount: data.amount,
    date: data.date,
    time: data.time,
    bank: data.bank,
    userId: data.userId,
    groupId: data.groupId,
    createdAt: serverTimestamp(),
  };
  if (data.storeName) cleanData.storeName = data.storeName;
  if (data.category) cleanData.category = data.category;

  const ref = await addDoc(collection(db, 'groups', groupId, 'payments'), cleanData);
  return ref.id;
}

export async function deletePayment(groupId: string, paymentId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'payments', paymentId));
}

export function getNextMonthStart(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

export function subscribeToMonthlyPayments(
  groupId: string,
  yearMonth: string,
  callback: (payments: Payment[]) => void,
): () => void {
  const startDate = `${yearMonth}-01`;
  const endDate = getNextMonthStart(yearMonth);

  const q = query(
    collection(db, 'groups', groupId, 'payments'),
    where('date', '>=', startDate),
    where('date', '<', endDate),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const payments: Payment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    })) as Payment[];
    callback(payments);
  });

  return unsubscribe;
}
