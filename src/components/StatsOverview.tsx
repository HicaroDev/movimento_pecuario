import { motion } from 'motion/react';
import { Package, TrendingUp, MapPin, Calendar } from 'lucide-react';

interface StatsOverviewProps {
  totalEntries: number;
  totalAnimals: number;
  totalPastos: number;
  avgConsumption: number;
}

export function StatsOverview({
  totalEntries,
  totalAnimals,
  totalPastos,
  avgConsumption,
}: StatsOverviewProps) {
  const stats = [
    {
      icon: Package,
      label: 'Total de Registros',
      value: String(totalEntries),
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      label: 'Total de Cabeças',
      value: String(totalAnimals),
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: MapPin,
      label: 'Total de Pastos',
      value: String(totalPastos),
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: Calendar,
      label: 'Consumo Médio Total',
      value: avgConsumption.toFixed(3).replace('.', ','),
      suffix: ' kg',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  {'suffix' in stat ? stat.suffix : ''}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
