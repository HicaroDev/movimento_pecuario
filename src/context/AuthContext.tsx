import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, Module } from '../types/user';
import { supabase } from '../lib/supabase';

export type { Role, Module } from '../types/user';
export type { AuthUser } from '../types/user';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasModule: (m: Module) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data || !data.active) return null;
  return {
    id:      data.id,
    name:    data.name,
    email:   data.email ?? '',
    role:    data.role,
    modules: data.modules ?? [],
    farmId:  data.farm_id ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    // Renova sessão apenas se tab ficou oculto 30+ segundos
    let hiddenAt: number | null = null;
    const handleVisible = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        const elapsed = hiddenAt ? Date.now() - hiddenAt : 0;
        if (elapsed > 30_000) supabase.auth.refreshSession();
        hiddenAt = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
    setUser(null);
  }

  function hasModule(m: Module): boolean {
    return user?.modules?.includes(m) ?? false;
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout,
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
