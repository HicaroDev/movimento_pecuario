const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verifica senha via REST direto — sem substituir a sessão ativa do cliente JS
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
