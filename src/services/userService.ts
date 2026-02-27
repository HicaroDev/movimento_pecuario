import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { FarmUser, Module } from '../types/user';

// Cliente separado para criar usuários sem afetar a sessão do admin
const _authHelper = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

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
    // Usa cliente auxiliar para não sobrescrever sessão do admin
    const { data: auth, error: authErr } = await _authHelper.auth.signUp({
      email: d.email,
      password: d.password,
      options: { data: { name: d.name, role: d.role } },
    });
    if (authErr) throw new Error(authErr.message);
    if (!auth.user) throw new Error('Erro ao criar usuário.');

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
      .eq('id', auth.user.id)
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

    const { data, error } = await supabase
      .from('profiles').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toFarmUser(data);
  },

  async remove(id: string): Promise<void> {
    // Soft delete — desativa o perfil
    const { error } = await supabase
      .from('profiles').update({ active: false }).eq('id', id);
    if (error) throw new Error(error.message);
  },
};
