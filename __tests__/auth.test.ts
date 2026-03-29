// Firebase mock 설정
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn((...args: any[]) => ({ id: 'mock-doc-id', path: args.join('/') }));
const mockCollection = jest.fn((...args: any[]) => ({ path: args.join('/') }));
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockArrayUnion = jest.fn((val: string) => val);

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
}));

import { register, login, logout, getAppUser, createGroup, joinGroup, getGroup } from '@/services/auth';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('회원가입', () => {
  it('이메일/비밀번호로 회원가입하면 AppUser를 반환한다', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-1' },
    });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await register('test@example.com', 'password123', '홍길동');

    expect(result.uid).toBe('user-1');
    expect(result.email).toBe('test@example.com');
    expect(result.displayName).toBe('홍길동');
    expect(result.groupId).toBeNull();
    expect(result.createdAt).toBeDefined();
  });

  it('회원가입 시 Firebase Auth와 Firestore에 데이터를 저장한다', async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-1' },
    });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    await register('test@example.com', 'password123', '홍길동');

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith({ uid: 'user-1' }, { displayName: '홍길동' });
    expect(mockSetDoc).toHaveBeenCalled();
  });
});

describe('로그인', () => {
  it('이메일/비밀번호로 로그인하면 AppUser를 반환한다', async () => {
    const mockUser = {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: '홍길동',
      groupId: 'group-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };

    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-1' },
    });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUser,
    });

    const result = await login('test@example.com', 'password123');

    expect(result.uid).toBe('user-1');
    expect(result.displayName).toBe('홍길동');
    expect(result.groupId).toBe('group-1');
  });
});

describe('로그아웃', () => {
  it('signOut을 호출한다', async () => {
    mockSignOut.mockResolvedValue(undefined);

    await logout();

    expect(mockSignOut).toHaveBeenCalled();
  });
});

describe('사용자 조회', () => {
  it('존재하는 사용자를 조회하면 AppUser를 반환한다', async () => {
    const mockUser = {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: '홍길동',
      groupId: null,
      createdAt: '2026-03-27T00:00:00.000Z',
    };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUser,
    });

    const result = await getAppUser('user-1');

    expect(result).toEqual(mockUser);
  });

  it('존재하지 않는 사용자를 조회하면 null을 반환한다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await getAppUser('nonexistent');

    expect(result).toBeNull();
  });
});

describe('그룹 생성', () => {
  it('그룹을 생성하면 6자리 초대 코드가 포함된 Group을 반환한다', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await createGroup('user-1', '우리 가계부');

    expect(result.name).toBe('우리 가계부');
    expect(result.inviteCode).toHaveLength(6);
    expect(result.maxMembers).toBe(2);
    expect(result.memberIds).toEqual(['user-1']);
    expect(result.createdBy).toBe('user-1');
    expect(result.expiresAt).toBeNull();
  });

  it('그룹 생성 시 Firestore에 그룹을 저장하고 사용자의 groupId를 업데이트한다', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);

    await createGroup('user-1', '우리 가계부');

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });
});

describe('그룹 참여', () => {
  it('유효한 초대 코드로 그룹에 참여할 수 있다', async () => {
    const mockGroup = {
      id: 'group-1',
      name: '우리 가계부',
      inviteCode: 'ABC123',
      expiresAt: null,
      maxMembers: 2,
      memberIds: ['user-1'],
      createdBy: 'user-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockGroup }],
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await joinGroup('user-2', 'ABC123');

    expect(result.memberIds).toContain('user-2');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
  });

  it('유효하지 않은 초대 코드로 참여하면 에러가 발생한다', async () => {
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    await expect(joinGroup('user-2', 'WRONG1')).rejects.toThrow('유효하지 않은 초대 코드입니다.');
  });

  it('그룹 인원이 가득 차면 참여할 수 없다', async () => {
    const mockGroup = {
      id: 'group-1',
      name: '우리 가계부',
      inviteCode: 'ABC123',
      expiresAt: null,
      maxMembers: 2,
      memberIds: ['user-1', 'user-2'],
      createdBy: 'user-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };

    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockGroup }],
    });

    await expect(joinGroup('user-3', 'ABC123')).rejects.toThrow('그룹 인원이 가득 찼습니다.');
  });
});

describe('그룹 조회', () => {
  it('존재하는 그룹을 조회하면 Group을 반환한다', async () => {
    const mockGroup = {
      id: 'group-1',
      name: '우리 가계부',
      inviteCode: 'ABC123',
      expiresAt: null,
      maxMembers: 2,
      memberIds: ['user-1'],
      createdBy: 'user-1',
      createdAt: '2026-03-27T00:00:00.000Z',
    };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockGroup,
    });

    const result = await getGroup('group-1');

    expect(result).toEqual(mockGroup);
  });

  it('존재하지 않는 그룹을 조회하면 null을 반환한다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await getGroup('nonexistent');

    expect(result).toBeNull();
  });
});
