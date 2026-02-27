import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { FarmUser, Module } from '../types/user';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SERVICE_ROLE_KEY  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Chama a Admin REST API diretamente — sem criar segundo GoTrueClient no browser
async function adminCreateAuthUser(email: string, password: string, name: string, role: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.msg ?? json.message ?? 'Erro ao criar usuário.');
  return json.id as string;
}

function toFarmUser(row: Record<string, unknown>): FarmUser {
  return {
    id:        row.id as string,
    name:      row.name as string,
    email:     (row.email as string) ?? '',
    password:  '',
    role:      row.role as 'admin' | 'client',
    farmId:    (row.farm_id as string) ?? undefined,
    modules:   (row.modules as Module[]) ?? [],
    active:    row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export const userService = {
  async list(): Promise<FarmUser[]> {
    const { data, error } = await supabase
      .from('profiles').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toFarmUser);
  },

  async listByFarm(farmId: string): Promise<FarmUser[]> {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('farm_id', farmId).order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toFarmUser);
  },

  async findByEmail(email: string): Promise<FarmUser | null> {
    const { data } = await supabase
      .from('profiles').select('*').ilike('email', email).maybeSingle();
    return data ? toFarmUser(data) : null;
  },

  async findById(id: string): Promise<FarmUser | null> {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', id).maybeSingle();
    return data ? toFarmUser(data) : null;
  },

  async create(d: Omit<FarmUser, 'id' | 'createdAt'>): Promise<FarmUser> {
    // Cria auth user via REST (sem segundo GoTrueClient), já confirmado
    const userId = await adminCreateAuthUser(d.email, d.password, d.name, d.role);

    // Trigger cria o perfil; atualiza com os dados extras
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        name:    d.name,
        email:   d.email,
        role:    d.role,
        farm_id: d.farmId ?? null,
        modules: d.modules,
        active:  d.active,
      })
      .eq('id', userId)
      .select().single();
    if (profileErr) throw new Error(profileErr.message);
    return toFarmUser(profile);
  },

  async update(id: string, d: Partial<FarmUser>): Promise<FarmUser> {
    const patch: Record<string, unknown> = {};
    if (d.name    !== undefined) patch.name    = d.name;
    if (d.email   !== undefined) patch.email   = d.email;
    if (d.role    !== undefined) patch.role    = d.role;
    if (d.farmId  !== undefined) patch.farm_id = d.farmId ?? null;
    if (d.modules !== undefined) patch.modules = d.modules;
    if (d.active  !== undefined) patch.active  = d.active;

    logger.info('userService.update', `atualizando perfil ${id}`, patch);

    // Usa service role key para bypass de RLS (admin editando outro usuário)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    logger.info('userService.update', `resposta ${res.status}`, json);
    if (!res.ok) throw new Error(json?.message ?? 'Erro ao atualizar usuário.');
    if (!json[0]) throw new Error('Usuário não encontrado.');
    return toFarmUser(json[0]);
  },

  async remove(id: string): Promise<void> {
    // Deleta o auth user via Admin API (cascade deleta o profile)
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.msg ?? json.message ?? 'Erro ao remover usuário.');
    }
  },
};
