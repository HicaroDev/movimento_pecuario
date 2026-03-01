import { supabase } from '../lib/supabase';
import type { Farm } from '../types/farm';

let farmsCache: Farm[] | null = null;
let farmsCacheAt = 0;
const CACHE_TTL = 60_000;
const STORAGE_KEY = 'suplementoControlFarmsCache';

function loadCacheFromStorage(): Farm[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items: Farm[]; at: number };
    if (!Array.isArray(parsed.items)) return null;
    farmsCache = parsed.items;
    farmsCacheAt = parsed.at || Date.now();
    return farmsCache;
  } catch {
    return null;
  }
}

function saveCacheToStorage(items: Farm[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, at: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

function toFarm(row: Record<string, unknown>): Farm {
  return {
    id:                row.id as string,
    nomeFazenda:       row.nome_fazenda as string,
    nomeResponsavel:   (row.nome_responsavel as string) ?? undefined,
    quantidadeCabecas: (row.quantidade_cabecas as number) ?? undefined,
    endereco:          (row.endereco as string) ?? undefined,
    telefone:          (row.telefone as string) ?? undefined,
    email:             (row.email as string) ?? undefined,
    logoUrl:           (row.logo_url as string) ?? undefined,
    active:            row.active as boolean,
    createdAt:         row.created_at as string,
  };
}

function toRow(d: Partial<Farm>) {
  return {
    ...(d.nomeFazenda       !== undefined && { nome_fazenda:       d.nomeFazenda }),
    ...(d.nomeResponsavel   !== undefined && { nome_responsavel:   d.nomeResponsavel ?? null }),
    ...(d.quantidadeCabecas !== undefined && { quantidade_cabecas: d.quantidadeCabecas ?? null }),
    ...(d.endereco          !== undefined && { endereco:           d.endereco ?? null }),
    ...(d.telefone          !== undefined && { telefone:           d.telefone ?? null }),
    ...(d.email             !== undefined && { email:              d.email ?? null }),
    ...(d.logoUrl           !== undefined && { logo_url:           d.logoUrl ?? null }),
    ...(d.active            !== undefined && { active:             d.active }),
  };
}

export const farmService = {
  async list(): Promise<Farm[]> {
    try {
      const { data, error } = await supabase
        .from('farms').select('*').order('nome_fazenda');
      if (error) throw new Error(error.message);
      const farms = (data ?? []).map(toFarm);
      farmsCache = farms;
      farmsCacheAt = Date.now();
      saveCacheToStorage(farms);
      return farms;
    } catch (err) {
      if (farmsCache) return farmsCache;
      const stored = loadCacheFromStorage();
      if (stored) return stored;
      throw err;
    }
  },

  async findById(id: string): Promise<Farm | null> {
    if (!farmsCache) loadCacheFromStorage();
    if (farmsCache && Date.now() - farmsCacheAt < CACHE_TTL) {
      const cached = farmsCache.find(f => f.id === id);
      if (cached) return cached;
    }
    try {
      const { data, error } = await supabase
        .from('farms').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toFarm(data) : null;
    } catch {
      if (farmsCache) {
        return farmsCache.find(f => f.id === id) ?? null;
      }
      return null;
    }
  },

  async create(d: Omit<Farm, 'id' | 'createdAt'>): Promise<Farm> {
    const { data, error } = await supabase
      .from('farms').insert({ nome_fazenda: d.nomeFazenda, ...toRow(d) })
      .select().single();
    if (error) throw new Error(error.message);
    return toFarm(data);
  },

  async update(id: string, d: Partial<Farm>): Promise<Farm> {
    const { data, error } = await supabase
      .from('farms').update(toRow(d)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toFarm(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('farms').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
