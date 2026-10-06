import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Session, User } from "@/services/auth";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  signIn: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "shelfwise_session";

function getStoredSession(): Session | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(getStoredSession);

  const signIn = (newSession: Session) => {
    setSession(newSession);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      } catch {
        // ignore
      }
    }
  };

  const signOut = () => {
    setSession(null);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    // If not in state, check storage on mount
    if (!session) {
      const stored = getStoredSession();
      if (stored) {
        setSession(stored);
      }
    }
  }, [session]);

  const value = useMemo(
    () => ({
      token: session?.access_token ?? null,
      user: session?.user ?? null,
      signIn,
      signOut,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
