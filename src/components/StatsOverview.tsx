import { motion } from 'motion/react';
import { Package, Beef, MapPin, Activity } from 'lucide-react';
import { fmt } from '../lib/utils';

interface StatsOverviewProps {
  totalEntries: number;
  totalAnimals: number;
  totalPastos: number;
  avgConsumption: number;
}

const CARDS = [
  {
    icon: Package,
    label: 'Registros',
    sublabel: 'lançamentos no período',
    accent: '#1a6040',
    bg: 'rgba(26,96,64,0.06)',
    iconBg: 'rgba(26,96,64,0.10)',
    iconColor: '#1a6040',
  },
  {
    icon: Beef,
    label: 'Cabeças',
    sublabel: 'animais monitorados',
    accent: '#0b4d2e',
    bg: 'rgba(11,77,46,0.05)',
    iconBg: 'rgba(11,77,46,0.10)',
    iconColor: '#0b4d2e',
  },
  {
    icon: MapPin,
    label: 'Pastos',
    sublabel: 'unidades de manejo',
    accent: '#1d5c8a',
    bg: 'rgba(29,92,138,0.05)',
    iconBg: 'rgba(29,92,138,0.10)',
    iconColor: '#1d5c8a',
  },
  {
    icon: Activity,
    label: 'Consumo Médio',
    sublabel: 'kg / cab / dia',
    accent: '#92400e',
    bg: 'rgba(146,64,14,0.05)',
    iconBg: 'rgba(146,64,14,0.10)',
    iconColor: '#b45309',
    isConsumption: true,
  },
] as const;

export function StatsOverview({ totalEntries, totalAnimals, totalPastos, avgConsumption }: StatsOverviewProps) {
  const values = [
    String(totalEntries),
    totalAnimals > 0 ? String(totalAnimals) : '—',
    String(totalPastos),
    avgConsumption > 0 ? fmt(avgConsumption) : '—',
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gray-200/80 p-5 relative overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {/* Accent bar esquerda */}
            <div
              className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
              style={{ backgroundColor: card.accent }}
            />

            <div className="flex items-start justify-between mb-3 pl-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{card.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{values[i]}</p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: card.iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 pl-3">{card.sublabel}</p>

            {/* BG subtle pattern */}
            <div
              className="absolute right-0 bottom-0 w-16 h-16 rounded-tl-full opacity-40 pointer-events-none"
              style={{ backgroundColor: card.bg }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
