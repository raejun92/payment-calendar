import type { AppUser, Group } from '@/types/user';

describe('AppUser 타입', () => {
  it('AppUser 객체가 올바른 구조를 가진다', () => {
    const user: AppUser = {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: '홍길동',
      groupId: 'group-1',
      createdAt: '2026-03-24T10:00:00.000Z',
    };

    expect(user.uid).toBe('user-1');
    expect(user.email).toBe('test@example.com');
    expect(user.displayName).toBe('홍길동');
    expect(user.groupId).toBe('group-1');
  });

  it('groupId가 null일 수 있다 (그룹 미가입)', () => {
    const user: AppUser = {
      uid: 'user-2',
      email: 'test2@example.com',
      displayName: '김철수',
      groupId: null,
      createdAt: '2026-03-24T10:00:00.000Z',
    };

    expect(user.groupId).toBeNull();
  });
});

describe('Group 타입', () => {
  it('Group 객체가 올바른 구조를 가진다', () => {
    const group: Group = {
      id: 'group-1',
      name: '우리 가계부',
      inviteCode: 'ABC123',
      expiresAt: null,
      maxMembers: 2,
      memberIds: ['user-1'],
      createdBy: 'user-1',
      createdAt: '2026-03-24T10:00:00.000Z',
    };

    expect(group.name).toBe('우리 가계부');
    expect(group.inviteCode).toBe('ABC123');
    expect(group.maxMembers).toBe(2);
    expect(group.memberIds).toHaveLength(1);
    expect(group.expiresAt).toBeNull();
  });

  it('expiresAt에 만료 시간을 설정할 수 있다', () => {
    const group: Group = {
      id: 'group-2',
      name: '테스트 그룹',
      inviteCode: 'XYZ789',
      expiresAt: '2026-04-24T10:00:00.000Z',
      maxMembers: 5,
      memberIds: ['user-1', 'user-2'],
      createdBy: 'user-1',
      createdAt: '2026-03-24T10:00:00.000Z',
    };

    expect(group.expiresAt).toBe('2026-04-24T10:00:00.000Z');
    expect(group.maxMembers).toBe(5);
    expect(group.memberIds).toHaveLength(2);
  });
});
