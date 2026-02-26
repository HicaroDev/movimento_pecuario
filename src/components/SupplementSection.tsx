import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { DataEntry } from '../lib/data';
import { fmt, fmtInt, averageConsumo, sumQuantidade } from '../lib/utils';

interface SupplementSectionProps {
  tipo: string;
  color: string;
  entries: DataEntry[];
  periodo?: string;
}

const CHART_SCALES: Record<string, { max: number; step: number }> = {
  'Energético 0,3%':       { max: 1.5,  step: 0.25 },
  'Mineral Adensado Águas': { max: 0.2,  step: 0.05 },
  'Ração Creep':            { max: 1.0,  step: 0.25 },
};

export function SupplementSection({ tipo, color, entries, periodo = 'MARÇO 2025' }: SupplementSectionProps) {
  const avg      = averageConsumo(entries);
  const totalQtd = sumQuantidade(entries);

  const scale   = CHART_SCALES[tipo] ?? { max: 1.5, step: 0.25 };
  const dataMax = entries.reduce((m, e) => Math.max(m, e.consumo), 0);
  const chartMax = dataMax > scale.max ? Math.ceil(dataMax / scale.step + 1) * scale.step : scale.max;

  const chartData = entries.map((e) => ({ name: e.pasto, value: e.consumo }));

  const numTicks = Math.round(chartMax / scale.step);
  const yTicks: number[] = [];
  for (let i = 0; i <= numTicks; i++) {
    yTicks.push(+(scale.step * i).toFixed(6));
  }

  const chartHeight = Math.max(340, entries.length * 36 + 130);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden print-break">

      {/* ── Header: cor do suplemento ── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-sm font-bold tracking-wide">
          CONTROLE DE CONSUMO SUPLEMENTOS - FAZENDA MALHADA GRANDE 2025
        </span>
        <span className="text-white text-xs font-bold border border-white/40 px-2 py-0.5 rounded">
          MOVIMENTO PECUÁRIO
        </span>
      </div>

      <div className="p-6">

        {/* ── Título: escuro e centralizado ── */}
        <h2 className="text-center font-extrabold text-lg mb-6 uppercase tracking-wide text-gray-900">
          CONSUMO KG/CAB DIA - {tipo.toUpperCase()} ({periodo.toUpperCase()})
        </h2>

        {/* ── Tabela full-width ── */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th className="py-2 text-left font-bold">PASTO</th>
                <th className="py-2 text-right font-bold w-24">QUANTIDADE</th>
                <th className="py-2 text-left font-bold pl-4">TIPO DE SUPLEMENTO</th>
                <th className="py-2 text-right font-bold w-28">PERÍODO (DIAS)</th>
                <th className="py-2 text-right font-bold w-24">SACOS (25 KG)</th>
                <th className="py-2 text-right font-bold w-36">KG CONSUMIDOS NO PERÍODO</th>
                <th className="py-2 text-right font-bold w-32">CONSUMO (KG/CAB DIA)</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-gray-100 ${ri % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                >
                  <td className="py-2 pr-2 font-medium text-gray-800">{row.pasto}</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: '#3b82f6' }}>{fmtInt(row.quantidade)}</td>
                  <td className="py-2 pl-4 text-gray-400">{row.tipo}</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: '#3b82f6' }}>{fmtInt(row.periodo)}</td>
                  <td className="py-2 text-right tabular-nums" style={{ color: '#3b82f6' }}>{fmtInt(row.sacos)}</td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">{fmtInt(row.kg)}</td>
                  <td className="py-2 text-right font-bold text-gray-900 tabular-nums">{fmt(row.consumo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="flex justify-between items-center pt-3 pb-6 px-1 text-sm font-bold border-t-2 border-gray-300">
          <span className="text-gray-900">Total cabeças: {fmtInt(totalQtd)}</span>
          <span className="text-gray-900">
            Média consumo:{' '}
            <strong style={{ color }}>{fmt(avg)}</strong> kg/cab dia
          </span>
        </div>

        {/* ── Gráfico full-width abaixo ── */}
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 50, left: 10, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                interval={0}
                height={100}
                fontSize={11}
                tick={{ fill: '#555' }}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis
                tickFormatter={(v) => fmt(Number(v))}
                ticks={yTicks}
                domain={[0, chartMax]}
                fontSize={11}
                tick={{ fill: '#999' }}
                axisLine={{ stroke: '#ccc' }}
              />
              <Tooltip
                formatter={(value) => [`${fmt(Number(value))} kg/cab dia`, 'Consumo']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              {/* Linha de referência vermelha tracejada */}
              <ReferenceLine
                y={avg}
                stroke="#e53e3e"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{
                  value: `média ${fmt(avg)}`,
                  position: 'right',
                  fill: '#e53e3e',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
