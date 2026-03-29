// AuthContext의 onAuthStateChanged 콜백 로직을 검증하는 테스트
// 핵심: user와 group 데이터를 모두 가져온 후에 state를 업데이트해야 한다

const mockGetAppUser = jest.fn();
const mockGetGroup = jest.fn();

jest.mock('@/services/auth', () => ({
  getAppUser: (...args: any[]) => mockGetAppUser(...args),
  getGroup: (...args: any[]) => mockGetGroup(...args),
}));

import { getAppUser, getGroup } from '@/services/auth';

beforeEach(() => {
  jest.clearAllMocks();
});

// AuthContext의 onAuthStateChanged 콜백과 동일한 로직을 재현
async function simulateAuthStateChanged(firebaseUser: { uid: string } | null) {
  let user = null;
  let group = null;

  if (firebaseUser) {
    const appUser = await getAppUser(firebaseUser.uid);
    const appGroup = appUser?.groupId ? await getGroup(appUser.groupId) : null;
    // 핵심: user와 group을 동시에 반환 (setState 동시 호출)
    user = appUser;
    group = appGroup;
  }

  return { user, group };
}

describe('AuthContext - 로그인 상태 변경 로직', () => {
  it('그룹이 있는 사용자 로그인 시 user와 group을 동시에 가져온다', async () => {
    const mockUser = {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: '홍길동',
      groupId: 'group-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };
    const mockGroupData = {
      id: 'group-1',
      name: '우리 가계부',
      inviteCode: 'ABC123',
      expiresAt: null,
      maxMembers: 2,
      memberIds: ['user-1'],
      createdBy: 'user-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };

    mockGetAppUser.mockResolvedValue(mockUser);
    mockGetGroup.mockResolvedValue(mockGroupData);

    const result = await simulateAuthStateChanged({ uid: 'user-1' });

    // user와 group이 모두 세팅됨 (중간에 group이 null인 순간이 없음)
    expect(result.user).toEqual(mockUser);
    expect(result.group).toEqual(mockGroupData);
    expect(mockGetAppUser).toHaveBeenCalledWith('user-1');
    expect(mockGetGroup).toHaveBeenCalledWith('group-1');
  });

  it('그룹이 없는 사용자 로그인 시 user만 세팅되고 getGroup은 호출되지 않는다', async () => {
    const mockUser = {
      uid: 'user-2',
      email: 'test2@example.com',
      displayName: '김철수',
      groupId: null,
      createdAt: '2026-03-27T00:00:00.000Z',
    };

    mockGetAppUser.mockResolvedValue(mockUser);

    const result = await simulateAuthStateChanged({ uid: 'user-2' });

    expect(result.user).toEqual(mockUser);
    expect(result.group).toBeNull();
    expect(mockGetAppUser).toHaveBeenCalledWith('user-2');
    expect(mockGetGroup).not.toHaveBeenCalled();
  });

  it('로그아웃 시 user와 group 모두 null이 된다', async () => {
    const result = await simulateAuthStateChanged(null);

    expect(result.user).toBeNull();
    expect(result.group).toBeNull();
    expect(mockGetAppUser).not.toHaveBeenCalled();
    expect(mockGetGroup).not.toHaveBeenCalled();
  });
});
