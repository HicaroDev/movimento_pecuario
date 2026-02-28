import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env.local');
}

// navigator.locks reativado — coordena renovação de token entre abas.
// O deadlock anterior era causado por dois GoTrueClient simultâneos
// (adminClient + supabase). Como o adminClient foi removido e as
// operações admin usam fetch() direto, não há mais risco de deadlock.
export const supabase = createClient(supabaseUrl, supabaseKey);
