import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiLogin, apiMe, apiRegister, type ApiUser } from "../lib/api";

const TOKEN_KEY = "buzzin_access_v3";
const USER_KEY = "buzzin_user_v3";

export type User = ApiUser;

type AuthContextValue = {
  user: User | null;
  token: string | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function persist(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function readPersisted(): { token: string; user: User } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!token || !raw) return null;
    const user = JSON.parse(raw) as User;
    if (!user?.id || !user?.email) return null;
    return { token, user };
  } catch {
    return null;
  }
}

function clearPersisted() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = readPersisted();
      if (!saved) {
        if (!cancelled) setBootstrapping(false);
        return;
      }
      try {
        const me = await apiMe(saved.token);
        if (cancelled) return;
        if (!me) {
          clearPersisted();
          setToken(null);
          setUser(null);
          return;
        }
        setToken(saved.token);
        setUser(me.user);
        persist(saved.token, me.user);
      } catch {
        clearPersisted();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    persist(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => {
    const res = await apiRegister(input);
    persist(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearPersisted();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      bootstrapping,
      login,
      register,
      logout,
    }),
    [user, token, bootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
