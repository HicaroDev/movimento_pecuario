import { useMemo, useState } from 'react';
import { FileDown, ChevronDown, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { StatsOverview } from '../components/StatsOverview';
import { MetricCard } from '../components/MetricCard';
import { SummaryChart } from '../components/SummaryChart';
import { SupplementSection } from '../components/SupplementSection';
import { groupByType, averageConsumo, sumQuantidade, fmt } from '../lib/utils';
import { supplementOrder, supplementColors } from '../lib/data';

export function Relatorio() {
  const { entries } = useData();

  const [filterSupplement, setFilterSupplement] = useState('');
  const [filterPasto, setFilterPasto] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');

  const hasFilters = !!filterSupplement || !!filterPasto || !!filterPeriodo;

  const clearFilters = () => {
    setFilterSupplement('');
    setFilterPasto('');
    setFilterPeriodo('');
    toast.info('Filtros limpos');
  };

  /* ── Unique filter options ── */
  const pastoOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.pasto))).sort(),
    [entries]
  );
  const periodoOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => String(e.periodo)))).sort(),
    [entries]
  );

  /* ── Filtered entries ── */
  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (filterSupplement && e.tipo !== filterSupplement) return false;
        if (filterPasto && e.pasto !== filterPasto) return false;
        if (filterPeriodo && String(e.periodo) !== filterPeriodo) return false;
        return true;
      }),
    [entries, filterSupplement, filterPasto, filterPeriodo]
  );

  const groups = useMemo(() => groupByType(filtered), [filtered]);

  /* ── KPI stats ── */
  const totalEntries = filtered.length;
  const totalAnimals = sumQuantidade(filtered);
  const totalPastos = new Set(filtered.map((e) => e.pasto)).size;
  const avgConsumption = averageConsumo(filtered);

  /* ── Per-supplement averages for MetricCards ── */
  const energeticoAvg = averageConsumo(groups['Energético 0,3%'] ?? []);
  const mineralAvg = averageConsumo(groups['Mineral Adensado Águas'] ?? []);
  const creepAvg = averageConsumo(groups['Ração Creep'] ?? []);

  /* ── Summary chart data ── */
  const summaryData = supplementOrder.map((name) => ({
    name,
    value: averageConsumo(groups[name] ?? []),
    color: supplementColors[name] ?? '#0b6b45',
  }));

  const handleExportPDF = () => {
    toast.success('Exportando relatório...', { description: 'O PDF será gerado em breve' });
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 no-print-padding">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Relatório</h1>
            <p className="text-gray-600">Visão geral do consumo de suplementos</p>
          </motion.div>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg no-print"
          >
            Admin
          </motion.span>
        </div>

        {/* ── Filters card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 no-print"
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Suplemento */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Suplemento</label>
              <select
                value={filterSupplement}
                onChange={(e) => setFilterSupplement(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white text-sm pr-10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Todos</option>
                {supplementOrder.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Pasto */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pasto</label>
              <select
                value={filterPasto}
                onChange={(e) => setFilterPasto(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white text-sm pr-10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Todos</option>
                {pastoOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Período */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Período (dias)</label>
              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white text-sm pr-10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Todos</option>
                {periodoOptions.map((p) => (
                  <option key={p} value={p}>{p} dias</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Export button (4th column) */}
            <div className="flex items-end">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg font-medium"
              >
                <FileDown className="w-4 h-4" />
                Exportar PDF
              </button>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              Nenhum registro encontrado com os filtros selecionados
            </div>
          )}
        </motion.div>

        {/* ── 4 KPI cards ── */}
        <StatsOverview
          totalEntries={totalEntries}
          totalAnimals={totalAnimals}
          totalPastos={totalPastos}
          avgConsumption={avgConsumption}
        />

        {/* ── 3 metric cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon="energy"
            title="Energético 0,3%"
            value={fmt(energeticoAvg)}
            subtitle={`${groups['Energético 0,3%']?.length ?? 0} pastos`}
            color={supplementColors['Energético 0,3%']}
            trend={5.2}
          />
          <MetricCard
            icon="mineral"
            title="Mineral Adensado Águas"
            value={fmt(mineralAvg)}
            subtitle={`${groups['Mineral Adensado Águas']?.length ?? 0} pastos`}
            color={supplementColors['Mineral Adensado Águas']}
            trend={-2.1}
          />
          <MetricCard
            icon="feed"
            title="Ração Creep"
            value={fmt(creepAvg)}
            subtitle={`${groups['Ração Creep']?.length ?? 0} pastos`}
            color={supplementColors['Ração Creep']}
            trend={8.7}
          />
        </div>

        {/* ── Summary page (table + chart) ── */}
        {filtered.length > 0 && (
          <div className="mb-8">
            <SummaryChart
              data={summaryData}
              title="CONSUMO KG/CAB DIA — MÉDIAS CONSUMO"
              subtitle="FAZENDA MALHADA GRANDE — MAR/25"
            />
          </div>
        )}

        {/* ── Per-supplement sections ── */}
        <div className="space-y-8">
          {supplementOrder.map((tipo) => {
            const sectionEntries = groups[tipo] ?? [];
            if (sectionEntries.length === 0) return null;
            const color = supplementColors[tipo] ?? '#0b6b45';
            return (
              <SupplementSection
                key={tipo}
                tipo={tipo}
                color={color}
                entries={sectionEntries}
                periodo="MARÇO 2025"
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-16 text-center text-gray-500">
            <p className="text-lg font-medium">Sem dados para os filtros selecionados.</p>
            <p className="text-sm mt-2">Ajuste os filtros acima ou carregue dados no Formulário.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
