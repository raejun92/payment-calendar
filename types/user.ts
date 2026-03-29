export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  groupId: string | null;
  createdAt: string;          // ISO 8601
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  expiresAt: string | null;   // ISO 8601, null = 만료 없음
  maxMembers: number;
  memberIds: string[];
  createdBy: string;          // userId
  createdAt: string;          // ISO 8601
}
