import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getAppUser, getGroup } from '@/services/auth';
import type { AppUser, Group } from '@/types/user';

interface AuthState {
  user: AppUser | null;
  group: Group | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setGroup: (group: Group | null) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  group: null,
  loading: true,
  setUser: () => {},
  setGroup: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await getAppUser(firebaseUser.uid);
        const appGroup = appUser?.groupId ? await getGroup(appUser.groupId) : null;
        setUser(appUser);
        setGroup(appGroup);
      } else {
        setUser(null);
        setGroup(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, group, loading, setUser, setGroup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
