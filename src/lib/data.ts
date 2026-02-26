export interface DataEntry {
  pasto: string;
  quantidade: number;
  tipo: string;
  periodo: number;
  sacos: number;
  kg: number;
  consumo: number;
}

export const STORAGE_KEY = 'suplementoControlData';

export const supplementOrder = [
  'Energético 0,3%',
  'Mineral Adensado Águas',
  'Ração Creep',
];

export const supplementColors: Record<string, string> = {
  'Energético 0,3%':        '#1a6040',   // verde Movimento Pecuário
  'Mineral Adensado Águas': '#0b2748',
  'Ração Creep':            '#6b2fa0',
};

export const sampleRows: DataEntry[] = [
  { pasto: 'Cana', quantidade: 30, tipo: 'Energético 0,3%', periodo: 30, sacos: 96, kg: 2400, consumo: 0.842 },
  { pasto: 'Tamboril', quantidade: 30, tipo: 'Energético 0,3%', periodo: 30, sacos: 48, kg: 1200, consumo: 1.0 },
  { pasto: 'Sujo 1', quantidade: 40, tipo: 'Energético 0,3%', periodo: 30, sacos: 54, kg: 1350, consumo: 1.452 },
  { pasto: 'Mama de Baixo Piquete 2', quantidade: 117, tipo: 'Energético 0,3%', periodo: 30, sacos: 16, kg: 400, consumo: 0.833 },
  { pasto: 'Mama de Baixo Piquete 1', quantidade: 98, tipo: 'Energético 0,3%', periodo: 30, sacos: 44, kg: 1100, consumo: 0.78 },
  { pasto: 'Palhadão do Meio', quantidade: 31, tipo: 'Energético 0,3%', periodo: 30, sacos: 70, kg: 1750, consumo: 0.729 },
  { pasto: 'Rio do Ouro de Baixo', quantidade: 64, tipo: 'Energético 0,3%', periodo: 30, sacos: 120, kg: 3000, consumo: 0.862 },
  { pasto: 'Rio do Ouro de Cima', quantidade: 80, tipo: 'Energético 0,3%', periodo: 30, sacos: 40, kg: 1000, consumo: 0.45 },
  { pasto: 'Pequi 2', quantidade: 20, tipo: 'Energético 0,3%', periodo: 30, sacos: 45, kg: 1125, consumo: 0.586 },
  { pasto: 'João Jacinto de Cima', quantidade: 74, tipo: 'Energético 0,3%', periodo: 30, sacos: 40, kg: 1000, consumo: 0.606 },
  { pasto: 'Da Maternidade', quantidade: 34, tipo: 'Energético 0,3%', periodo: 30, sacos: 38, kg: 950, consumo: 0.772 },
  { pasto: 'Ponte Cima', quantidade: 36, tipo: 'Energético 0,3%', periodo: 30, sacos: 28, kg: 700, consumo: 0.496 },
  { pasto: 'Luizinho', quantidade: 30, tipo: 'Energético 0,3%', periodo: 30, sacos: 25, kg: 625, consumo: 0.326 },
  { pasto: 'Boiada Gorda', quantidade: 97, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 18, kg: 450, consumo: 0.155 },
  { pasto: 'Divaldo', quantidade: 174, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 30, kg: 750, consumo: 0.144 },
  { pasto: 'Pasto do Braquiarão', quantidade: 57, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 12, kg: 300, consumo: 0.175 },
  { pasto: 'João Jacinto de Baixo', quantidade: 78, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 15, kg: 375, consumo: 0.16 },
  { pasto: 'Tucuzão Braquiára', quantidade: 85, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 17, kg: 425, consumo: 0.167 },
  { pasto: 'Da Pedra', quantidade: 82, tipo: 'Mineral Adensado Águas', periodo: 30, sacos: 15, kg: 375, consumo: 0.152 },
  { pasto: 'Tamboril', quantidade: 40, tipo: 'Ração Creep', periodo: 30, sacos: 27, kg: 675, consumo: 0.563 },
  { pasto: 'Boiada Gorda', quantidade: 94, tipo: 'Ração Creep', periodo: 30, sacos: 9, kg: 225, consumo: 0.08 },
  { pasto: 'Rio do Ouro de Cima', quantidade: 75, tipo: 'Ração Creep', periodo: 30, sacos: 75, kg: 1875, consumo: 0.833 },
  { pasto: 'Pasto do Braquiarão', quantidade: 56, tipo: 'Ração Creep', periodo: 30, sacos: 25, kg: 625, consumo: 0.372 },
  { pasto: 'João Jacinto de Cima', quantidade: 53, tipo: 'Ração Creep', periodo: 30, sacos: 20, kg: 500, consumo: 0.314 },
  { pasto: 'Tucuzão Braquiára', quantidade: 82, tipo: 'Ração Creep', periodo: 30, sacos: 20, kg: 500, consumo: 0.203 },
  { pasto: 'Da Pedra', quantidade: 80, tipo: 'Ração Creep', periodo: 30, sacos: 20, kg: 500, consumo: 0.208 },
  { pasto: 'Da Maternidade', quantidade: 39, tipo: 'Ração Creep', periodo: 30, sacos: 12, kg: 300, consumo: 0.256 },
  { pasto: 'Ponte Cima', quantidade: 45, tipo: 'Ração Creep', periodo: 30, sacos: 16, kg: 400, consumo: 0.296 },
];

export function loadData(): DataEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rows?: unknown[] };
    if (!parsed || !Array.isArray(parsed.rows)) return null;
    // Support legacy array-of-arrays format
    const rows = parsed.rows as (DataEntry | unknown[])[];
    return rows.map((r) => {
      if (Array.isArray(r)) {
        return {
          pasto: r[0] as string,
          quantidade: Number(r[1]),
          tipo: r[2] as string,
          periodo: Number(r[3]),
          sacos: Number(r[4]),
          kg: Number(r[5]),
          consumo: Number(r[6]),
        };
      }
      return r as DataEntry;
    });
  } catch {
    return null;
  }
}

export function saveData(entries: DataEntry[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rows: entries, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore quota errors
  }
}
