import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, ChevronDown, Filter, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatsOverview } from '../components/StatsOverview';
import { MetricCard } from '../components/MetricCard';
import { SummaryChart } from '../components/SummaryChart';
import { SupplementSection } from '../components/SupplementSection';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { groupByType, averageConsumo, sumQuantidade, sortedTypes, fmt } from '../lib/utils';
import { getSupplementColor } from '../lib/data';

const MONTH_SHORT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MONTH_FULL  = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
}

function periodFull(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_FULL[m - 1]} ${y}`;
}

export function Relatorio() {
  const { entries, loading, clientInfo } = useData();
  const { user, isAdmin } = useAuth();

  const [filterSupplement, setFilterSupplement] = useState('');
  const [filterPasto,      setFilterPasto]      = useState('');
  const [filterPeriodo,    setFilterPeriodo]    = useState('');
  const [filterMonth,      setFilterMonth]      = useState('');

  const hasFilters = !!filterSupplement || !!filterPasto || !!filterPeriodo || !!filterMonth;

  const clearFilters = () => {
    setFilterSupplement(''); setFilterPasto('');
    setFilterPeriodo('');    setFilterMonth('');
    toast.info('Filtros limpos');
  };

  /* ── Month chips derived from entries ── */
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.data) set.add(e.data.slice(0, 7)); // YYYY-MM
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a)); // newest first
  }, [entries]);

  /* ── Unique filter options ── */
  const supplementOptions = useMemo(
    () => sortedTypes(groupByType(entries)),
    [entries]
  );
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
        if (filterPasto      && e.pasto !== filterPasto)     return false;
        if (filterPeriodo    && String(e.periodo) !== filterPeriodo) return false;
        if (filterMonth      && (!e.data || !e.data.startsWith(filterMonth))) return false;
        return true;
      }),
    [entries, filterSupplement, filterPasto, filterPeriodo, filterMonth]
  );

  const groups = useMemo(() => groupByType(filtered), [filtered]);

  /* ── KPI stats ── */
  const totalEntries   = filtered.length;
  const totalAnimals   = sumQuantidade(filtered);
  const totalPastos    = new Set(filtered.map((e) => e.pasto)).size;
  const avgConsumption = averageConsumo(filtered);

  /* ── Ordered supplement types (only those with data) ── */
  const activeTypes = useMemo(() => sortedTypes(groups), [groups]);

  /* ── Top-3 MetricCards (first 3 supplements with data) ── */
  const metricTypes = activeTypes.slice(0, 3);

  /* ── Summary chart data (only supplements with data) ── */
  const summaryData = useMemo(() => activeTypes.map((name, i) => ({
    name,
    value: averageConsumo(groups[name] ?? []),
    color: getSupplementColor(name, i),
  })), [activeTypes, groups]);

  /* ── Dynamic subtitle (farm + month) ── */
  const farmName   = clientInfo?.nomeFazenda ?? '';
  const periodoStr = filterMonth ? periodFull(filterMonth) : '';
  const subtitle   = [farmName, periodoStr].filter(Boolean).join(' — ');

  /* ── Actions ── */
  const handleExportPDF = () => {
    toast.success('Exportando relatório...', { description: 'O PDF será gerado em breve' });
    window.print();
  };

  const handleExportExcel = () => {
    const rows = filtered.map((e) => ({
      DATA:                   e.data ?? '',
      PASTO:                  e.pasto,
      QUANTIDADE:             e.quantidade,
      'TIPO DE SUPLEMENTO':   e.tipo,
      'PERÍODO (dias)':       e.periodo,
      'SACOS (25 kg)':        e.sacos,
      'KG CONSUMIDOS':        e.kg,
      'CONSUMO (kg/cab dia)': Number(e.consumo.toFixed(3)),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
    const tag = farmName.replace(/\s+/g, '_') || 'relatorio';
    XLSX.writeFile(wb, `relatorio_${tag}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel exportado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 no-print-padding">
      <div>
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
            {isAdmin ? 'Admin' : user?.name ?? 'Cliente'}
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

          {/* Month chips */}
          {monthOptions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Período</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {monthOptions.map((ym) => (
                  <button
                    key={ym}
                    onClick={() => setFilterMonth(filterMonth === ym ? '' : ym)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                      filterMonth === ym
                        ? 'bg-gray-900 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                    }`}
                  >
                    {monthLabel(ym)}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                {supplementOptions.map((s) => (
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

            {/* Export buttons (4th column) */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleExportExcel}
                disabled={filtered.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg font-medium text-sm"
              >
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {filtered.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              Nenhum registro encontrado com os filtros selecionados
            </div>
          )}
        </motion.div>

        {/* ── 4 KPI cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <StatsOverview
            totalEntries={totalEntries}
            totalAnimals={totalAnimals}
            totalPastos={totalPastos}
            avgConsumption={avgConsumption}
          />
        )}

        {/* ── 3 metric cards (top 3 supplements with data) ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : metricTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {metricTypes.map((tipo, i) => {
              const typeEntries = groups[tipo] ?? [];
              const avg = averageConsumo(typeEntries);
              const color = getSupplementColor(tipo, i);
              const icons = ['energy', 'mineral', 'feed'] as const;
              return (
                <MetricCard
                  key={tipo}
                  icon={icons[i % icons.length]}
                  title={tipo}
                  value={fmt(avg)}
                  subtitle={`${typeEntries.length} pasto${typeEntries.length !== 1 ? 's' : ''}`}
                  color={color}
                  trend={undefined}
                />
              );
            })}
          </div>
        )}

        {/* ── Summary chart ── */}
        {loading ? (
          <div className="mb-8"><SkeletonChart /></div>
        ) : filtered.length > 0 && (
          <div className="mb-8">
            <SummaryChart
              data={summaryData}
              title="CONSUMO KG/CAB DIA — MÉDIAS CONSUMO"
              subtitle={subtitle.toUpperCase() || undefined}
            />
          </div>
        )}

        {/* ── Per-supplement sections ── */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <>
            <div className="space-y-8">
              {activeTypes.map((tipo, i) => {
                const sectionEntries = groups[tipo] ?? [];
                const color = getSupplementColor(tipo, i);
                return (
                  <SupplementSection
                    key={tipo}
                    tipo={tipo}
                    color={color}
                    entries={sectionEntries}
                    periodo={periodoStr.toUpperCase() || 'TODOS OS PERÍODOS'}
                    farmName={farmName}
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
          </>
        )}
      </div>
    </div>
  );
}
