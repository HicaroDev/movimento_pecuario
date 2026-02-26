import type { FarmUser, Module } from '../types/user';

const STORAGE_KEY = 'suplementoControlUsers';

const ALL_MODULES: Module[] = ['relatorio', 'formulario', 'pastos', 'fazendas', 'usuarios'];

const SEED_USERS: FarmUser[] = [
  {
    id: '1',
    email: 'admin@suplemento.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    farmId: undefined,
    modules: ALL_MODULES,
    active: true,
    createdAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: '2',
    email: 'cliente@malhada.com',
    password: 'malhada123',
    name: 'Fazenda Malhada Grande',
    role: 'client',
    farmId: 'farm-1',
    modules: ['relatorio', 'formulario', 'pastos', 'fazendas', 'usuarios'],
    active: true,
    createdAt: new Date('2025-01-01').toISOString(),
  },
];

function load(): FarmUser[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FarmUser[]) : null;
  } catch { return null; }
}

function save(users: FarmUser[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function migrateModules(users: FarmUser[]): FarmUser[] {
  let changed = false;
  const migrated = users.map(u => {
    let mods = (u.modules ?? []) as string[];
    // Renomear 'cliente' → 'fazendas'
    if (mods.includes('cliente')) {
      mods = mods.map(m => m === 'cliente' ? 'fazendas' : m);
      changed = true;
    }
    // Admin recebe todos os módulos
    if (u.role === 'admin') {
      const missingAdmin = ALL_MODULES.filter(m => !mods.includes(m));
      if (missingAdmin.length) { mods = ALL_MODULES as string[]; changed = true; }
    } else {
      // Cliente ganha módulos que faltam (exceto nenhuma restrição por enquanto)
      const defaultClient: Module[] = ['relatorio', 'formulario', 'pastos', 'fazendas', 'usuarios'];
      const missing = defaultClient.filter(m => !mods.includes(m));
      if (missing.length) { mods = [...mods, ...missing]; changed = true; }
    }
    return { ...u, modules: mods as Module[] };
  });
  if (changed) save(migrated);
  return migrated;
}

function init(): FarmUser[] {
  const existing = load();
  if (existing && existing.length > 0) return migrateModules(existing);
  save(SEED_USERS);
  return [...SEED_USERS];
}

// API-ready interface — troque por supabase.from('profiles') quando vier o backend

export const userService = {
  list(): FarmUser[] {
    return init();
  },

  listByFarm(farmId: string): FarmUser[] {
    return init().filter(u => u.farmId === farmId);
  },

  findByEmail(email: string): FarmUser | undefined {
    return init().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id: string): FarmUser | undefined {
    return init().find(u => u.id === id);
  },

  create(data: Omit<FarmUser, 'id' | 'createdAt'>): FarmUser {
    const users = init();
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('E-mail já cadastrado.');
    }
    const user: FarmUser = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    save([...users, user]);
    return user;
  },

  update(id: string, data: Partial<FarmUser>): FarmUser {
    const users = init();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado.');
    if (data.email && data.email !== users[idx].email) {
      if (users.some(u => u.id !== id && u.email.toLowerCase() === data.email!.toLowerCase())) {
        throw new Error('E-mail já cadastrado.');
      }
    }
    const updated = { ...users[idx], ...data };
    users[idx] = updated;
    save(users);
    return updated;
  },

  remove(id: string): void {
    save(init().filter(u => u.id !== id));
  },
};
