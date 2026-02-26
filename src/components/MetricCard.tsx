import { TrendingUp, Droplet, Beef } from 'lucide-react';
import { motion } from 'motion/react';

type IconType = 'energy' | 'mineral' | 'feed';

interface MetricCardProps {
  icon: IconType;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  trend?: number;
}

const icons: Record<IconType, typeof TrendingUp> = {
  energy: TrendingUp,
  mineral: Droplet,
  feed: Beef,
};

export function MetricCard({ icon, title, value, subtitle, color, trend }: MetricCardProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${color}20` }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">{title}</div>
          <div className="text-4xl font-bold mb-1" style={{ color }}>
            {value}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{subtitle}</div>
            {trend !== undefined && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
