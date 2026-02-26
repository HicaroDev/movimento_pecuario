import type { Farm } from '../types/farm';

const STORAGE_KEY = 'suplementoControlFarms';

const SEED_FARMS: Farm[] = [
  {
    id: 'farm-1',
    nomeFazenda: 'Fazenda Malhada Grande',
    nomeResponsavel: '',
    quantidadeCabecas: 0,
    endereco: '',
    telefone: '',
    email: '',
    logoUrl: '',
    active: true,
    createdAt: new Date('2025-01-01').toISOString(),
  },
];

function load(): Farm[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Farm[]) : null;
  } catch { return null; }
}

function save(farms: Farm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(farms));
}

function init(): Farm[] {
  const existing = load();
  if (existing && existing.length > 0) return existing;
  save(SEED_FARMS);
  return [...SEED_FARMS];
}

// API-ready interface — troque por supabase.from('farms') quando vier o backend

export const farmService = {
  list(): Farm[] {
    return init();
  },

  findById(id: string): Farm | undefined {
    return init().find(f => f.id === id);
  },

  create(data: Omit<Farm, 'id' | 'createdAt'>): Farm {
    const farms = init();
    const farm: Farm = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    save([...farms, farm]);
    return farm;
  },

  update(id: string, data: Partial<Farm>): Farm {
    const farms = init();
    const idx = farms.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Fazenda não encontrada.');
    const updated = { ...farms[idx], ...data };
    farms[idx] = updated;
    save(farms);
    return updated;
  },

  remove(id: string): void {
    save(init().filter(f => f.id !== id));
  },
};
