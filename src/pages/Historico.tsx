import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { History, Search, X, User } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/Skeleton';

const TIPO_LABELS: Record<string, string> = {
  alocacao:           'Alocação',
  transferencia:      'Transferência',
  evolucao_categoria: 'Evolução Categoria',
  paricao:            'Parição',
  manejo_bezerros:    'Desmama',
  abate:              'Abate',
  venda:              'Venda',
  desagrupamento:     'Desagrupamento',
  ajuste_quantidade:  'Ajuste',
  fusao:              'Fusão',
  transf_parcial:     'Transf. Parcial',
  lancamento:         'Lançamento',
};

const TIPO_COLORS: Record<string, string> = {
  alocacao:           'bg-blue-50 text-blue-700',
  transferencia:      'bg-indigo-50 text-indigo-700',
  evolucao_categoria: 'bg-amber-50 text-amber-700',
  paricao:            'bg-pink-50 text-pink-700',
  manejo_bezerros:    'bg-orange-50 text-orange-700',
  abate:              'bg-red-50 text-red-700',
  venda:              'bg-purple-50 text-purple-700',
  lancamento:         'bg-teal-50 text-teal-700',
};

const ACTION_LABELS: Record<string, string> = {
  criou:   'Criação',
  editou:  'Edição',
  excluiu: 'Exclusão',
};

const ACTION_COLORS: Record<string, string> = {
  criou:   'bg-green-50 text-green-700',
  editou:  'bg-blue-50 text-blue-700',
  excluiu: 'bg-red-50 text-red-700',
};

const MODULE_LABELS: Record<string, string> = {
  formulario: 'Lançamento',
  manejos:    'Manejos',
  cadastros:  'Cadastros',
  relatorio:  'Relatório',
  fazendas:   'Fazendas',
  usuarios:   'Usuários',
};

const MODULE_COLORS: Record<string, string> = {
  formulario: 'bg-blue-50 text-blue-700',
  manejos:    'bg-purple-50 text-purple-700',
  cadastros:  'bg-amber-50 text-amber-700',
  relatorio:  'bg-emerald-50 text-emerald-700',
};

type FilterType = 'all' | 'manejo' | 'lancamento' | 'activity';

interface HistoricoEntry {
  id: string;
  source: 'manejo' | 'lancamento' | 'activity';
  tipo: string;
  descricao: string;
  user_name?: string;
  module?: string;
  action?: string;
  created_at: string;
}

