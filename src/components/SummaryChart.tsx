import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { fmt } from '../lib/utils';

interface SummaryChartProps {
  data: { name: string; value: number; color: string }[];
  title?: string;
  subtitle?: string;
}

export function SummaryChart({ data, title, subtitle }: SummaryChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm font-bold text-gray-500 text-center">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex items-start gap-8">
        {/* Left: legend */}
        <div className="space-y-4 min-w-[220px]">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 text-sm text-gray-700">{item.name}</div>
              <div className="font-bold tabular-nums" style={{ color: item.color }}>
                {fmt(item.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Right: bar chart */}
        <div className="flex-1 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 30, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tick={{ fill: '#333' }}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis
                tickFormatter={(v) => fmt(Number(v))}
                domain={[0, 'auto']}
                fontSize={11}
                tick={{ fill: '#999' }}
                axisLine={{ stroke: '#ccc' }}
              />
              <Tooltip
                formatter={(value) => [`${fmt(Number(value))} kg/cab dia`, 'Média']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={100}>
                {data.map((item, idx) => (
                  <Cell key={idx} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
