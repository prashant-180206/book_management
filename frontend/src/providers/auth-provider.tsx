import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { Session, User } from '@/services/auth';

type AuthContextValue = { token: string | null; user: User | null; signIn: (session: Session) => void; signOut: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const value = useMemo(() => ({ token: session?.access_token ?? null, user: session?.user ?? null, signIn: setSession, signOut: () => setSession(null) }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
