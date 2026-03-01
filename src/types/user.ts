export type Role = 'admin' | 'client';
export type Module = 'relatorio' | 'formulario' | 'pastos' | 'fazendas' | 'usuarios';

export interface FarmUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  farmId?: string;    // fazenda principal (backward compat — farm_id)
  farmIds: string[];  // todas as fazendas vinculadas (farm_ids[])
  modules: Module[];
  active: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  modules: Module[];
  farmId?: string;    // fazenda principal
  farmIds: string[];  // todas as fazendas
}
