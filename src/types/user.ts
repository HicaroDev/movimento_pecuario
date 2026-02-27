export type Role = 'admin' | 'client';
export type Module = 'relatorio' | 'formulario' | 'pastos' | 'fazendas' | 'usuarios';

export interface FarmUser {
  id: string;
  name: string;       // nome de exibição
  email: string;
  password: string;   // plain text agora; hash quando vier backend
  role: Role;
  farmId?: string;    // fazenda vinculada (obrigatório para clientes)
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
  farmId?: string;
}
