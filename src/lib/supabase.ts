import { createClient } from '@supabase/supabase-js';

const supabaseUrl        = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey        = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env.local');
}

const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storage: typeof window !== 'undefined' ? localStorage : undefined,
  // navigator.locks desabilitado — o Supabase self-hosted no EasyPanel
  // entra em deadlock ao tentar adquirir o lock no startup da página.
  lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
};

// Cliente padrão (anon) — sujeito a RLS
export const supabase = createClient(supabaseUrl, supabaseKey, { auth: authOptions });

// Cliente admin (service role) — bypassa RLS para operações internas de auth
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : supabase; // fallback para anon se a chave não estiver configurada
