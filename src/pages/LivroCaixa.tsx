import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, X, ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  caixaService,
  type LancamentoCaixa,
  type NovoLancamento,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
} from '../services/caixaService';

/* ── helpers ── */
const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string) => {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
};

const today = () => new Date().toISOString().slice(0, 10);

/* ══════════════════════════════════════════════════════════════════════ */

export function LivroCaixa() {
  const { user, isAdmin } = useAuth();
  const { activeFarmId } = useData();
  const farmId = activeFarmId;

  const [lancamentos, setLancamentos] = useState<LancamentoCaixa[]>([]);
  const [loading, setLoading]         = useState(true);

  /* filtros */
  const [filtroTipo,      setFiltroTipo]      = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroDateFrom,  setFiltroDateFrom]  = useState('');
  const [filtroDateTo,    setFiltroDateTo]    = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  /* modais */
  const [showModal,   setShowModal]   = useState(false);
  const [showDelete,  setShowDelete]  = useState<LancamentoCaixa | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  /* guard */
  if (!isAdmin) return null;

  /* ── load ── */
  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    caixaService.listar(farmId)
      .then(setLancamentos)
      .catch(() => toast.error('Erro ao carregar lançamentos'))
      .finally(() => setLoading(false));
  }, [farmId]);

  /* ── filtros aplicados ── */
  const filtered = useMemo(() => {
    return lancamentos.filter(l => {
      if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
      if (filtroDateFrom && l.data < filtroDateFrom) return false;
      if (filtroDateTo   && l.data > filtroDateTo)   return false;
      if (filtroCategoria && l.categoria !== filtroCategoria) return false;
      return true;
    });
  }, [lancamentos, filtroTipo, filtroDateFrom, filtroDateTo, filtroCategoria]);

  const resumo  = useMemo(() => caixaService.calcularResumo(filtered),  [filtered]);
  const grafico = useMemo(() => caixaService.calcularGrafico(lancamentos), [lancamentos]);

  /* ── categorias para filtro ── */
  const todasCategorias = useMemo(() => {
    const set = new Set(lancamentos.map(l => l.categoria));
    return Array.from(set).sort();
  }, [lancamentos]);

  /* ── delete ── */
  async function handleDelete() {
    if (!showDelete) return;
    setSubmitting(true);
    try {
      await caixaService.deletar(showDelete.id);
      setLancamentos(prev => prev.filter(l => l.id !== showDelete!.id));
      toast.success('Lançamento removido.');
      setShowDelete(null);
    } catch {
      toast.error('Erro ao remover lançamento.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── export Excel ── */
  function handleExportExcel() {
    const rows = [
      ['Data', 'Tipo', 'Categoria', 'Descrição', 'Referência', 'Valor (R$)', 'Origem'],
      ...filtered.map(l => [
        fmtDate(l.data),
        l.tipo.toUpperCase(),
        l.categoria,
        l.descricao ?? '',
        l.referencia ?? '',
        l.valor.toFixed(2).replace('.', ','),
        l.origem,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `livro-caixa-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Extrato exportado!');
  }

  /* ── RENDER ── */
  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4 mb-8 flex-wrap"
      >
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900">Livro Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de receitas e despesas da fazenda</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all"
            style={{ boxShadow: '0 2px 10px rgba(26,96,64,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            Lançamento
          </button>
        </div>
      </motion.div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Receitas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Receitas</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.10)' }}>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmtBRL(resumo.totalReceitas)}</p>
        </motion.div>

        {/* Despesas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Despesas</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.10)' }}>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500">{fmtBRL(resumo.totalDespesas)}</p>
        </motion.div>

        {/* Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Saldo</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: resumo.saldo >= 0 ? 'rgba(26,96,64,0.10)' : 'rgba(220,38,38,0.10)' }}>
              <Wallet className="w-4 h-4" style={{ color: resumo.saldo >= 0 ? '#1a6040' : '#dc2626' }} />
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: resumo.saldo >= 0 ? '#1a6040' : '#dc2626' }}>
            {fmtBRL(resumo.saldo)}
          </p>
        </motion.div>
      </div>

      {/* Gráfico mensal */}
      {grafico.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 mb-8"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Receitas vs Despesas por Mês</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => fmtBRL(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="receitas" name="Receitas" fill="#16a34a" radius={[4,4,0,0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tipo */}
          <div className="relative">
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value as typeof filtroTipo)}
              className="w-full h-9 pl-3 pr-8 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="todos">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" />
          </div>
          {/* Categoria */}
          <div className="relative">
            <select
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Todas categorias</option>
              {todasCategorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" />
          </div>
          {/* Data de */}
          <input
            type="date"
            value={filtroDateFrom}
            onChange={e => setFiltroDateFrom(e.target.value)}
            className="h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="De"
          />
          {/* Data até */}
          <input
            type="date"
            value={filtroDateTo}
            onChange={e => setFiltroDateTo(e.target.value)}
            className="h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Até"
          />
        </div>
        {(filtroTipo !== 'todos' || filtroDateFrom || filtroDateTo || filtroCategoria) && (
          <button
            onClick={() => { setFiltroTipo('todos'); setFiltroDateFrom(''); setFiltroDateTo(''); setFiltroCategoria(''); }}
            className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#e5e7eb' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(26,96,64,0.07)' }}>
            <Wallet className="w-8 h-8" style={{ color: '#1a6040' }} />
          </div>
          <p className="text-gray-500 font-medium">Nenhum lançamento encontrado</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1a6040' }}
          >
            Adicionar primeiro lançamento
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                  {['Data', 'Tipo', 'Categoria', 'Descrição', 'Referência', 'Valor', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, idx) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group"
                    style={{ borderBottom: '1px solid #f9fafb' }}
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(l.data)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={l.tipo === 'receita'
                          ? { background: 'rgba(22,163,74,0.10)', color: '#16a34a' }
                          : { background: 'rgba(220,38,38,0.10)', color: '#dc2626' }
                        }>
                        {l.tipo === 'receita' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{l.categoria}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{l.descricao || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{l.referencia || '—'}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap"
                      style={{ color: l.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
                      {l.tipo === 'despesa' ? '- ' : '+ '}{fmtBRL(l.valor)}
                    </td>
                    <td className="px-4 py-3">
                      {l.origem === 'manual' && (
                        <button
                          onClick={() => setShowDelete(l)}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1.5 rounded-lg transition-all"
                          style={{ color: '#6b7280' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com totais filtrados */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm flex-wrap gap-2">
            <span className="text-gray-400 text-xs">{filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-6">
              <span className="text-green-600 font-semibold">+ {fmtBRL(resumo.totalReceitas)}</span>
              <span className="text-red-500 font-semibold">- {fmtBRL(resumo.totalDespesas)}</span>
              <span className="font-bold" style={{ color: resumo.saldo >= 0 ? '#1a6040' : '#dc2626' }}>
                = {fmtBRL(resumo.saldo)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Novo Lançamento ── */}
      {showModal && (
        <NovoLancamentoModal
          farmId={farmId}
          userId={user?.id ?? ''}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            const updated = await caixaService.listar(farmId);
            setLancamentos(updated);
          }}
        />
      )}

      {/* ── Modal: Confirmar delete ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(220,38,38,0.1)' }}>
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Remover lançamento?</h2>
            <p className="text-sm text-gray-500 mb-1">{showDelete.categoria}</p>
            <p className="text-lg font-bold mb-5"
              style={{ color: showDelete.tipo === 'receita' ? '#16a34a' : '#dc2626' }}>
              {fmtBRL(showDelete.valor)}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">Cancelar</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-50">
                {submitting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Modal: Novo Lançamento
══════════════════════════════════════════════════════════════════════ */
function NovoLancamentoModal({
  farmId, userId, onClose, onSaved,
}: {
  farmId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo,       setTipo]       = useState<'receita' | 'despesa'>('despesa');
  const [categoria,  setCategoria]  = useState('');
  const [descricao,  setDescricao]  = useState('');
  const [valor,      setValor]      = useState('');
  const [data,       setData]       = useState(today());
  const [referencia, setReferencia] = useState('');
  const [saving,     setSaving]     = useState(false);

  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  /* reset categoria ao trocar tipo */
  const handleTipo = (t: 'receita' | 'despesa') => { setTipo(t); setCategoria(''); };

  async function handleSubmit() {
    if (!categoria || !valor || Number(valor.replace(',', '.')) <= 0) {
      toast.error('Preencha categoria e valor.');
      return;
    }
    setSaving(true);
    try {
      const payload: NovoLancamento = {
        farm_id:    farmId,
        tipo,
        categoria,
        descricao:  descricao || null,
        valor:      Number(valor.replace(',', '.')),
        data,
        referencia: referencia || null,
        origem:     'manual',
        os_id:      null,
        created_by: userId || null,
      };
      await caixaService.criar(payload);
      toast.success('Lançamento adicionado!');
      onSaved();
    } catch {
      toast.error('Erro ao salvar lançamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <h2 className="text-base font-bold text-gray-900 mb-5">Novo Lançamento</h2>

        {/* Toggle Receita / Despesa */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl bg-gray-100">
          {(['receita', 'despesa'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTipo(t)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
              style={tipo === t
                ? { background: t === 'receita' ? '#16a34a' : '#ef4444', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { color: '#6b7280' }
              }
            >
              {t === 'receita' ? 'Receita' : 'Despesa'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Data *</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria *</label>
            <div className="relative">
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                <option value="">Selecionar...</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$) *</label>
            <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Detalhes do lançamento..."
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* Referência */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Referência (NF, contrato...)</label>
            <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)}
              placeholder="NF 1234 / Contrato 01"
              className="w-full h-9 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: tipo === 'receita' ? '#16a34a' : '#1a6040' }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
