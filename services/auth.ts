import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { AppUser, Group } from '@/types/user';

export async function register(email: string, password: string, displayName: string): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  const appUser: AppUser = {
    uid: credential.user.uid,
    email,
    displayName,
    groupId: null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', credential.user.uid), appUser);
  return appUser;
}

export async function login(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  return userDoc.data() as AppUser;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as AppUser;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGroup(userId: string, groupName: string): Promise<Group> {
  const groupRef = doc(collection(db, 'groups'));
  const group: Group = {
    id: groupRef.id,
    name: groupName,
    inviteCode: generateInviteCode(),
    expiresAt: null,
    maxMembers: 2,
    memberIds: [userId],
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(groupRef, group);
  await updateDoc(doc(db, 'users', userId), { groupId: group.id });
  return group;
}

export async function joinGroup(userId: string, inviteCode: string): Promise<Group> {
  const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('유효하지 않은 초대 코드입니다.');
  }

  const groupDoc = snapshot.docs[0];
  const group = groupDoc.data() as Group;

  if (group.memberIds.length >= group.maxMembers) {
    throw new Error('그룹 인원이 가득 찼습니다.');
  }

  await updateDoc(doc(db, 'groups', group.id), {
    memberIds: arrayUnion(userId),
  });
  await updateDoc(doc(db, 'users', userId), { groupId: group.id });

  return { ...group, memberIds: [...group.memberIds, userId] };
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (!groupDoc.exists()) return null;
  return groupDoc.data() as Group;
}
