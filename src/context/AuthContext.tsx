import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, Module } from '../types/user';
import { userService } from '../services/userService';

export type { Role, Module } from '../types/user';
export type { AuthUser } from '../types/user';

const STORAGE_KEY = 'suplementoControlAuth';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  hasModule: (m: Module) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      // Migração: re-enriquecer sempre que a lista de módulos mudar (ex: renomear 'cliente'→'fazendas')
      const currentModules = ['relatorio', 'formulario', 'pastos', 'fazendas', 'usuarios'];
      const needsRefresh = !parsed.modules
        || parsed.modules.includes('cliente' as never)
        || currentModules.some(m => !parsed.modules.includes(m as never));
      if (needsRefresh) {
        const fresh = userService.findByEmail(parsed.email);
        if (!fresh || !fresh.active) return null;
        const { password: _pw, ...authUser } = fresh;
        return authUser;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function login(email: string, password: string): boolean {
    const found = userService.findByEmail(email);
    if (!found || found.password !== password || !found.active) return false;
    const { password: _pw, ...authUser } = found;
    setUser(authUser);
    return true;
  }

  function logout() {
    setUser(null);
  }

  function hasModule(m: Module): boolean {
    return user?.modules?.includes(m) ?? false;
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      hasModule,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
