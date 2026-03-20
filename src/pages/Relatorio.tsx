import { useMemo, useState, useEffect } from 'react';
import { FileDown, ChevronDown, Filter, CalendarDays, TrendingUp, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../lib/supabase';
import { StatsOverview } from '../components/StatsOverview';
import { SummaryChart } from '../components/SummaryChart';
import { SupplementSection } from '../components/SupplementSection';
import { SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { SupplementPills } from '../components/SupplementPills';
import { manejoService, type Animal } from '../services/manejoService';
import { groupByType, averageConsumo, sortedTypes, aggregateEntriesByPasto } from '../lib/utils';
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

interface SuppType {
  nome: string;
  consumo?: string | number | null;
  valor_kg?: number | null;
}

export function Relatorio() {
  const { entries, loading, clientInfo, pastures, activeFarmId } = useData();
  const { user, isAdmin } = useAuth();
  const farmId = activeFarmId || user?.farmId || '';

  const [filterSupplement, setFilterSupplement] = useState('');
  const [filterPasto,      setFilterPasto]      = useState('');
  const [filterLote,       setFilterLote]       = useState('');
  const [filterMonths,     setFilterMonths]     = useState<string[]>([]);
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');

  // Animals + supplement_types para meta/desembolso/lote
  const [animals,    setAnimals]    = useState<Animal[]>([]);
  const [suppTypes,  setSuppTypes]  = useState<SuppType[]>([]);
  const [evolucaoHistorico, setEvolucaoHistorico] = useState<Array<{animal_id: string; created_at: string; peso_medio: number}>>([]);

  useEffect(() => {
    if (!farmId) return;
    manejoService.listarAnimais(farmId).then(setAnimals).catch(() => {});
    supabaseAdmin.from('supplement_types').select('nome, consumo, valor_kg').eq('farm_id', farmId)
      .then(({ data }) => setSuppTypes((data ?? []) as SuppType[])).catch(() => {});
    supabaseAdmin.from('manejo_historico')
      .select('animal_id, created_at, peso_medio')
      .eq('farm_id', farmId)
      .eq('tipo', 'evolucao_categoria')
      .not('peso_medio', 'is', null)
      .then(({ data }) => setEvolucaoHistorico((data ?? []) as Array<{animal_id: string; created_at: string; peso_medio: number}>))
      .catch(() => {});
  }, [farmId]);

  const hasFilters = !!filterSupplement || !!filterPasto || !!filterLote || filterMonths.length > 0 || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setFilterSupplement('');
    setFilterPasto('');
    setFilterLote('');
    setFilterMonths([]);
    setDateFrom('');
    setDateTo('');
    toast.info('Filtros limpos');
  };

  function toggleMonth(ym: string) {
    setFilterMonths(prev =>
      prev.includes(ym) ? prev.filter(m => m !== ym) : [...prev, ym]
    );
  }

  /* ── Month chips derived from entries ── */
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      if (e.data) set.add(e.data.slice(0, 7)); // YYYY-MM
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a)); // newest first
  }, [entries]);

  /* ── Mapa pastoId → nome ── */
  const pastoIdToNome = useMemo(
    () => Object.fromEntries(pastures.map(p => [p.id, p.nome])),
    [pastures]
  );

  /* ── Mapa pastoNome → [lote names] ── */
  const pastoLotesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of animals) {
      if (!a.pasto_id || (a.status !== 'ativo' && a.status)) continue;
      const nome = pastoIdToNome[a.pasto_id];
      if (!nome) continue;
      if (!map[nome]) map[nome] = [];
      map[nome].push(a.nome);
    }
    return map;
  }, [animals, pastoIdToNome]);

  /* ── Mapa pastoNome → peso médio ponderado ── */
  const pastoNomePesoMap = useMemo(() => {
    const map: Record<string, { peso: number; qtd: number }> = {};
    for (const a of animals) {
      if (!a.pasto_id || !a.peso_medio) continue;
      const nome = pastoIdToNome[a.pasto_id];
      if (!nome) continue;
      if (!map[nome]) map[nome] = { peso: 0, qtd: 0 };
      map[nome].peso += a.quantidade * a.peso_medio;
      map[nome].qtd  += a.quantidade;
    }
    const result: Record<string, number | null> = {};
    for (const [nome, { peso, qtd }] of Object.entries(map)) {
      result[nome] = qtd > 0 ? peso / qtd : null;
    }
    return result;
  }, [animals, pastoIdToNome]);

  /* ── Histórico de evoluções por animal (ordenado por data) ── */
  const evolucaoByAnimal = useMemo(() => {
    const map: Record<string, Array<{ date: string; peso: number }>> = {};
    for (const h of evolucaoHistorico) {
      if (!map[h.animal_id]) map[h.animal_id] = [];
      map[h.animal_id].push({ date: h.created_at.slice(0, 10), peso: h.peso_medio });
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
  }, [evolucaoHistorico]);

  /* ── Mapa pastoNome → [animals] (para cálculo histórico de peso) ── */
  const pastoAnimaisMap = useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const a of animals) {
      if (!a.pasto_id) continue;
      const nome = pastoIdToNome[a.pasto_id];
      if (!nome) continue;
      if (!map[nome]) map[nome] = [];
      map[nome].push(a);
    }
    return map;
  }, [animals, pastoIdToNome]);

  /* ── Mapa suppNome → { consumo_pct, valor_kg } ── */
  const suppTypeMap = useMemo(() => {
    const map: Record<string, { consumoPct: number | null; valorKg: number | null }> = {};
    for (const s of suppTypes) {
      let consumoPct: number | null = null;
      if (s.consumo != null && s.consumo !== '') {
        const v = parseFloat(String(s.consumo).replace('%', '').replace(',', '.'));
        if (!isNaN(v)) consumoPct = v;
      }
      map[s.nome.toUpperCase()] = { consumoPct, valorKg: typeof s.valor_kg === 'number' ? s.valor_kg : null };
    }
    return map;
  }, [suppTypes]);

  /* ── Lote options ── */
  const loteOptions = useMemo(() => {
    const all = animals.filter(a => a.status === 'ativo' || !a.status).map(a => a.nome);
    return Array.from(new Set(all)).sort();
  }, [animals]);

  /* ── Unique filter options ── */
  const supplementOptions = useMemo(
    () => sortedTypes(groupByType(entries)),
    [entries]
  );
  const pastoOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.pasto))).sort(),
    [entries]
  );

  /* ── Filtered entries ── */
  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (filterSupplement && e.tipo !== filterSupplement) return false;
        if (filterPasto      && e.pasto !== filterPasto)     return false;
        if (filterLote && !pastoLotesMap[e.pasto]?.includes(filterLote)) return false;
        if (filterMonths.length > 0 && (!e.data || !filterMonths.some(m => e.data!.startsWith(m)))) return false;
        if (dateFrom && e.data && e.data < dateFrom) return false;
        if (dateTo   && e.data && e.data > dateTo)   return false;
        return true;
      }),
    [entries, filterSupplement, filterPasto, filterLote, filterMonths, dateFrom, dateTo, pastoLotesMap]
  );

  const groups = useMemo(() => groupByType(filtered), [filtered]);

  /* ── Aggregated groups: 1 linha por pasto, consumo calculado por datas reais ── */
  const aggregatedGroups = useMemo(() => {
    const result: Record<string, ReturnType<typeof aggregateEntriesByPasto>> = {};
    for (const [tipo, typeEntries] of Object.entries(groups)) {
      result[tipo] = aggregateEntriesByPasto(typeEntries);
    }
    return result;
  }, [groups]);

  /* ── Peso histórico ponderado de um pasto em uma data específica ── */
  function getPesoHistorico(pastoNome: string, date: string | undefined): number | null {
    const animaisPasto = pastoAnimaisMap[pastoNome] ?? [];
    if (animaisPasto.length === 0) return pastoNomePesoMap[pastoNome] ?? null;
    let pesoTotal = 0;
    let qtdTotal  = 0;
    for (const a of animaisPasto) {
      const history = evolucaoByAnimal[a.id] ?? [];
      let pesoAnimal: number | null = null;
      if (date && history.length > 0) {
        const antes = history.filter(h => h.date <= date);
        if (antes.length > 0) pesoAnimal = antes[antes.length - 1].peso;
      }
      if (pesoAnimal === null) pesoAnimal = a.peso_medio ?? null;
      if (pesoAnimal !== null) {
        pesoTotal += a.quantidade * pesoAnimal;
        qtdTotal  += a.quantidade;
      }
    }
    return qtdTotal > 0 ? pesoTotal / qtdTotal : null;
  }

  /* ── Aggregated groups enriquecidos com meta, desembolso, lote ── */
  const aggregatedGroupsWithMeta = useMemo(() => {
    const result: Record<string, ReturnType<typeof aggregateEntriesByPasto>> = {};
    for (const [tipo, typeEntries] of Object.entries(aggregatedGroups)) {
      const suppInfo   = suppTypeMap[tipo.toUpperCase()];
      const consumoPct = suppInfo?.consumoPct ?? null;
      const valorKg    = suppInfo?.valorKg    ?? null;

      result[tipo] = typeEntries.map(e => {
        const pesoPasto = getPesoHistorico(e.pasto, e.data);
        const meta = pesoPasto != null && consumoPct != null && consumoPct > 0
          ? pesoPasto * (consumoPct / 100)
          : undefined;
        const desembolso = valorKg != null && e.consumo > 0
          ? e.consumo * valorKg
          : undefined;
        const lote = (pastoLotesMap[e.pasto] ?? []).join(', ') || undefined;
        return { ...e, meta, desembolso, lote };
      });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregatedGroups, suppTypeMap, pastoLotesMap, pastoAnimaisMap, evolucaoByAnimal, pastoNomePesoMap]);

  /* ── KPI stats ── */
  const totalEntries  = filtered.length;
  const totalPastos   = new Set(filtered.map((e) => e.pasto)).size;
  const allAggregated = useMemo(() => Object.values(aggregatedGroupsWithMeta).flat(), [aggregatedGroupsWithMeta]);
  const avgConsumption = averageConsumo(allAggregated);

  /* ── Total cabeças: max por pasto (sem duplicidade) ── */
  const totalAnimals = useMemo(() => {
    const pastoMax = new Map<string, number>();
    for (const e of allAggregated) {
      pastoMax.set(e.pasto, Math.max(pastoMax.get(e.pasto) ?? 0, e.quantidade));
    }
    return Array.from(pastoMax.values()).reduce((sum, q) => sum + q, 0);
  }, [allAggregated]);

  /* ── Ordered supplement types (only those with data) ── */
  const activeTypes = useMemo(() => sortedTypes(groups), [groups]);

  /* ── Summary chart data (only supplements with data) ── */
  const summaryData = useMemo(() => activeTypes.map((name, i) => ({
    name: name.toUpperCase(),
    value: averageConsumo(aggregatedGroupsWithMeta[name] ?? []),
    color: getSupplementColor(name, i),
  })), [activeTypes, aggregatedGroupsWithMeta]);

  /* ── Dynamic subtitle (farm + selected months) ── */
  const farmName   = clientInfo?.nomeFazenda ?? '';
  const periodoStr = filterMonths.length > 0
    ? filterMonths.slice().sort().map(periodFull).join(' · ')
    : dateFrom || dateTo
    ? [dateFrom, dateTo].filter(Boolean).join(' a ')
    : '';
  const subtitle   = [farmName, periodoStr].filter(Boolean).join(' — ');

  /* ── Dados do gráfico de linha por lote ── */
  const loteLineData = useMemo(() => {
    if (!filterLote || filtered.length === 0) return null;
    const animal  = animals.find(a => a.nome === filterLote);
    const pesoVivo = animal?.peso_medio ?? null;

    const sorted  = [...filtered].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));
    const tiposUnicos = Array.from(new Set(sorted.map(e => e.tipo.toUpperCase())));

    const byDate: Record<string, Record<string, number | string>> = {};
    for (const e of sorted) {
      if (!e.data) continue;
      const label = e.data.split('-').reverse().join('/');
      if (!byDate[e.data]) byDate[e.data] = { data: label };
      const tipoUp = e.tipo.toUpperCase();
      byDate[e.data][tipoUp] = Number(e.consumo.toFixed(3));
      if (pesoVivo && pesoVivo > 0) {
        byDate[e.data][`${tipoUp}_PV`] = Number(((e.consumo / pesoVivo) * 100).toFixed(3));
      }
    }
    const points = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, vals]) => vals);

    return { points, tiposUnicos, pesoVivo };
  }, [filterLote, filtered, animals]);

  /* ── Ficha de consumo PDF pré-preenchida ── */
  const handleFichaPDF = () => {
    if (!filterLote) return;
    const animal    = animals.find(a => a.nome === filterLote);
    const pasto     = animal ? (pastoIdToNome[animal.pasto_id ?? ''] ?? '—') : '—';
    const qtd       = animal?.quantidade ?? 0;
    const peso      = animal?.peso_medio ?? null;
    const sorted    = [...filtered].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''));
    const suplemento = sorted[0]?.tipo?.toUpperCase() ?? '—';
    const dataHoje  = new Date().toLocaleDateString('pt-BR');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Ficha de Consumo — ${filterLote}</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  body { font-family: Arial, sans-serif; color: #111; }
  h1 { font-size: 18px; color: #1a6040; margin-bottom: 4px; }
  .sub { font-size: 12px; color: #666; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #1a6040; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .linha { height: 32px; border-bottom: 1px solid #d1d5db; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 24px; }
  .field { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; }
  .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head><body>
<h1>Ficha de Consumo de Suplemento</h1>
<p class="sub">Fazenda ${farmName} · Gerado em ${dataHoje}</p>
<table>
  <tr><th>Campo</th><th>Dado</th></tr>
  <tr><td>Fazenda</td><td>${farmName}</td></tr>
  <tr><td>Pasto</td><td>${pasto}</td></tr>
  <tr><td>Lote</td><td>${filterLote}</td></tr>
  <tr><td>Quantidade de animais</td><td>${qtd} cabeças</td></tr>
  ${peso ? `<tr><td>Peso médio</td><td>${peso} kg</td></tr>` : ''}
  <tr><td>Suplemento atual</td><td>${suplemento}</td></tr>
</table>
<p style="font-size:13px;font-weight:600;margin-bottom:8px;">Registros de campo:</p>
<table>
  <tr>
    <th>Data</th><th>Produto</th><th>Sacos (25kg)</th><th>KG total</th><th>Vaqueiro</th>
  </tr>
  ${Array.from({ length: 8 }).map(() => `<tr class="linha"><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
</table>
<p class="footer">Suplemento Control · HicaroDev · ${dataHoje}</p>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  /* ── Actions ── */
  const handleExportPDF = () => {
    // Inject portrait page rule for this print
    const style = document.createElement('style');
    style.id = 'relatorio-print-portrait';
    style.textContent = `@page { size: A4 portrait; margin: 14mm; }`;
    document.head.appendChild(style);
    toast.success('Exportando relatório...', { description: 'O PDF será gerado em breve' });
    setTimeout(() => {
      window.print();
      const injected = document.getElementById('relatorio-print-portrait');
      if (injected) injected.remove();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-red-100 p-8 no-print-padding">
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

          {/* ── Month chips (multi-select) ── */}
          {monthOptions.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Período</span>
                {filterMonths.length > 0 && (
                  <span className="text-xs text-gray-400">
                    — {filterMonths.length} {filterMonths.length === 1 ? 'mês' : 'meses'} selecionado{filterMonths.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {monthOptions.map((ym) => {
                  const active = filterMonths.includes(ym);
                  return (
                    <button
                      key={ym}
                      onClick={() => toggleMonth(ym)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                        active
                          ? 'text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      style={active ? { backgroundColor: '#1a6040' } : {}}
                    >
                      {monthLabel(ym)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Filtro de data De/Até ── */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
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

            {/* Lote */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lote</label>
              <select
                value={filterLote}
                onChange={(e) => setFilterLote(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl appearance-none bg-white text-sm pr-10 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Todos</option>
                {loteOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Export buttons (4th column) */}
            <div className="flex items-end gap-2">
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

        {/* ── Supplement pills (all active types, top 3 highlighted) ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <SupplementPills activeTypes={activeTypes} groups={aggregatedGroupsWithMeta} />
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

        {/* ── Gráfico de linha — curva de consumo por lote ── */}
        {!loading && filterLote && loteLineData && loteLineData.points.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: '#1a6040' }} />
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                    Curva de Consumo — {filterLote}
                  </h3>
                </div>
                {loteLineData.pesoVivo && (
                  <p className="text-xs text-gray-500">
                    Peso vivo: <strong>{loteLineData.pesoVivo.toFixed(0)} kg</strong>
                    {' '}— % PV calculado sobre este peso
                  </p>
                )}
              </div>
              <button
                onClick={handleFichaPDF}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all no-print"
              >
                <Printer className="w-4 h-4" />
                Ficha PDF
              </button>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={loteLineData.points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${Number(v).toFixed(3).replace('.', ',')}`}
                  label={{ value: 'KG/cab/dia', angle: -90, position: 'insideLeft', style: { fontSize: 10 }, offset: 10 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name.endsWith('_PV')) return [`${Number(value).toFixed(3).replace('.', ',')}%`, `% PV — ${name.replace('_PV', '')}`];
                    return [`${Number(value).toFixed(3).replace('.', ',')} kg/cab/dia`, name];
                  }}
                  labelFormatter={l => `Data: ${l}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                {loteLineData.tiposUnicos.map((tipo, i) => (
                  <Line
                    key={tipo}
                    type="monotone"
                    dataKey={tipo}
                    name={tipo}
                    stroke={getSupplementColor(tipo, i)}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: getSupplementColor(tipo, i) }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
                {loteLineData.pesoVivo && loteLineData.tiposUnicos.map((tipo, i) => (
                  <Line
                    key={`${tipo}_PV`}
                    type="monotone"
                    dataKey={`${tipo}_PV`}
                    name={`% PV — ${tipo}`}
                    stroke={getSupplementColor(tipo, i)}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Per-supplement sections ── */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <>
            <div className="space-y-8">
              {activeTypes.map((tipo, i) => {
                const sectionEntries = aggregatedGroupsWithMeta[tipo] ?? [];
                const color = getSupplementColor(tipo, i);
                return (
                  <SupplementSection
                    key={tipo}
                    tipo={tipo.toUpperCase()}
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
