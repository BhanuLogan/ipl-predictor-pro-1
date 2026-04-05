import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api, type User } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => api.getStoredUser());
  const [loading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    const u = await api.login(username, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const u = await api.register(username, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(api.getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
