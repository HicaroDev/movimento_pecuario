import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { History, Search, X } from 'lucide-react';
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

export function Historico() {
  const { activeFarmId } = useData();
  const { user } = useAuth();
  const farmId = activeFarmId || user?.farmId || '';
  const [events, setEvents] = useState<{ id: string; tipo: string; descricao: string; created_at: string }[]>([]);
  const [lancamentos, setLancamentos] = useState<{ id: string; pasto: string; tipo: string; data: string | null; quantidade: number; sacos: number; kg: number; funcionario?: string; created_at?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    Promise.all([
      supabaseAdmin.from('manejo_historico').select('id, tipo, descricao, created_at').eq('farm_id', farmId).order('created_at', { ascending: false }).limit(300),
      supabaseAdmin.from('data_entries').select('id, pasto, tipo, data, quantidade, sacos, kg, funcionario, created_at').eq('farm_id', farmId).order('created_at', { ascending: false }).limit(300),
    ]).then(([manRes, lanRes]) => {
      setEvents(manRes.data ?? []);
      setLancamentos(lanRes.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [farmId]);

  const allEntries = useMemo(() => {
    const manejoItems = events.map(e => ({
      id: `m_${e.id}`,
      tipo: e.tipo,
      descricao: e.descricao,
      created_at: e.created_at,
    }));
    const lanItems = lancamentos.map(l => ({
      id: `l_${l.id}`,
      tipo: 'lancamento',
      descricao: `${l.pasto} · ${l.tipo} · ${l.quantidade} cab. · ${l.sacos} sac. · ${l.kg} kg${l.funcionario ? ` · ${l.funcionario}` : ''}`,
      created_at: l.created_at || l.data || '',
    }));
    return [...manejoItems, ...lanItems].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [events, lancamentos]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.toLowerCase();
    return allEntries.filter(e => e.descricao.toLowerCase().includes(q) || (TIPO_LABELS[e.tipo] ?? e.tipo).toLowerCase().includes(q));
  }, [allEntries, search]);

  function fmtDate(iso: string) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso.slice(0, 10); }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500 mt-1">Registro completo de manejos e lançamentos. Sem possibilidade de exclusão.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filtrar por tipo ou descrição..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? <SkeletonTable rows={6} cols={3} /> : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
              {filtered.map(e => (
                <div key={e.id} className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${TIPO_COLORS[e.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TIPO_LABELS[e.tipo] ?? e.tipo}
                  </span>
                  <p className="flex-1 text-xs text-gray-700 leading-relaxed">{e.descricao}</p>
                  <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{fmtDate(e.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
