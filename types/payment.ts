export interface Payment {
  id: string;
  amount: number;
  date: string;             // YYYY-MM-DD
  time: string;             // HH:mm:ss
  bank: string;
  storeName?: string;
  category?: string;
  userId: string;
  groupId: string;
  createdAt: string;        // ISO 8601
}

export type BankCode = 'kb' | 'shinhan' | 'nh' | 'kakao';

export const BankNames: Record<BankCode, string> = {
  kb: '국민은행',
  shinhan: '신한은행',
  nh: '농협은행',
  kakao: '카카오페이',
};
