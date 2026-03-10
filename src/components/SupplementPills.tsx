import type { DataEntry } from '../lib/data';
import { getSupplementColor } from '../lib/data';
import { averageConsumo, fmt } from '../lib/utils';

interface SupplementPillsProps {
  activeTypes: string[];
  groups: Record<string, DataEntry[]>;
}

function abbreviate(nome: string): string {
  // Short abbreviations for known names, fallback to first two words
  const map: Record<string, string> = {
    'Energetico 0,3%':             'En. 0,3%',
    'Energetico 0,5%':             'En. 0,5%',
    'Mineral Adensado Aguas':      'Min. Águas',
    'Mineral Adensado Seca':       'Min. Seca',
    'Mineral Adensado Transicao':  'Min. Trans.',
    'Proteico 0,1% Aguas':         'Prot. 0,1% Á',
    'Proteico 0,1% Seca':          'Prot. 0,1% S',
    'Proteico 0,1% Transicao':     'Prot. 0,1% T',
    'Proteico 0,2%':               'Prot. 0,2%',
    'Racao Creep':                 'Creep',
    'Ração Engorda TIP':           'Eng. TIP',
    'Sal Mieneral Reprodução':     'Sal Reprod.',
    'Sal Mineral Águas':           'Sal Águas',
    'Sal Mineral Águas Aditivado': 'Sal Aditivado',
    'Sal Mineral com Ureia':       'Sal Ureia',
  };
  return map[nome] ?? nome.split(' ').slice(0, 2).join(' ');
}

export function SupplementPills({ activeTypes, groups }: SupplementPillsProps) {
  if (activeTypes.length === 0) return null;

  const avgs    = activeTypes.map(t => averageConsumo(groups[t] ?? []));
  const maxAvg  = Math.max(...avgs, 0.001);

  // Top 3 by avg consumption
  const ranked = [...activeTypes]
    .map((t, i) => ({ tipo: t, avg: avgs[i] }))
    .sort((a, b) => b.avg - a.avg);
  const top3 = new Set(ranked.slice(0, 3).map(r => r.tipo));

  const MIN_H = 48;
  const MAX_H = 110;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 no-print">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-semibold text-gray-700">Suplementos em uso</span>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          {activeTypes.length} tipo{activeTypes.length !== 1 ? 's' : ''} • top 3 destacados
        </span>
      </div>

      <div className="flex items-end justify-center gap-4 flex-wrap">
        {activeTypes.map((tipo, i) => {
          const avg    = avgs[i];
          const color  = getSupplementColor(tipo, i);
          const isTop  = top3.has(tipo);
          const height = MIN_H + Math.round((avg / maxAvg) * (MAX_H - MIN_H));
          const label  = abbreviate(tipo);

          return (
            <div
              key={tipo}
              className="flex flex-col items-center gap-2 group cursor-default"
              title={`${tipo} — ${fmt(avg)} kg/cab dia`}
            >
              {/* Value badge (visible on hover or always for top3) */}
              <span
                className={`text-[11px] font-bold tabular-nums transition-opacity duration-150 ${
                  isTop
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ color }}
              >
                {fmt(avg)}
              </span>

              {/* Pill */}
              <div
                style={{
                  width: 44,
                  height,
                  borderRadius: 9999,
                  background: isTop
                    ? color
                    : `repeating-linear-gradient(
                        45deg,
                        ${color}44 0px,
                        ${color}44 4px,
                        ${color}18 4px,
                        ${color}18 10px
                      )`,
                  border: `2px solid ${color}`,
                  boxShadow: isTop ? `0 4px 14px ${color}55` : 'none',
                  transition: 'all 0.2s ease',
                }}
                className="group-hover:scale-105"
              />

              {/* Label */}
              <span
                className={`text-[10px] text-center leading-tight max-w-[56px] font-medium transition-colors ${
                  isTop ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