export function Historico() {
  const { activeFarmId } = useData();
  const { user } = useAuth();
  const farmId = activeFarmId || user?.farmId || '';
  const [manejos, setManejos] = useState<{ id: string; tipo: string; descricao: string; created_at: string; user_name?: string }[]>([]);
  const [lancamentos, setLancamentos] = useState<{ id: string; pasto_nome: string; suplemento: string; data: string | null; quantidade: number; sacos: number; kg: number }[]>([]);
  const [activityLogs, setActivityLogs] = useState<{ id: string; module: string; action: string; description: string; user_name?: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterLote, setFilterLote] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [loteOptions, setLoteOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    Promise.all([
      supabaseAdmin.from('manejo_historico').select('id, tipo, descricao, created_at, user_name').eq('farm_id', farmId).order('created_at', { ascending: false }).limit(300),
      supabaseAdmin.from('data_entries').select('id, pasto_nome, suplemento, data, quantidade, sacos, kg').eq('farm_id', farmId).order('data', { ascending: false }).limit(300),
      supabaseAdmin.from('activity_log').select('id, module, action, description, user_name, created_at').eq('farm_id', farmId).order('created_at', { ascending: false }).limit(300),
      supabaseAdmin.from('animals').select('nome').eq('farm_id', farmId).eq('status', 'ativo').order('nome'),
    ]).then(([manRes, lanRes, actRes, animRes]) => {
      setManejos(manRes.data ?? []);
      setLancamentos(lanRes.data ?? []);
      setActivityLogs(actRes.data ?? []);
      setLoteOptions((animRes.data ?? []).map((a: { nome: string }) => a.nome));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [farmId]);

  const allEntries = useMemo((): HistoricoEntry[] => {
    const manejoItems: HistoricoEntry[] = manejos.map(e => ({
      id: `m_${e.id}`,
      source: 'manejo',
      tipo: e.tipo,
      descricao: e.descricao,
      user_name: e.user_name || undefined,
      created_at: e.created_at,
    }));
    const lanItems: HistoricoEntry[] = lancamentos.map(l => ({
      id: `l_${l.id}`,
      source: 'lancamento',
      tipo: 'lancamento',
      descricao: `${l.pasto_nome} · ${l.suplemento} · ${l.quantidade} cab. · ${l.sacos} sac. · ${l.kg} kg`,
      created_at: l.data || '',
    }));
    const actItems: HistoricoEntry[] = activityLogs.map(a => ({
      id: `a_${a.id}`,
      source: 'activity',
      tipo: a.action,
      descricao: a.description,
      user_name: a.user_name || undefined,
      module: a.module,
      action: a.action,
      created_at: a.created_at,
    }));
    return [...manejoItems, ...lanItems, ...actItems].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [manejos, lancamentos, activityLogs]);

  const filtered = useMemo(() => {
    let entries = allEntries;
    // Filter by type
    if (filterType === 'manejo') entries = entries.filter(e => e.source === 'manejo');
    else if (filterType === 'lancamento') entries = entries.filter(e => e.source === 'lancamento' || (e.source === 'activity' && e.module === 'formulario'));
    else if (filterType === 'activity') entries = entries.filter(e => e.source === 'activity' && e.module !== 'formulario');
    // Filter by date range
    if (dateFrom) entries = entries.filter(e => e.created_at >= dateFrom);
    if (dateTo)   entries = entries.filter(e => e.created_at.slice(0, 10) <= dateTo);
    // Filter by lote
    if (filterLote) {
      entries = entries.filter(e =>
        e.descricao.toLowerCase().includes(filterLote.toLowerCase())
      );
    }
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.descricao.toLowerCase().includes(q) ||
        (TIPO_LABELS[e.tipo] ?? e.tipo).toLowerCase().includes(q) ||
        (e.user_name ?? '').toLowerCase().includes(q) ||
        (e.module ? (MODULE_LABELS[e.module] ?? e.module).toLowerCase().includes(q) : false)
      );
    }
    return entries;
  }, [allEntries, search, filterType, filterLote, dateFrom, dateTo]);

  function fmtDate(iso: string, dateOnly = false) {
    if (!iso) return '—';
    try {
      if (dateOnly || iso.length === 10) {
        // Data sem hora — evitar bug de timezone (ex: "2026-03-15" → 14/03 no UTC-3)
        const [y, m, d] = iso.slice(0, 10).split('-');
        return `${d}/${m}/${y.slice(2)}`;
      }
      return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    catch { return iso.slice(0, 10); }
  }

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: allEntries.length },
    { key: 'lancamento', label: 'Lançamentos', count: allEntries.filter(e => e.source === 'lancamento' || (e.source === 'activity' && e.module === 'formulario')).length },
    { key: 'manejo', label: 'Manejos', count: allEntries.filter(e => e.source === 'manejo').length },
    { key: 'activity', label: 'Atividades', count: allEntries.filter(e => e.source === 'activity' && e.module !== 'formulario').length },
  ];

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500 mt-1">Registro completo de manejos, lançamentos e atividades do sistema.</p>
        </div>

        {/* Filtro por lote */}
        {loteOptions.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lote</span>
            <select
              value={filterLote}
              onChange={e => setFilterLote(e.target.value)}
              className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos os lotes</option>
              {loteOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {filterLote && (
              <button onClick={() => setFilterLote('')} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                Limpar
              </button>
            )}
          </div>
        )}

        {/* Filtro de datas */}
        <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Período</span>
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
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              Limpar datas
            </button>
          )}
        </div>

        {/* Chips de filtro */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filterType === tab.key
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === tab.key ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filtrar por tipo, descrição ou usuário..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? <SkeletonTable rows={6} cols={4} /> : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
              {filtered.map(e => (
                <div key={e.id} className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                    {e.source === 'activity' ? (
                      <>
                        {e.module && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${MODULE_COLORS[e.module] ?? 'bg-gray-100 text-gray-600'}`}>
                            {MODULE_LABELS[e.module] ?? e.module}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[e.action ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[e.action ?? ''] ?? e.action}
                        </span>
                      </>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_LABELS[e.tipo] ?? e.tipo}
                      </span>
                    )}
                  </div>
                  <p className="flex-1 text-xs text-gray-700 leading-relaxed">{e.descricao}</p>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    {e.user_name && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <User className="w-2.5 h-2.5" />
                        {e.user_name}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400">{fmtDate(e.created_at, e.source === 'lancamento')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
