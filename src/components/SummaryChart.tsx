import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { motion } from 'motion/react';
import { BarChart2 } from 'lucide-react';
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
      className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(26,96,64,0.10)' }}
          >
            <BarChart2 className="w-4 h-4" style={{ color: '#1a6040' }} />
          </div>
          <div>
            {title && <h2 className="text-sm font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{ background: 'rgba(26,96,64,0.08)', color: '#1a6040' }}
        >
          KG / CAB / DIA
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Left: legend */}
          <div className="flex flex-row flex-wrap md:flex-col gap-3 md:gap-4 md:min-w-[200px]">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-xs text-gray-600 flex-1 leading-tight">{item.name}</div>
                <div className="text-xs font-extrabold tabular-nums ml-1" style={{ color: item.color }}>
                  {fmt(item.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Right: bar chart */}
          <div className="flex-1 w-full" style={{ height: Math.max(260, data.length * 56 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tick={{ fill: '#555' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={v => fmt(Number(v))}
                  domain={[0, 'auto']}
                  fontSize={10}
                  tick={{ fill: '#bbb' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={value => [`${fmt(Number(value))} kg/cab dia`, 'Média']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    fontSize: 12,
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {data.map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: number) => fmt(v)}
                    style={{ fontSize: 10, fill: '#555', fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
