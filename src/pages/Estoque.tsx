import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, Plus, TrendingDown, TrendingUp, AlertTriangle,
  X, ChevronDown, ShoppingCart, BarChart2, History, Settings2,
  CheckCircle, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  estoqueService,
  type SaldoSuplemento,
  type EstoqueMovimento,
  type SuppTypeWithEstoque,
} from '../services/estoqueService';

/* ── helpers ── */
const fmtNum = (n: number, dec = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtDate = (s: string) => s ? s.split('-').reverse().join('/') : '—';

const today = () => new Date().toISOString().split('T')[0];

/* ── Tabs ── */
const TABS = [
  { key: 'saldos',      label: 'Saldos',        icon: BarChart2 },
  { key: 'movimentos',  label: 'Movimentações',  icon: History   },
  { key: 'alertas',     label: 'Alertas',        icon: AlertTriangle },
  { key: 'configurar',  label: 'Configurar',     icon: Settings2 },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ============================================================
   Modal — Nova Entrada
   ============================================================ */
function EntradaModal({
  supls,
  farmId,
  userId,
  onClose,
  onSaved,
}: {
  supls: SuppTypeWithEstoque[];
  farmId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [suplNome,   setSuplNome]   = useState('');
  const [suplId,     setSuplId]     = useState<string | undefined>();
  const [data,       setData]       = useState(today());
  const [sacos,      setSacos]      = useState('');
  const [valorKg,    setValorKg]    = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [nf,         setNf]         = useState('');
  const [obs,        setObs]        = useState('');
  const [saving,     setSaving]     = useState(false);

  const supl = supls.find(s => s.nome === suplNome);
  const pesoSaco = supl?.peso ?? 25;
  const kg = sacos ? Number(sacos) * pesoSaco : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suplNome || !sacos || Number(sacos) <= 0) {
      toast.error('Preencha suplemento e quantidade de sacos.');
      return;
    }
    setSaving(true);
    try {
      await estoqueService.adicionarEntrada({
        farmId,
        suplementoId:    suplId,
        suplementoNome:  suplNome,
        data,
        sacos:           Number(sacos),
        kg,
        valorUnitarioKg: valorKg ? Number(valorKg.replace(',', '.')) : undefined,
        fornecedor:      fornecedor || undefined,
        notaFiscal:      nf || undefined,
        observacoes:     obs || undefined,
        createdBy:       userId,
      });
      toast.success(`Entrada de ${sacos} sacos registrada!`);
      onSaved();
    } catch (err) {
      toast.error('Erro ao salvar entrada.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(26,96,64,0.10)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#1a6040' }} />
            </div>
            <h2 className="font-bold text-gray-900">Nova Entrada de Estoque</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Suplemento */}
          <div>
            <label className={labelCls}>Suplemento *</label>
            <div className="relative">
              <select
                value={suplNome}
                onChange={e => {
                  const nome = e.target.value;
                  setSuplNome(nome);
                  setSuplId(supls.find(s => s.nome === nome)?.id);
                }}
                className={inputCls + ' pr-8 appearance-none'}
                required
              >
                <option value="">Selecione...</option>
                {supls.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Data + Sacos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data *</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} max={today()} required />
            </div>
            <div>
              <label className={labelCls}>Sacos *</label>
              <input
                type="number" min="0.01" step="0.01"
                placeholder="Ex.: 20"
                value={sacos}
                onChange={e => setSacos(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* KG calculado */}
          {kg > 0 && (
            <p className="text-xs text-gray-400 -mt-2">
              ≈ <strong className="text-gray-700">{fmtNum(kg)} kg</strong> ({sacos} sacos × {pesoSaco} kg/saco)
            </p>
          )}

          {/* Valor/kg */}
          <div>
            <label className={labelCls}>Valor unitário (R$/kg)</label>
            <input
              type="text" placeholder="Ex.: 2,80"
              value={valorKg} onChange={e => setValorKg(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Fornecedor + NF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fornecedor</label>
              <input type="text" placeholder="Ex.: Zoo Flora" value={fornecedor} onChange={e => setFornecedor(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nota Fiscal</label>
              <input type="text" placeholder="Nº NF" value={nf} onChange={e => setNf(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              rows={2}
              placeholder="Informações adicionais..."
              value={obs} onChange={e => setObs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: '#1a6040' }}
            >
              {saving ? 'Salvando...' : <><CheckCircle className="w-4 h-4" /> Registrar Entrada</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ============================================================
   Modal — Saída Manual
   ============================================================ */
function SaidaModal({
  supls,
  farmId,
  userId,
  onClose,
  onSaved,
}: {
  supls: SuppTypeWithEstoque[];
  farmId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [suplNome, setSuplNome] = useState('');
  const [suplId,   setSuplId]   = useState<string | undefined>();
  const [data,     setData]     = useState(today());
  const [sacos,    setSacos]    = useState('');
  const [obs,      setObs]      = useState('');
  const [saving,   setSaving]   = useState(false);

  const supl   = supls.find(s => s.nome === suplNome);
  const pesoSaco = supl?.peso ?? 25;
  const kg       = sacos ? Number(sacos) * pesoSaco : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suplNome || !sacos || Number(sacos) <= 0) {
      toast.error('Preencha suplemento e quantidade.');
      return;
    }
    setSaving(true);
    try {
      await estoqueService.adicionarSaida({
        farmId, suplementoId: suplId, suplementoNome: suplNome,
        data, sacos: Number(sacos), kg,
        observacoes: obs || undefined, createdBy: userId,
      });
      toast.success(`Saída de ${sacos} sacos registrada!`);
      onSaved();
    } catch {
      toast.error('Erro ao salvar saída.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="font-bold text-gray-900">Registrar Saída</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Suplemento *</label>
            <div className="relative">
              <select
                value={suplNome}
                onChange={e => { setSuplNome(e.target.value); setSuplId(supls.find(s => s.nome === e.target.value)?.id); }}
                className={inputCls + ' pr-8 appearance-none'} required
              >
                <option value="">Selecione...</option>
                {supls.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data *</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} max={today()} required />
            </div>
            <div>
              <label className={labelCls}>Sacos *</label>
              <input type="number" min="0.01" step="0.01" placeholder="Ex.: 5" value={sacos} onChange={e => setSacos(e.target.value)} className={inputCls} required />
            </div>
          </div>

          {kg > 0 && <p className="text-xs text-gray-400 -mt-2">≈ <strong className="text-gray-700">{fmtNum(kg)} kg</strong></p>}

          <div>
            <label className={labelCls}>Observações</label>
            <textarea rows={2} placeholder="Motivo da saída..." value={obs} onChange={e => setObs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : <><TrendingDown className="w-4 h-4" /> Registrar Saída</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ============================================================
   Card de Saldo de Suplemento
   ============================================================ */
function SaldoCard({ s }: { s: SaldoSuplemento }) {
  const pct = s.estoque_minimo_sacos > 0
    ? Math.min(100, (s.saldo_sacos / s.estoque_minimo_sacos) * 100)
    : s.saldo_sacos > 0 ? 100 : 0;

  const cor = s.em_alerta
    ? { bar: '#ef4444', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
    : s.saldo_sacos <= 0
    ? { bar: '#f97316', bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }
    : { bar: '#1a6040', bg: '#f0fdf4', text: '#14532d', border: '#86efac' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border p-5 flex flex-col gap-3"
      style={{
        borderColor: s.em_alerta ? cor.border : 'rgba(0,0,0,0.08)',
        boxShadow:   s.em_alerta ? `0 0 0 2px ${cor.border}33` : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Nome + badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-800 leading-tight">{s.suplemento_nome}</h3>
        {s.em_alerta && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cor.bg, color: cor.text }}>
            <AlertTriangle className="w-3 h-3" /> ALERTA
          </span>
        )}
        {!s.em_alerta && s.saldo_sacos <= 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: '#ffedd5', color: '#c2410c' }}>
            SEM SALDO
          </span>
        )}
      </div>

      {/* Saldo principal */}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-extrabold tabular-nums" style={{ color: cor.bar }}>
          {fmtNum(s.saldo_sacos, 1)}
        </span>
        <span className="text-sm text-gray-400 mb-1">sacos</span>
        <span className="text-xs text-gray-400 mb-1 ml-1">({fmtNum(s.saldo_kg, 0)} kg)</span>
      </div>

      {/* Barra de progresso */}
      {s.estoque_minimo_sacos > 0 && (
        <div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: cor.bar }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Mínimo: {fmtNum(s.estoque_minimo_sacos, 0)} sacos
          </p>
        </div>
      )}

      {/* Entradas / Saídas */}
      <div className="flex gap-4 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-gray-500">{fmtNum(s.sacos_entrada, 1)} entradas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-gray-500">{fmtNum(s.sacos_saida, 1)} saídas</span>
        </div>
        {s.valor_medio_kg && (
          <span className="ml-auto text-xs text-gray-400">
            R$ {s.valor_medio_kg.toFixed(2).replace('.', ',')}/kg
          </span>
        )}
      </div>

      {s.ultimo_movimento && (
        <p className="text-[10px] text-gray-400 -mt-1">
          Último mov.: {fmtDate(s.ultimo_movimento)}
        </p>
      )}
    </motion.div>
  );
}

/* ============================================================
   Página Principal
   ============================================================ */
export function Estoque() {
  const { user, isAdmin } = useAuth();
  const { activeFarmId }  = useData();
  const farmId = activeFarmId || user?.farmId || '';

  const [tab,         setTab]         = useState<TabKey>('saldos');
  const [supls,       setSupls]       = useState<SuppTypeWithEstoque[]>([]);
  const [saldos,      setSaldos]      = useState<SaldoSuplemento[]>([]);
  const [movimentos,  setMovimentos]  = useState<EstoqueMovimento[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSaida,   setShowSaida]   = useState(false);

  /* Filtros da tab movimentações */
  const [filtroTipo,   setFiltroTipo]  = useState('');
  const [filtroSupl,   setFiltroSupl]  = useState('');
  const [filtroFrom,   setFiltroFrom]  = useState('');
  const [filtroTo,     setFiltroTo]    = useState('');

  /* Configurar estoque mínimo */
  const [editMinimos, setEditMinimos] = useState<Record<string, { min: string; alerta: boolean }>>({});
  const [savingMin,   setSavingMin]   = useState(false);

  async function carregarDados() {
    if (!farmId) return;
    setLoading(true);
    try {
      const s = await estoqueService.listarSuplementos(farmId);
      setSupls(s);
      const sal = await estoqueService.calcularSaldos(farmId, s);
      setSaldos(sal);
      const movs = await estoqueService.listarMovimentos(farmId, { limit: 500 });
      setMovimentos(movs);
    } catch (e) {
      toast.error('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, [farmId]);

  /* Inicializa os campos de configuração */
  useEffect(() => {
    const init: Record<string, { min: string; alerta: boolean }> = {};
    for (const s of supls) {
      init[s.id] = {
        min:    String(s.estoque_minimo_sacos ?? 0),
        alerta: s.alerta_reposicao ?? false,
      };
    }
    setEditMinimos(init);
  }, [supls]);

  /* Alertas count */
  const totalAlertas = saldos.filter(s => s.em_alerta).length;

  /* Movimentos filtrados */
  const movsFiltrados = useMemo(() => movimentos.filter(m => {
    if (filtroTipo && m.tipo !== filtroTipo) return false;
    if (filtroSupl && m.suplemento_nome !== filtroSupl) return false;
    if (filtroFrom && m.data < filtroFrom) return false;
    if (filtroTo   && m.data > filtroTo)   return false;
    return true;
  }), [movimentos, filtroTipo, filtroSupl, filtroFrom, filtroTo]);

  async function salvarMinimos() {
    setSavingMin(true);
    try {
      await Promise.all(
        supls.map(s => {
          const v = editMinimos[s.id];
          if (!v) return Promise.resolve();
          return estoqueService.atualizarEstoqueMinimo(
            s.id,
            parseFloat(v.min.replace(',', '.')) || 0,
            v.alerta,
          );
        }),
      );
      toast.success('Configurações salvas!');
      await carregarDados();
    } catch {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSavingMin(false);
    }
  }

  async function deletarMovimento(id: string) {
    if (!confirm('Remover este lançamento?')) return;
    try {
      await estoqueService.deletarMovimento(id);
      toast.success('Lançamento removido.');
      await carregarDados();
    } catch {
      toast.error('Erro ao remover.');
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Módulo disponível apenas para administradores.</p>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="p-4 md:p-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-4 mb-8 flex-wrap"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Gestão de Insumos
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Estoque de Suplementos
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {totalAlertas > 0 && (
            <button
              onClick={() => setTab('alertas')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              {totalAlertas} alerta{totalAlertas > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => setShowEntrada(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
          >
            <Plus className="w-4 h-4" /> Nova Entrada
          </button>
          <button
            onClick={() => setShowSaida(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors"
          >
            <TrendingDown className="w-4 h-4" /> Registrar Saída
          </button>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-2xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={active
                ? { background: '#1a6040', color: '#fff', boxShadow: '0 2px 8px rgba(26,96,64,0.25)' }
                : { color: '#6b7280' }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.key === 'alertas' && totalAlertas > 0 && (
                <span className="text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : '#ef4444', color: '#fff' }}>
                  {totalAlertas}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────── TAB: SALDOS ──────── */}
      {tab === 'saldos' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : saldos.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum suplemento cadastrado.</p>
            <p className="text-sm mt-1">Adicione suplementos em Cadastros → Suplementos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {saldos.map(s => <SaldoCard key={s.suplemento_nome} s={s} />)}
          </div>
        )
      )}

      {/* ──────── TAB: MOVIMENTAÇÕES ──────── */}
      {tab === 'movimentos' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-wrap gap-3 items-end"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Suplemento</label>
              <select value={filtroSupl} onChange={e => setFiltroSupl(e.target.value)}
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Todos</option>
                {supls.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">De</label>
                <input type="date" value={filtroFrom} onChange={e => setFiltroFrom(e.target.value)}
                  className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Até</label>
                <input type="date" value={filtroTo} onChange={e => setFiltroTo(e.target.value)}
                  className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            {(filtroTipo || filtroSupl || filtroFrom || filtroTo) && (
              <button onClick={() => { setFiltroTipo(''); setFiltroSupl(''); setFiltroFrom(''); setFiltroTo(''); }}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium self-end pb-1">
                Limpar
              </button>
            )}
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : movsFiltrados.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum movimento encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                      {['Data', 'Tipo', 'Suplemento', 'Sacos', 'KG', 'Fornecedor / NF', 'Valor/kg', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movsFiltrados.map((m, i) => (
                      <tr key={m.id} className={i % 2 === 1 ? 'bg-gray-50/40' : ''}>
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{fmtDate(m.data)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                            m.tipo === 'entrada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {m.tipo === 'entrada'
                              ? <><TrendingUp className="w-3 h-3" /> Entrada</>
                              : <><TrendingDown className="w-3 h-3" /> Saída</>}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{m.suplemento_nome}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-700">{fmtNum(m.sacos, 1)}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-500">{fmtNum(m.kg, 0)}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {[m.fornecedor, m.nota_fiscal].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 tabular-nums">
                          {m.valor_unitario_kg ? `R$ ${Number(m.valor_unitario_kg).toFixed(2).replace('.', ',')}` : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => deletarMovimento(m.id)}
                            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────── TAB: ALERTAS ──────── */}
      {tab === 'alertas' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-400 text-sm">Carregando...</p>
          ) : saldos.filter(s => s.em_alerta || s.saldo_sacos <= 0).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-gray-700">Tudo em ordem!</p>
              <p className="text-sm text-gray-400 mt-1">Nenhum suplemento abaixo do estoque mínimo.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {saldos.filter(s => s.em_alerta || s.saldo_sacos <= 0).length} suplemento(s) necessitam atenção:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {saldos.filter(s => s.em_alerta || s.saldo_sacos <= 0).map(s => (
                  <AlertaCard key={s.suplemento_nome} s={s} farmId={farmId} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────── TAB: CONFIGURAR ──────── */}
      {tab === 'configurar' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Estoque Mínimo por Suplemento</h3>
            <button
              onClick={salvarMinimos}
              disabled={savingMin}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: '#1a6040' }}
            >
              {savingMin ? 'Salvando...' : <><CheckCircle className="w-4 h-4" /> Salvar</>}
            </button>
          </div>
          <div className="p-4">
            {supls.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum suplemento cadastrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                    <th className="py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Suplemento</th>
                    <th className="py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Mínimo (sacos)</th>
                    <th className="py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Alerta ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {supls.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 1 ? 'bg-gray-50/40' : ''}>
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{s.nome}</td>
                      <td className="py-2.5 pr-4">
                        <input
                          type="number" min="0" step="0.5"
                          value={editMinimos[s.id]?.min ?? '0'}
                          onChange={e => setEditMinimos(prev => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], min: e.target.value },
                          }))}
                          className="w-28 h-8 px-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={() => setEditMinimos(prev => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], alerta: !prev[s.id]?.alerta },
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editMinimos[s.id]?.alerta ? 'bg-teal-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            editMinimos[s.id]?.alerta ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modais ── */}
      <AnimatePresence>
        {showEntrada && (
          <EntradaModal
            supls={supls} farmId={farmId} userId={user?.id ?? ''}
            onClose={() => setShowEntrada(false)}
            onSaved={() => { setShowEntrada(false); carregarDados(); }}
          />
        )}
        {showSaida && (
          <SaidaModal
            supls={supls} farmId={farmId} userId={user?.id ?? ''}
            onClose={() => setShowSaida(false)}
            onSaved={() => { setShowSaida(false); carregarDados(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Alerta Card (tab alertas) ── */
function AlertaCard({ s, farmId }: { s: SaldoSuplemento; farmId: string }) {
  const [consumo30d, setConsumo30d] = useState<number | null>(null);
  useEffect(() => {
    estoqueService.consumoMedio30d(farmId, s.suplemento_nome).then(setConsumo30d).catch(() => {});
  }, [farmId, s.suplemento_nome]);

  const sugerido = consumo30d != null && consumo30d > 0
    ? Math.ceil(consumo30d * 1.5)   // 1.5x o consumo dos últimos 30 dias
    : null;

  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 p-5 space-y-3"
      style={{ boxShadow: '0 2px 12px rgba(239,68,68,0.10)' }}>
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-800 text-sm leading-tight">{s.suplemento_nome}</h3>
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
          <AlertTriangle className="w-3 h-3" />
          {s.saldo_sacos <= 0 ? 'SEM SALDO' : 'ABAIXO DO MÍNIMO'}
        </span>
      </div>
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Saldo atual</p>
          <p className="font-extrabold text-red-500 tabular-nums">{fmtNum(s.saldo_sacos, 1)} sacos</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Mínimo</p>
          <p className="font-bold text-gray-700 tabular-nums">{fmtNum(s.estoque_minimo_sacos, 0)} sacos</p>
        </div>
        {consumo30d != null && (
          <div>
            <p className="text-xs text-gray-400">Consumo 30d</p>
            <p className="font-bold text-gray-700 tabular-nums">{fmtNum(consumo30d, 1)} sacos</p>
          </div>
        )}
      </div>
      {sugerido && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(26,96,64,0.06)' }}>
          <ShoppingCart className="w-4 h-4 flex-shrink-0" style={{ color: '#1a6040' }} />
          <p className="text-xs text-gray-700">
            Sugestão de compra: <strong className="text-gray-900">{sugerido} sacos</strong>
            <span className="text-gray-400"> (1,5× consumo/30d)</span>
          </p>
        </div>
      )}
    </div>
  );
}
