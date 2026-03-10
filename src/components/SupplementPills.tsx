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

// Cores fixas para o pódio (1º, 2º, 3º lugar por consumo médio)
const TOP3_COLORS = ['#1a6040', '#4ade80', '#2d8a60'] as const;
// 1 = verde escuro (brand), 2 = verde claro, 3 = verde médio

export function SupplementPills({ activeTypes, groups }: SupplementPillsProps) {
  if (activeTypes.length === 0) return null;

  const avgs    = activeTypes.map(t => averageConsumo(groups[t] ?? []));
  const maxAvg  = Math.max(...avgs, 0.001);

  // Top 3 by avg consumption — ordered by rank (0 = highest)
  const ranked = [...activeTypes]
    .map((t, i) => ({ tipo: t, avg: avgs[i] }))
    .sort((a, b) => b.avg - a.avg);
  const top3Map = new Map(ranked.slice(0, 3).map((r, rank) => [r.tipo, rank]));
  const top3 = new Set(top3Map.keys());

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
          const avg       = avgs[i];
          const fallback  = getSupplementColor(tipo, i);
          const rank      = top3Map.get(tipo); // 0 | 1 | 2 | undefined
          const isTop     = top3.has(tipo);
          const solidColor = rank !== undefined ? TOP3_COLORS[rank] : fallback;
          const stripeColor = fallback;
          const height    = MIN_H + Math.round((avg / maxAvg) * (MAX_H - MIN_H));
          const label     = abbreviate(tipo);

          return (
            <div
              key={tipo}
              className="flex flex-col items-center gap-2 group cursor-default"
              title={`${tipo} — ${fmt(avg)} kg/cab dia`}
            >
              {/* Value badge */}
              <span
                className={`text-[11px] font-bold tabular-nums transition-opacity duration-150 ${
                  isTop ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ color: solidColor }}
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
                    ? solidColor
                    : `repeating-linear-gradient(
                        45deg,
                        ${stripeColor}44 0px,
                        ${stripeColor}44 4px,
                        ${stripeColor}18 4px,
                        ${stripeColor}18 10px
                      )`,
                  border: `2px solid ${isTop ? solidColor : stripeColor}`,
                  boxShadow: isTop ? `0 4px 14px ${solidColor}55` : 'none',
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
