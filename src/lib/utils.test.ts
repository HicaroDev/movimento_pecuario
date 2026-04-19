import { describe, it, expect } from 'vitest';
import {
  fmt,
  fmtInt,
  groupByType,
  sortedTypes,
  averageConsumo,
  sumQuantidade,
  aggregateEntriesByPasto,
  cn,
} from './utils';
import type { DataEntry } from './data';

// ─── helpers ────────────────────────────────────────────────────────────────

function entry(overrides: Partial<DataEntry>): DataEntry {
  return {
    pasto: 'P1',
    quantidade: 100,
    tipo: 'Sal Mineral Águas',
    periodo: 30,
    sacos: 4,
    kg: 100,
    consumo: 0.033,
    ...overrides,
  };
}

// ─── fmt ────────────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('formata com 3 casas por padrão', () => {
    expect(fmt(1.5)).toBe('1,500');
  });

  it('formata com casas customizadas', () => {
    expect(fmt(3.14159, 2)).toBe('3,14');
  });

  it('usa vírgula como separador decimal', () => {
    expect(fmt(0.1)).not.toContain('.');
  });

  it('zero', () => {
    expect(fmt(0)).toBe('0,000');
  });
});

// ─── fmtInt ─────────────────────────────────────────────────────────────────

describe('fmtInt', () => {
  it('arredonda para inteiro', () => {
    expect(fmtInt(3.7)).toBe('4');
    expect(fmtInt(3.2)).toBe('3');
  });

  it('zero', () => {
    expect(fmtInt(0)).toBe('0');
  });
});

// ─── groupByType ─────────────────────────────────────────────────────────────

describe('groupByType', () => {
  it('agrupa entradas pelo tipo', () => {
    const entries = [
      entry({ tipo: 'A' }),
      entry({ tipo: 'B' }),
      entry({ tipo: 'A' }),
    ];
    const groups = groupByType(entries);
    expect(Object.keys(groups)).toHaveLength(2);
    expect(groups['A']).toHaveLength(2);
    expect(groups['B']).toHaveLength(1);
  });

  it('lista vazia retorna objeto vazio', () => {
    expect(groupByType([])).toEqual({});
  });
});

// ─── sortedTypes ─────────────────────────────────────────────────────────────

describe('sortedTypes', () => {
  it('tipos conhecidos aparecem na ordem definida em supplementOrder', () => {
    const groups = {
      'Sal Mineral Águas': [entry({ tipo: 'Sal Mineral Águas' })],
      'Energetico 0,3%':  [entry({ tipo: 'Energetico 0,3%' })],
    };
    const sorted = sortedTypes(groups);
    expect(sorted.indexOf('Energetico 0,3%')).toBeLessThan(sorted.indexOf('Sal Mineral Águas'));
  });

  it('tipos desconhecidos aparecem no final', () => {
    const groups = {
      'Desconhecido': [entry({ tipo: 'Desconhecido' })],
      'Energetico 0,3%': [entry({ tipo: 'Energetico 0,3%' })],
    };
    const sorted = sortedTypes(groups);
    expect(sorted[sorted.length - 1]).toBe('Desconhecido');
  });
});

// ─── averageConsumo ──────────────────────────────────────────────────────────

describe('averageConsumo', () => {
  it('lista vazia retorna 0', () => {
    expect(averageConsumo([])).toBe(0);
  });

  it('média ponderada pelo número de cabeças', () => {
    const entries = [
      entry({ quantidade: 100, consumo: 0.030 }),
      entry({ quantidade: 200, consumo: 0.060 }),
    ];
    // (100×0.03 + 200×0.06) / 300 = 15 / 300 = 0.05
    expect(averageConsumo(entries)).toBeCloseTo(0.05, 5);
  });

  it('zero cabeças retorna 0', () => {
    const entries = [entry({ quantidade: 0, consumo: 0.5 })];
    expect(averageConsumo(entries)).toBe(0);
  });
});

// ─── sumQuantidade ───────────────────────────────────────────────────────────

describe('sumQuantidade', () => {
  it('soma quantidade de todas as entradas', () => {
    const entries = [entry({ quantidade: 50 }), entry({ quantidade: 150 })];
    expect(sumQuantidade(entries)).toBe(200);
  });

  it('lista vazia retorna 0', () => {
    expect(sumQuantidade([])).toBe(0);
  });
});

// ─── aggregateEntriesByPasto ─────────────────────────────────────────────────

describe('aggregateEntriesByPasto', () => {
  it('agrega múltiplas entradas do mesmo pasto', () => {
    const entries = [
      entry({ pasto: 'P1', kg: 100, sacos: 4, quantidade: 100, data: '2025-01-01' }),
      entry({ pasto: 'P1', kg: 200, sacos: 8, quantidade: 120, data: '2025-01-31' }),
    ];
    const result = aggregateEntriesByPasto(entries);
    expect(result).toHaveLength(1);
    expect(result[0].kg).toBe(300);
    expect(result[0].sacos).toBe(12);
  });

  it('dois pastos distintos geram dois registros', () => {
    const entries = [
      entry({ pasto: 'P1' }),
      entry({ pasto: 'P2' }),
    ];
    expect(aggregateEntriesByPasto(entries)).toHaveLength(2);
  });

  it('consumo calculado é maior que zero quando há kg e cabeças', () => {
    const entries = [
      entry({ pasto: 'P1', kg: 120, quantidade: 100, data: '2025-01-01', periodo: 30 }),
      entry({ pasto: 'P1', kg: 120, quantidade: 100, data: '2025-01-31', periodo: 30 }),
    ];
    const result = aggregateEntriesByPasto(entries);
    expect(result[0].consumo).toBeGreaterThan(0);
  });
});

// ─── cn ─────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('junta classes válidas com espaço', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('string vazia', () => {
    expect(cn()).toBe('');
  });
});
