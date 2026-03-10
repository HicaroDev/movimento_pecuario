import type { DataEntry } from './data';
import { supplementOrder } from './data';

export { supplementOrder };

export function fmt(value: number, decimals = 3): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function fmtInt(value: number): string {
  return String(Math.round(value));
}

export function groupByType(entries: DataEntry[]): Record<string, DataEntry[]> {
  const groups: Record<string, DataEntry[]> = {};
  entries.forEach((entry) => {
    if (!groups[entry.tipo]) groups[entry.tipo] = [];
    groups[entry.tipo].push(entry);
  });
  return groups;
}

/* Retorna tipos únicos na ordem de supplementOrder, seguido de qualquer outro */
export function sortedTypes(groups: Record<string, DataEntry[]>): string[] {
  const inOrder = supplementOrder.filter(t => groups[t]?.length);
  const others  = Object.keys(groups).filter(t => !supplementOrder.includes(t) && groups[t].length);
  return [...inOrder, ...others];
}

export function averageConsumo(entries: DataEntry[]): number {
  if (!entries.length) return 0;
  const total = entries.reduce((acc, e) => acc + Number(e.consumo || 0), 0);
  return total / entries.length;
}

export function sumQuantidade(entries: DataEntry[]): number {
  return entries.reduce((acc, e) => acc + Number(e.quantidade || 0), 0);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
