export interface Farm {
  id: string;
  nomeFazenda: string;
  nomeResponsavel?: string;
  quantidadeCabecas?: number;
  endereco?: string;
  telefone?: string;
  email?: string;
  logoUrl?: string;
  active: boolean;
  createdAt: string;
}
