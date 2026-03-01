import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { FarmUser, Module } from '../types/user';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SERVICE_ROLE_KEY  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;
const STORAGE_KEY = 'suplementoControlUsersCache';
let usersCache: FarmUser[] | null = null;
let usersCacheAt = 0;
const CACHE_TTL = 60_000;

function loadCacheFromStorage(): FarmUser[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items: FarmUser[]; at: number };
    if (!Array.isArray(parsed.items)) return null;
    usersCache = parsed.items;
    usersCacheAt = parsed.at || Date.now();
    return usersCache;
  } catch {
    return null;
  }
}

function saveCacheToStorage(items: FarmUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, at: Date.now() }));
  } catch {
    // ignore
  }
}

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
  const farmIds = (row.farm_ids as string[]) ?? [];
  const farmId  = (row.farm_id as string) ?? farmIds[0] ?? undefined;
  return {
    id:        row.id as string,
    name:      row.name as string,
    email:     (row.email as string) ?? '',
    password:  '',
    role:      row.role as 'admin' | 'client',
    farmId,
    farmIds,
    modules:   (row.modules as Module[]) ?? [],
    active:    row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export const userService = {
  async list(): Promise<FarmUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').order('name');
      if (error) throw new Error(error.message);
      const users = (data ?? []).map(toFarmUser);
      usersCache = users;
      usersCacheAt = Date.now();
      saveCacheToStorage(users);
      return users;
    } catch (err) {
      if (usersCache) return usersCache;
      const stored = loadCacheFromStorage();
      if (stored) return stored;
      throw err;
    }
  },

  async listByFarm(farmId: string): Promise<FarmUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*')
        .or(`farm_id.eq.${farmId},farm_ids.cs.{${farmId}}`)
        .order('name');
      if (error) throw new Error(error.message);
      const users = (data ?? []).map(toFarmUser);
      usersCache = usersCache ? [...usersCache.filter(u => u.farmId !== farmId), ...users] : users;
      usersCacheAt = Date.now();
      saveCacheToStorage(usersCache);
      return users;
    } catch (err) {
      if (!usersCache) loadCacheFromStorage();
      if (usersCache) return usersCache.filter(u => u.farmId === farmId);
      throw err;
    }
  },

  async findByEmail(email: string): Promise<FarmUser | null> {
    const { data } = await supabase
      .from('profiles').select('*').ilike('email', email).maybeSingle();
    return data ? toFarmUser(data) : null;
  },

  async findById(id: string): Promise<FarmUser | null> {
    if (!usersCache) loadCacheFromStorage();
    if (usersCache && Date.now() - usersCacheAt < CACHE_TTL) {
      const cached = usersCache.find(u => u.id === id);
      if (cached) return cached;
    }
    try {
      const { data } = await supabase
        .from('profiles').select('*').eq('id', id).maybeSingle();
      return data ? toFarmUser(data) : null;
    } catch {
      if (usersCache) return usersCache.find(u => u.id === id) ?? null;
      return null;
    }
  },

  async create(d: Omit<FarmUser, 'id' | 'createdAt'>): Promise<FarmUser> {
    // Cria auth user via REST (sem segundo GoTrueClient), já confirmado
    const userId = await adminCreateAuthUser(d.email, d.password, d.name, d.role);

    // Trigger cria o perfil; atualiza com os dados extras
    const ids = d.farmIds?.length ? d.farmIds : (d.farmId ? [d.farmId] : []);
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        name:     d.name,
        email:    d.email,
        role:     d.role,
        farm_id:  ids[0] ?? null,
        farm_ids: ids,
        modules:  d.modules,
        active:   d.active,
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
    if (d.farmIds !== undefined) {
      patch.farm_ids = d.farmIds;
      patch.farm_id  = d.farmIds[0] ?? null;
    } else if (d.farmId !== undefined) {
      patch.farm_id  = d.farmId ?? null;
      patch.farm_ids = d.farmId ? [d.farmId] : [];
    }
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
