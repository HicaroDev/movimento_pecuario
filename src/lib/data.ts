export interface DataEntry {
  id?: string;     // UUID do Supabase
  data?: string;   // YYYY-MM-DD
  pasto: string;
  quantidade: number;
  tipo: string;
  periodo: number;
  sacos: number;
  kg: number;
  consumo: number; // kg/cab/dia = kg / (quantidade * periodo)
}

export const STORAGE_KEY = 'suplementoControlData';

/* Ordem de exibição e cores — alinhados com os nomes reais do banco */
export const supplementOrder = [
  'Energetico 0,3%',
  'Energetico 0,5%',
  'Mineral Adensado Aguas',
  'Mineral Adensado Seca',
  'Mineral Adensado Transicao',
  'Proteico 0,1% Aguas',
  'Proteico 0,1% Seca',
  'Proteico 0,1% Transicao',
  'Proteico 0,2%',
  'Racao Creep',
  'Ração Engorda TIP',
  'Sal Mieneral Reprodução',
  'Sal Mineral Águas',
  'Sal Mineral Águas Aditivado',
  'Sal Mineral com Ureia',
];

export const supplementColors: Record<string, string> = {
  'Energetico 0,3%':             '#1a6040',
  'Energetico 0,5%':             '#2d8a60',
  'Mineral Adensado Aguas':      '#0b2748',
  'Mineral Adensado Seca':       '#1a4a7a',
  'Mineral Adensado Transicao':  '#2563a8',
  'Proteico 0,1% Aguas':         '#b45309',
  'Proteico 0,1% Seca':          '#d97706',
  'Proteico 0,1% Transicao':     '#f59e0b',
  'Proteico 0,2%':               '#c2410c',
  'Racao Creep':                 '#6b2fa0',
  'Ração Engorda TIP':           '#7c3aed',
  'Sal Mieneral Reprodução':     '#0e7490',
  'Sal Mineral Águas':           '#0891b2',
  'Sal Mineral Águas Aditivado': '#06b6d4',
  'Sal Mineral com Ureia':       '#0d9488',
};

/* Paleta de fallback para suplementos não mapeados */
const FALLBACK_PALETTE = [
  '#1a6040','#0b2748','#6b2fa0','#c2410c','#0e7490',
  '#2d8a60','#1a4a7a','#b45309','#7c3aed','#0891b2',
];
export function getSupplementColor(tipo: string, index = 0): string {
  return supplementColors[tipo] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export const sampleRows: DataEntry[] = [];

export function loadData(): DataEntry[] | null { return null; }
export function saveData(_entries: DataEntry[]): void {}
