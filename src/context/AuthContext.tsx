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
const PROFILE_CACHE_KEY = 'suplementoControlProfile';

function readCachedProfile(): AuthUser | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as AuthUser;
    if (!p?.id) return null;
    return p;
  } catch {
    return null;
  }
}

function writeCachedProfile(p: AuthUser | null) {
  try {
    if (!p) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return;
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
  } catch {
    // ignore storage errors
  }
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data || !data.active) return null;
  const farmIds = (data.farm_ids as string[]) ?? [];
  return {
    id:      data.id,
    name:    data.name,
    email:   data.email ?? '',
    role:    data.role,
    modules: data.modules ?? [],
    farmId:  data.farm_id ?? farmIds[0] ?? undefined,
    farmIds,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = readCachedProfile();
    // Sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        if (cached?.id === session.user.id) {
          setUser(cached);
        }
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser(profile);
          writeCachedProfile(profile);
        } else if (cached?.id === session.user.id) {
          setUser(cached);
        }
      } else {
        writeCachedProfile(null);
      }
      setLoading(false);
    });

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED apenas renova o JWT — não muda o perfil.
        if (event === 'TOKEN_REFRESHED') return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            // Só atualiza se o usuário realmente mudou
            setUser(prev => (prev?.id === profile.id ? prev : profile));
            writeCachedProfile(profile);
          }
          return;
        }

        // Em alguns casos (multi-tab / refresh), o evento vem sem session.
        // Confirma se realmente não há sessão antes de limpar o usuário.
        const { data: { session: current } } = await supabase.auth.getSession();
        if (current?.user) {
          const profile = await fetchProfile(current.user.id);
          if (profile) {
            setUser(prev => (prev?.id === profile.id ? prev : profile));
            writeCachedProfile(profile);
          }
        } else {
          setUser(null);
          writeCachedProfile(null);
        }
      }
    );

    // Renova sessão apenas se tab ficou oculto 30+ segundos e o token está perto de expirar
    let hiddenAt: number | null = null;
    const handleVisible = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (document.visibilityState !== 'visible') return;
      const elapsed = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (elapsed <= 30_000) return;
      const { data: { session } } = await supabase.auth.getSession();
      const expiresAt = session?.expires_at ?? 0;
      const now = Math.floor(Date.now() / 1000);
      if (session && expiresAt - now < 60) {
        await supabase.auth.refreshSession();
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
