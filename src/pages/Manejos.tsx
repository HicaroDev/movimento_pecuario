import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, MapPin, ArrowRight, TrendingUp, Scissors,
  X, Save, RefreshCw, ChevronDown, AlertTriangle, History, Baby, Milk, Search, FileText, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { manejoService, type Animal, type AnimalCategory, type ManejoEvent } from '../services/manejoService';
import type { Pasture } from '../context/DataContext';
import { SkeletonTable } from '../components/Skeleton';

/* ── helpers ── */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const selectClass =
  'w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const TIPO_LABELS: Record<string, string> = {
  alocacao:           'Alocação',
  transferencia:      'Transferência',
  evolucao_categoria: 'Evolução',
  paricao:            'Parição',
  manejo_bezerros:    'Desmama',
  abate:              'Abate',
  venda:              'Venda',
  desagrupamento:     'Desagrupamento',
  ajuste_quantidade:  'Ajuste',
};
const TIPO_COLORS: Record<string, string> = {
  alocacao:           'bg-blue-50 text-blue-700',
  transferencia:      'bg-indigo-50 text-indigo-700',
  evolucao_categoria: 'bg-amber-50 text-amber-700',
  paricao:            'bg-pink-50 text-pink-700',
  manejo_bezerros:    'bg-orange-50 text-orange-700',
  abate:              'bg-red-50 text-red-700',
  venda:              'bg-purple-50 text-purple-700',
  desagrupamento:     'bg-cyan-50 text-cyan-700',
  ajuste_quantidade:  'bg-gray-100 text-gray-600',
};

/* ── Histórico compartilhado ── */

function HistoricoTable({ events, loading }: { events: ManejoEvent[]; loading: boolean }) {
  if (loading) return <SkeletonTable rows={4} cols={3} />;
  if (events.length === 0) return (
    <div className="text-center py-10 text-gray-400">
      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">Nenhum evento registrado ainda.</p>
    </div>
  );
  return (
    <div className="divide-y divide-gray-100">
      {events.map(e => (
        <div key={e.id} className="flex items-start gap-3 py-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${TIPO_COLORS[e.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
            {TIPO_LABELS[e.tipo] ?? e.tipo}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 leading-relaxed">{e.descricao}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(e.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 1 — Lotes por Pasto
══════════════════════════════════════════════════════════════ */

function LotesTab({
  animals, pastures, categories, onReload,
}: {
  animals: Animal[]; pastures: Pasture[]; categories: AnimalCategory[];
  onReload: () => void;
}) {
  const [alocarAnimal, setAlocarAnimal] = useState<Animal | null>(null);
  const [pastoSel, setPastoSel] = useState('');
  const [dataAlocacao, setDataAlocacao] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // ── Filter ──
  const [search, setSearch] = useState('');

  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.nome])),
    [categories]
  );
  const pastoMap = useMemo(
    () => Object.fromEntries(pastures.map(p => [p.id, p.nome])),
    [pastures]
  );

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);

  // Search filter on active animals
  const ativosFiltrados = useMemo(() => {
    if (!search.trim()) return ativos;
    const q = search.toLowerCase();
    return ativos.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      (a.categoria_id && (catMap[a.categoria_id] ?? '').toLowerCase().includes(q))
    );
  }, [ativos, search, catMap]);

  const byPasto = useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const a of ativosFiltrados) {
      if (a.pasto_id) {
        map[a.pasto_id] = [...(map[a.pasto_id] ?? []), a];
      }
    }
    return map;
  }, [ativosFiltrados]);

  const semPasto = ativosFiltrados.filter(a => !a.pasto_id);
  const pastosComLotes = pastures.filter(p => byPasto[p.id]?.length);

  // ── Somatória global da fazenda ──
  const globalStats = useMemo(() => {
    const totalHA      = pastosComLotes.reduce((s, p) => s + (p.area ?? 0), 0);
    const totalLotes   = pastosComLotes.length;
    const totalCab     = ativos.reduce((s, a) => s + a.quantidade, 0);
    const pesoNum      = ativos.reduce((s, a) => s + a.quantidade * (a.peso_medio ?? 0), 0);
    const pesoDen      = ativos.filter(a => a.peso_medio).reduce((s, a) => s + a.quantidade, 0);
    const pesoMedio    = pesoDen > 0 ? pesoNum / pesoDen : null;
    const totalBez     = ativos.reduce((s, a) => s + (a.bezerros_quantidade ?? 0), 0);
    const bezPesoNum   = ativos.reduce((s, a) => s + (a.bezerros_quantidade ?? 0) * (a.bezerros_peso_medio ?? 0), 0);
    const bezPesoDen   = ativos.filter(a => a.bezerros_quantidade && a.bezerros_peso_medio).reduce((s, a) => s + (a.bezerros_quantidade ?? 0), 0);
    const bezPesoMedio = bezPesoDen > 0 ? bezPesoNum / bezPesoDen : null;
    return { totalHA, totalLotes, totalCab, pesoMedio, totalBez, bezPesoMedio };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastosComLotes, animals]);

  async function confirmarAlocacao() {
    if (!alocarAnimal || !pastoSel) return;
    setSaving(true);
    try {
      await manejoService.alocarPasto(alocarAnimal, pastoSel, pastoMap[pastoSel] ?? pastoSel, dataAlocacao);
      toast.success(`Lote "${alocarAnimal.nome}" alocado!`);
      setAlocarAnimal(null);
      setDataAlocacao(new Date().toISOString().split('T')[0]);
      onReload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alocar lote.');
    } finally {
      setSaving(false);
    }
  }

  function AnimalRow({ a }: { a: Animal }) {
    return (
      <>
        <tr className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">{a.nome}</td>
          <td className="px-4 py-2.5 text-xs text-gray-600">{a.categoria_id ? catMap[a.categoria_id] ?? '—' : '—'}</td>
          <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: '#1a6040' }}>{a.quantidade.toLocaleString('pt-BR')}</td>
          <td className="px-4 py-2.5 text-xs text-gray-600">{a.peso_medio ? `${a.peso_medio} kg` : '—'}</td>
          <td className="px-4 py-2.5 text-xs text-gray-500">{a.sexo ?? '—'}</td>
          <td className="px-4 py-2.5">
            <button
              onClick={() => { setAlocarAnimal(a); setPastoSel(a.pasto_id ?? ''); }}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {a.pasto_id ? 'Mover' : 'Alocar'}
            </button>
          </td>
        </tr>
        {(a.bezerros_quantidade ?? 0) > 0 && (
          <tr className="bg-orange-50/60">
            <td className="pl-8 pr-4 py-1.5 text-xs text-orange-700 italic">↳ Bezerros</td>
            <td className="px-4 py-1.5 text-xs text-orange-600">—</td>
            <td className="px-4 py-1.5 text-xs font-semibold text-orange-700">{a.bezerros_quantidade!.toLocaleString('pt-BR')}</td>
            <td className="px-4 py-1.5 text-xs text-orange-600">{a.bezerros_peso_medio ? `${a.bezerros_peso_medio} kg` : '—'}</td>
            <td colSpan={2} />
          </tr>
        )}
      </>
    );
  }

  function TableWrap({ children }: { children: React.ReactNode }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Lote', 'Categoria', 'Cabeças', 'Peso Médio', 'Sexo', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">{children}</tbody>
          </table>
        </div>
      </div>
    );
  }

  if (ativos.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
      <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Nenhum lote ativo cadastrado</p>
      <p className="text-xs text-gray-400 mt-1">Cadastre lotes em Cadastros → Animais</p>
    </div>
  );

  return (
    <>
      {/* Toolbar: search + Histórico */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar lotes por nome ou categoria…"
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {ativosFiltrados.length} lote{ativosFiltrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Header global da fazenda ── */}
      <div className="rounded-xl border p-4 mb-6 flex flex-wrap gap-6"
        style={{ background: 'linear-gradient(135deg,#1a6040,#0f4a30)', borderColor: '#1a6040' }}>
        <div className="text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Área Total</p>
          <p className="text-2xl font-bold">{globalStats.totalHA > 0 ? `${globalStats.totalHA.toLocaleString('pt-BR')} ha` : '—'}</p>
        </div>
        <div className="text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">N° Pastos</p>
          <p className="text-2xl font-bold">{globalStats.totalLotes}</p>
        </div>
        <div className="text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Quantidade</p>
          <p className="text-2xl font-bold">{globalStats.totalCab.toLocaleString('pt-BR')} cab.</p>
        </div>
        <div className="text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Peso Médio Ponderado</p>
          <p className="text-2xl font-bold">{globalStats.pesoMedio != null ? `${globalStats.pesoMedio.toFixed(0)} kg` : '—'}</p>
        </div>
        {globalStats.totalBez > 0 && (
          <div className="text-white border-l border-white/20 pl-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Bezerros</p>
            <p className="text-2xl font-bold">{globalStats.totalBez.toLocaleString('pt-BR')} cab.</p>
            {globalStats.bezPesoMedio != null && (
              <p className="text-xs opacity-70 mt-0.5">{globalStats.bezPesoMedio.toFixed(0)} kg/cab</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {pastosComLotes.map(p => {
          const animaisPasto = byPasto[p.id];
          const totalCabPasto = animaisPasto.reduce((s, a) => s + a.quantidade, 0);
          const pesoNum = animaisPasto.reduce((s, a) => s + a.quantidade * (a.peso_medio ?? 0), 0);
          const pesoDen = animaisPasto.filter(a => a.peso_medio).reduce((s, a) => s + a.quantidade, 0);
          const pesoMedioPasto = pesoDen > 0 ? pesoNum / pesoDen : null;
          return (
          <section key={p.id}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <h3 className="font-semibold text-gray-800">{p.nome}</h3>
              {p.area && <span className="text-xs text-gray-400">· {p.area} ha</span>}
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {totalCabPasto.toLocaleString('pt-BR')} cab.
                </span>
                {pesoMedioPasto != null && (
                  <span className="text-xs bg-teal-50 px-2 py-0.5 rounded-full font-semibold" style={{ color: '#1a6040' }}>
                    {pesoMedioPasto.toFixed(0)} kg/cab
                  </span>
                )}
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                  {animaisPasto.length} lote{animaisPasto.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <TableWrap>
              {animaisPasto.map(a => <AnimalRow key={a.id} a={a} />)}
            </TableWrap>
          </section>
          );
        })}

        {semPasto.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <h3 className="font-semibold text-gray-700">Não alocados</h3>
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full ml-auto">
                {semPasto.length} lote{semPasto.length !== 1 ? 's' : ''}
              </span>
            </div>
            <TableWrap>
              {semPasto.map(a => <AnimalRow key={a.id} a={a} />)}
            </TableWrap>
          </section>
        )}
      </div>

      {/* Modal alocar */}
      <AnimatePresence>
        {alocarAnimal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAlocarAnimal(null)} />
            <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Alocar Lote</h3>
                <button onClick={() => setAlocarAnimal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={labelClass}>Lote</label>
                  <p className="text-sm font-semibold text-gray-900">{alocarAnimal.nome}</p>
                  <p className="text-xs text-gray-500">{alocarAnimal.quantidade} cabeças</p>
                </div>
                <div>
                  <label className={labelClass}>Pasto destino</label>
                  <div className="relative">
                    <select value={pastoSel} onChange={e => setPastoSel(e.target.value)} className={selectClass}>
                      <option value="">— Remover do pasto —</option>
                      {pastures.filter(p => p.id !== alocarAnimal.pasto_id).map(p => (
                        <option key={p.id} value={p.id}>{p.nome}{p.area ? ` (${p.area} ha)` : ''}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Data</label>
                  <input type="date" value={dataAlocacao} onChange={e => setDataAlocacao(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button onClick={() => setAlocarAnimal(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-white transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmarAlocacao} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — Transferir Lote
══════════════════════════════════════════════════════════════ */

function TransferirTab({
  animals, pastures, farmId, onReload,
}: {
  animals: Animal[]; pastures: Pasture[]; farmId: string; onReload: () => void;
}) {
  const [loteId, setLoteId]       = useState('');
  const [destId, setDestId]       = useState('');
  const [obs, setObs]             = useState('');
  const [data, setData]           = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving]       = useState(false);
  const [events, setEvents]       = useState<ManejoEvent[]>([]);
  const [loadingH, setLoadingH]   = useState(true);

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);
  const pastoMap = useMemo(() => Object.fromEntries(pastures.map(p => [p.id, p.nome])), [pastures]);
  const lote = ativos.find(a => a.id === loteId);

  useEffect(() => {
    setLoadingH(true);
    manejoService.listarHistorico(farmId, 'transferencia', 20)
      .then(setEvents).catch(() => {}).finally(() => setLoadingH(false));
  }, [farmId]);

  async function confirmar() {
    if (!lote || !destId) { toast.error('Selecione o lote e o pasto de destino.'); return; }
    if (lote.pasto_id === destId) { toast.error('O lote já está neste pasto.'); return; }
    setSaving(true);
    try {
      const origemNome = lote.pasto_id ? (pastoMap[lote.pasto_id] ?? 'sem pasto') : 'sem pasto';
      const destNome   = pastoMap[destId] ?? destId;
      await manejoService.transferir(lote, destId, origemNome, destNome, data, obs || undefined);
      toast.success(`"${lote.nome}" transferido para ${destNome}!`);
      setLoteId(''); setDestId(''); setObs(''); setData(new Date().toISOString().split('T')[0]);
      onReload();
      const updated = await manejoService.listarHistorico(farmId, 'transferencia', 20);
      setEvents(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao transferir.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight className="w-4 h-4 text-teal-600" />
          <h3 className="font-semibold text-gray-900">Transferir lote</h3>
        </div>

        <div>
          <label className={labelClass}>Lote</label>
          <div className="relative">
            <select value={loteId} onChange={e => { setLoteId(e.target.value); setDestId(''); }} className={selectClass}>
              <option value="">Selecione um lote…</option>
              {ativos.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.quantidade} cab.) {a.pasto_id ? `· ${pastoMap[a.pasto_id] ?? ''}` : '· sem pasto'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {lote && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>Pasto atual: <strong>{lote.pasto_id ? (pastoMap[lote.pasto_id] ?? '—') : 'Não alocado'}</strong></span>
          </div>
        )}

        <div>
          <label className={labelClass}>Pasto de destino</label>
          <div className="relative">
            <select value={destId} onChange={e => setDestId(e.target.value)} className={selectClass} disabled={!loteId}>
              <option value="">Selecione o destino…</option>
              {pastures.filter(p => p.id !== lote?.pasto_id).map(p => (
                <option key={p.id} value={p.id}>{p.nome}{p.area ? ` (${p.area} ha)` : ''}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Data da transferência</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Observação (opcional)</label>
          <input type="text" value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: transferência por superlotação"
            className={inputClass} />
        </div>

        <button onClick={confirmar} disabled={saving || !loteId || !destId}
          className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <ArrowRight className="w-4 h-4" />
          {saving ? 'Transferindo...' : 'Confirmar Transferência'}
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-700 text-sm">Histórico de transferências</h3>
        </div>
        <HistoricoTable events={events} loading={loadingH} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 3 — Evolução (Categoria · Parição · Bezerros)
══════════════════════════════════════════════════════════════ */

type SubOp = 'categoria' | 'paricao' | 'bezerros';
type DestinoTipo = 'existente' | 'novo';

function EvolucaoTab({
  animals, categories, farmId, onReload,
}: {
  animals: Animal[]; categories: AnimalCategory[]; farmId: string; onReload: () => void;
}) {
  const [subOp, setSubOp]         = useState<SubOp>('categoria');
  const [saving, setSaving]       = useState(false);
  const [events, setEvents]       = useState<ManejoEvent[]>([]);
  const [loadingH, setLoadingH]   = useState(true);

  /* ── Categoria ── */
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [novaCatId, setNovaCatId] = useState('');
  const [catPeso, setCatPeso]     = useState('');
  const [catData, setCatData]     = useState(() => new Date().toISOString().split('T')[0]);

  /* ── Parição ── */
  const [parLoteMaeId, setParLoteMaeId]   = useState('');
  const [parQtd, setParQtd]               = useState('');
  const [parPeso, setParPeso]             = useState('');
  const [parData, setParData]             = useState(() => new Date().toISOString().split('T')[0]);
  const [parDestino, setParDestino]       = useState<DestinoTipo>('novo');
  const [parLoteDestId, setParLoteDestId] = useState('');
  const [parNovoNome, setParNovoNome]     = useState('');
  const [parNovoCatId, setParNovoCatId]   = useState('');

  /* ── Bezerros ── */
  const [bezLoteId, setBezLoteId]         = useState('');
  const [bezQtd, setBezQtd]               = useState('');
  const [bezPeso, setBezPeso]             = useState('');
  const [bezData, setBezData]             = useState(() => new Date().toISOString().split('T')[0]);
  const [bezDestino, setBezDestino]       = useState<DestinoTipo>('novo');
  const [bezLoteDestId, setBezLoteDestId] = useState('');
  const [bezNovoNome, setBezNovoNome]     = useState('');
  const [bezNovoCatId, setBezNovoCatId]   = useState('');

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.nome])), [categories]);

  const EVOLUCAO_TIPOS = ['evolucao_categoria', 'paricao', 'manejo_bezerros'];

  useEffect(() => {
    setLoadingH(true);
    manejoService.listarHistorico(farmId, EVOLUCAO_TIPOS, 30)
      .then(setEvents).catch(() => {}).finally(() => setLoadingH(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function reloadHistorico() {
    const updated = await manejoService.listarHistorico(farmId, EVOLUCAO_TIPOS, 30);
    setEvents(updated);
  }

  /* checkboxes */
  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const selectedAnimals = ativos.filter(a => selected.has(a.id));
  const totalCab = selectedAnimals.reduce((s, a) => s + a.quantidade, 0);

  /* ── Confirmar: Categoria ── */
  async function confirmarCategoria() {
    if (selected.size === 0) { toast.error('Selecione pelo menos um lote.'); return; }
    if (!novaCatId) { toast.error('Selecione a nova categoria.'); return; }
    const catOrigemNomes = [...new Set(selectedAnimals.map(a => a.categoria_id ? (catMap[a.categoria_id] ?? 'sem categoria') : 'sem categoria'))].join(', ');
    setSaving(true);
    try {
      await manejoService.evoluirCategorias(selectedAnimals, novaCatId, catOrigemNomes, catMap[novaCatId] ?? novaCatId, catPeso ? Number(catPeso) : undefined, catData);
      toast.success(`${selected.size} lote(s) evoluído(s) para ${catMap[novaCatId]}!`);
      setSelected(new Set()); setNovaCatId(''); setCatPeso(''); setCatData(new Date().toISOString().split('T')[0]);
      onReload(); await reloadHistorico();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro.'); }
    finally { setSaving(false); }
  }

  /* ── Confirmar: Parição ── */
  async function confirmarParicao() {
    if (!parLoteMaeId) { toast.error('Selecione o lote mãe.'); return; }
    if (!parQtd || Number(parQtd) <= 0) { toast.error('Informe a quantidade de partos.'); return; }
    if (parDestino === 'existente' && !parLoteDestId) { toast.error('Selecione o lote de destino.'); return; }
    if (parDestino === 'novo' && !parNovoNome.trim()) { toast.error('Informe o nome do novo lote.'); return; }
    const loteMae = ativos.find(a => a.id === parLoteMaeId)!;
    setSaving(true);
    try {
      await manejoService.registrarParicao({
        loteMae, qtdPartos: Number(parQtd),
        pesoMedio: parPeso ? Number(parPeso) : undefined,
        data: parData,
        destino: parDestino === 'existente'
          ? { tipo: 'existente', loteId: parLoteDestId }
          : { tipo: 'novo', nome: parNovoNome.trim(), categoriaId: parNovoCatId || undefined },
        farmId,
        loteDestinoNome: parDestino === 'existente' ? (ativos.find(a => a.id === parLoteDestId)?.nome ?? '') : undefined,
      });
      toast.success(`Parição registrada: ${parQtd} bezerro(s)!`);
      setParLoteMaeId(''); setParQtd(''); setParPeso(''); setParLoteDestId(''); setParNovoNome(''); setParNovoCatId(''); setParDestino('novo');
      onReload(); await reloadHistorico();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro.'); }
    finally { setSaving(false); }
  }

  /* ── Confirmar: Bezerros ── */
  async function confirmarBezerros() {
    if (!bezLoteId) { toast.error('Selecione o lote de origem.'); return; }
    if (!bezQtd || Number(bezQtd) <= 0) { toast.error('Informe a quantidade de bezerros.'); return; }
    if (bezDestino === 'existente' && !bezLoteDestId) { toast.error('Selecione o lote de destino.'); return; }
    if (bezDestino === 'novo' && !bezNovoNome.trim()) { toast.error('Informe o nome do novo lote.'); return; }
    const loteOrigem = ativos.find(a => a.id === bezLoteId)!;
    setSaving(true);
    try {
      await manejoService.manejarBezerros({
        loteOrigem, qtdBezerros: Number(bezQtd),
        pesoMedio: bezPeso ? Number(bezPeso) : undefined,
        data: bezData,
        destino: bezDestino === 'existente'
          ? { tipo: 'existente', loteId: bezLoteDestId }
          : { tipo: 'novo', nome: bezNovoNome.trim(), categoriaId: bezNovoCatId || undefined },
        farmId,
        loteDestinoNome: bezDestino === 'existente' ? (ativos.find(a => a.id === bezLoteDestId)?.nome ?? '') : undefined,
      });
      toast.success(`Desmama registrada: ${bezQtd} cab.!`);
      setBezLoteId(''); setBezQtd(''); setBezPeso(''); setBezLoteDestId(''); setBezNovoNome(''); setBezNovoCatId(''); setBezDestino('novo');
      onReload(); await reloadHistorico();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro.'); }
    finally { setSaving(false); }
  }

  /* ── helper: seletor de destino (reutilizado em Parição e Bezerros) ── */
  function DestinoSelector({ destino, setDestino, loteDestId, setLoteDestId, novoNome, setNovoNome, novoCatId, setNovoCatId, excludeId }: {
    destino: DestinoTipo; setDestino: (v: DestinoTipo) => void;
    loteDestId: string; setLoteDestId: (v: string) => void;
    novoNome: string; setNovoNome: (v: string) => void;
    novoCatId: string; setNovoCatId: (v: string) => void;
    excludeId?: string;
  }) {
    return (
      <div className="space-y-3">
        <label className={labelClass}>Destino dos bezerros</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button type="button" onClick={() => setDestino('novo')}
            className={`flex-1 px-3 py-2 transition-colors ${destino === 'novo' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            Criar novo lote
          </button>
          <button type="button" onClick={() => setDestino('existente')}
            className={`flex-1 px-3 py-2 border-l border-gray-200 transition-colors ${destino === 'existente' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            Agregar em lote existente
          </button>
        </div>
        {destino === 'existente' ? (
          <div className="relative">
            <select value={loteDestId} onChange={e => setLoteDestId(e.target.value)} className={selectClass}>
              <option value="">Selecione o lote…</option>
              {ativos.filter(a => a.id !== excludeId).map(a => (
                <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.{a.categoria_id ? ` · ${catMap[a.categoria_id] ?? ''}` : ''}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          <div className="space-y-2">
            <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome do novo lote (ex: Bezerros Jan/26)"
              className={inputClass} />
            <div className="relative">
              <select value={novoCatId} onChange={e => setNovoCatId(e.target.value)} className={selectClass}>
                <option value="">Categoria (opcional)…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const SUB_OPS = [
    { id: 'categoria' as SubOp, label: 'Categoria',  icon: TrendingUp },
    { id: 'paricao'   as SubOp, label: 'Parição',    icon: Baby },
    { id: 'bezerros'  as SubOp, label: 'Desmama',    icon: Milk },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-4">
        {/* Seletor de sub-operação */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {SUB_OPS.map(s => {
            const Icon = s.icon;
            const active = subOp === s.id;
            return (
              <button key={s.id} onClick={() => setSubOp(s.id)}
                className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ── Sub-op: Categoria ── */}
        {subOp === 'categoria' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">Selecione os lotes</h3>
                </div>
                {selected.size > 0 && (
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                    {selected.size} sel. · {totalCab} cab.
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {ativos.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400">Nenhum lote ativo.</p>
                ) : ativos.map(a => {
                  const on = selected.has(a.id);
                  return (
                    <label key={a.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${on ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                        {on && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input type="checkbox" checked={on} onChange={() => toggle(a.id)} className="sr-only" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.nome}</p>
                        <p className="text-xs text-gray-500">{a.categoria_id ? catMap[a.categoria_id] : 'sem categoria'} · {a.quantidade} cab.</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div>
                <label className={labelClass}>Nova categoria</label>
                <div className="relative">
                  <select value={novaCatId} onChange={e => setNovaCatId(e.target.value)} className={selectClass}>
                    <option value="">Selecione…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Novo peso médio (opcional)</label>
                <input type="number" min="0" step="0.1" value={catPeso} onChange={e => setCatPeso(e.target.value)} placeholder="Ex: 220 kg" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data da evolução</label>
                <input type="date" value={catData} onChange={e => setCatData(e.target.value)} className={inputClass} />
              </div>
              <button onClick={confirmarCategoria} disabled={saving || selected.size === 0 || !novaCatId}
                className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <TrendingUp className="w-4 h-4" />
                {saving ? 'Salvando...' : `Evoluir ${selected.size > 0 ? `${selected.size} lote(s) · ${totalCab} cab.` : 'selecionados'}`}
              </button>
            </div>
          </>
        )}

        {/* ── Sub-op: Parição ── */}
        {subOp === 'paricao' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Baby className="w-4 h-4 text-pink-500" />
              <h3 className="font-semibold text-gray-900">Registrar parição</h3>
            </div>
            <div>
              <label className={labelClass}>Lote mãe</label>
              <div className="relative">
                <select value={parLoteMaeId} onChange={e => setParLoteMaeId(e.target.value)} className={selectClass}>
                  <option value="">Selecione o lote…</option>
                  {ativos.map(a => <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.{a.categoria_id ? ` · ${catMap[a.categoria_id] ?? ''}` : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Qtd. de partos</label>
                <input type="number" min="1" value={parQtd} onChange={e => setParQtd(e.target.value)} placeholder="Ex: 12" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Peso médio bezerros (kg)</label>
                <input type="number" min="0" step="0.1" value={parPeso} onChange={e => setParPeso(e.target.value)} placeholder="Ex: 28" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input type="date" value={parData} onChange={e => setParData(e.target.value)} className={inputClass} />
            </div>
            <DestinoSelector
              destino={parDestino} setDestino={setParDestino}
              loteDestId={parLoteDestId} setLoteDestId={setParLoteDestId}
              novoNome={parNovoNome} setNovoNome={setParNovoNome}
              novoCatId={parNovoCatId} setNovoCatId={setParNovoCatId}
              excludeId={parLoteMaeId}
            />
            <button onClick={confirmarParicao} disabled={saving || !parLoteMaeId || !parQtd}
              className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Baby className="w-4 h-4" />
              {saving ? 'Registrando...' : 'Confirmar Parição'}
            </button>
          </div>
        )}

        {/* ── Sub-op: Bezerros ── */}
        {subOp === 'bezerros' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Milk className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Desmama</h3>
            </div>
            <div>
              <label className={labelClass}>Lote de origem</label>
              <div className="relative">
                <select value={bezLoteId} onChange={e => setBezLoteId(e.target.value)} className={selectClass}>
                  <option value="">Selecione o lote…</option>
                  {ativos.map(a => <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.{a.categoria_id ? ` · ${catMap[a.categoria_id] ?? ''}` : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              {bezLoteId && (() => {
                const loteSel = ativos.find(a => a.id === bezLoteId);
                return loteSel?.bezerros_quantidade ? (
                  <p className="text-xs mt-1 font-medium" style={{ color: '#1a6040' }}>
                    Bezerros disponíveis: {loteSel.bezerros_quantidade} cab.
                  </p>
                ) : null;
              })()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Qtd. de bezerros</label>
                <input type="number" min="1" value={bezQtd} onChange={e => setBezQtd(e.target.value)} placeholder="Ex: 20" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Peso médio (kg)</label>
                <input type="number" min="0" step="0.1" value={bezPeso} onChange={e => setBezPeso(e.target.value)} placeholder="Ex: 95" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input type="date" value={bezData} onChange={e => setBezData(e.target.value)} className={inputClass} />
            </div>
            <DestinoSelector
              destino={bezDestino} setDestino={setBezDestino}
              loteDestId={bezLoteDestId} setLoteDestId={setBezLoteDestId}
              novoNome={bezNovoNome} setNovoNome={setBezNovoNome}
              novoCatId={bezNovoCatId} setNovoCatId={setBezNovoCatId}
              excludeId={bezLoteId}
            />
            <button onClick={confirmarBezerros} disabled={saving || !bezLoteId || !bezQtd}
              className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Milk className="w-4 h-4" />
              {saving ? 'Registrando...' : 'Confirmar Desmama'}
            </button>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-700 text-sm">Histórico de evoluções</h3>
        </div>
        <HistoricoTable events={events} loading={loadingH} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 4 — Abate
══════════════════════════════════════════════════════════════ */

type TipoSaida = 'abate' | 'venda' | 'desagrupar';

function AbateTab({
  animals, categories, farmId, onReload,
}: {
  animals: Animal[]; categories: AnimalCategory[]; farmId: string; onReload: () => void;
}) {
  const [tipoSaida, setTipoSaida] = useState<TipoSaida>('abate');
  const [loteId, setLoteId]       = useState('');
  const [qtd, setQtd]             = useState('');
  const [peso, setPeso]           = useState('');
  const [dataSaida, setDataSaida] = useState(() => new Date().toISOString().split('T')[0]);
  const [obs, setObs]             = useState('');
  const [saving, setSaving]       = useState(false);
  const [events, setEvents]       = useState<ManejoEvent[]>([]);
  const [loadingH, setLoadingH]   = useState(true);

  /* Desagrupar destino */
  const [desDestino,     setDesDestino]     = useState<DestinoTipo>('novo');
  const [desLoteDestId,  setDesLoteDestId]  = useState('');
  const [desNovoNome,    setDesNovoNome]    = useState('');
  const [desNovoCatId,   setDesNovoCatId]   = useState('');

  const ativos  = animals.filter(a => a.status === 'ativo' || !a.status);
  const lote    = ativos.find(a => a.id === loteId);
  const qtdNum  = Number(qtd);
  const restam  = lote ? lote.quantidade - qtdNum : 0;
  const catMap  = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.nome])), [categories]);

  const SAIDA_TIPOS: { id: TipoSaida; label: string; color: string }[] = [
    { id: 'abate',      label: 'Abate (abatedor)',  color: 'bg-red-600 hover:bg-red-700' },
    { id: 'venda',      label: 'Venda direta',      color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'desagrupar', label: 'Desagrupar bezerros', color: 'bg-cyan-600 hover:bg-cyan-700' },
  ];

  const SAIDA_HISTORICO_TIPOS = ['abate', 'venda', 'desagrupamento'];

  useEffect(() => {
    setLoadingH(true);
    manejoService.listarHistorico(farmId, SAIDA_HISTORICO_TIPOS, 25)
      .then(setEvents).catch(() => {}).finally(() => setLoadingH(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  function resetForm() {
    setLoteId(''); setQtd(''); setPeso(''); setDataSaida(new Date().toISOString().split('T')[0]); setObs('');
    setDesDestino('novo'); setDesLoteDestId(''); setDesNovoNome(''); setDesNovoCatId('');
  }

  async function confirmarSaida() {
    if (!lote) { toast.error('Selecione um lote.'); return; }
    if (!qtd || qtdNum <= 0) { toast.error('Informe a quantidade de cabeças.'); return; }
    if (qtdNum > lote.quantidade) { toast.error(`Máximo ${lote.quantidade} cabeças para este lote.`); return; }
    const encerrar = qtdNum >= lote.quantidade;
    if (encerrar && !window.confirm(`Atenção: isso vai encerrar o lote "${lote.nome}". Confirmar?`)) return;
    setSaving(true);
    try {
      await manejoService.registrarSaida(lote, qtdNum, tipoSaida as 'abate' | 'venda', peso ? Number(peso) : undefined, dataSaida, obs || undefined);
      toast.success(`${TIPO_LABELS[tipoSaida]}: ${qtdNum} cab. registrado!${encerrar ? ' Lote encerrado.' : ''}`);
      resetForm();
      onReload();
      const updated = await manejoService.listarHistorico(farmId, SAIDA_HISTORICO_TIPOS, 25);
      setEvents(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar saída.');
    } finally { setSaving(false); }
  }

  async function confirmarDesagrupar() {
    if (!lote) { toast.error('Selecione o lote de origem.'); return; }
    if (!qtd || qtdNum <= 0) { toast.error('Informe a quantidade de bezerros.'); return; }
    if (qtdNum > lote.quantidade) { toast.error(`Máximo ${lote.quantidade} cabeças.`); return; }
    if (desDestino === 'existente' && !desLoteDestId) { toast.error('Selecione o lote de destino.'); return; }
    if (desDestino === 'novo' && !desNovoNome.trim()) { toast.error('Informe o nome do novo lote.'); return; }
    setSaving(true);
    try {
      await manejoService.desagruparLote({
        loteOrigem: lote, qtd: qtdNum,
        pesoMedio: peso ? Number(peso) : undefined,
        data: dataSaida,
        destino: desDestino === 'existente'
          ? { tipo: 'existente', loteId: desLoteDestId }
          : { tipo: 'novo', nome: desNovoNome.trim(), categoriaId: desNovoCatId || undefined },
        farmId,
        loteDestinoNome: desDestino === 'existente' ? (ativos.find(a => a.id === desLoteDestId)?.nome ?? '') : undefined,
      });
      toast.success(`Desagrupamento de ${qtdNum} cab. registrado!`);
      resetForm();
      onReload();
      const updated = await manejoService.listarHistorico(farmId, SAIDA_HISTORICO_TIPOS, 25);
      setEvents(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao desagrupar.');
    } finally { setSaving(false); }
  }

  const activeColor = SAIDA_TIPOS.find(t => t.id === tipoSaida)?.color ?? 'bg-red-600';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-4">
        {/* Seletor de tipo */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {SAIDA_TIPOS.map(t => {
            const active = tipoSaida === t.id;
            return (
              <button key={t.id} onClick={() => { setTipoSaida(t.id); setLoteId(''); setQtd(''); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active ? t.color + ' text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {tipoSaida === 'abate' ? 'Abate (venda para abatedor)' :
               tipoSaida === 'venda' ? 'Venda direta' :
               'Desagrupar bezerros do lote'}
            </h3>
          </div>

          <div>
            <label className={labelClass}>Lote de origem</label>
            <div className="relative">
              <select value={loteId} onChange={e => { setLoteId(e.target.value); setQtd(''); }} className={selectClass}>
                <option value="">Selecione um lote…</option>
                {ativos.map(a => <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.{a.categoria_id ? ` · ${catMap[a.categoria_id] ?? ''}` : ''}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {tipoSaida === 'desagrupar' ? 'Qtd. bezerros' : 'Cabeças'}
              </label>
              <input type="number" min="1" max={lote?.quantidade}
                value={qtd} onChange={e => setQtd(e.target.value)}
                placeholder={lote ? `Máx. ${lote.quantidade}` : '0'}
                className={inputClass} disabled={!loteId} />
              {lote && qtdNum > 0 && tipoSaida !== 'desagrupar' && (
                <p className={`text-xs mt-1 font-medium ${restam <= 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {restam <= 0 ? '⚠ Lote será encerrado' : `Restam ${restam} cab.`}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Peso médio (opcional)</label>
              <input type="number" min="0" step="0.1"
                value={peso} onChange={e => setPeso(e.target.value)}
                placeholder="kg" className={inputClass} disabled={!loteId} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Data</label>
            <input type="date" value={dataSaida} onChange={e => setDataSaida(e.target.value)}
              className={inputClass} disabled={!loteId} />
          </div>

          {tipoSaida !== 'desagrupar' && (
            <div>
              <label className={labelClass}>Observação (opcional)</label>
              <input type="text" value={obs} onChange={e => setObs(e.target.value)}
                placeholder="Ex: Saída programada — março/26"
                className={inputClass} disabled={!loteId} />
            </div>
          )}

          {/* Destino para desagrupar */}
          {tipoSaida === 'desagrupar' && (
            <div className="space-y-3">
              <label className={labelClass}>Destino dos bezerros</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button type="button" onClick={() => setDesDestino('novo')}
                  className={`flex-1 px-3 py-2 transition-colors ${desDestino === 'novo' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  Criar novo lote
                </button>
                <button type="button" onClick={() => setDesDestino('existente')}
                  className={`flex-1 px-3 py-2 border-l border-gray-200 transition-colors ${desDestino === 'existente' ? 'bg-cyan-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  Agregar em lote existente
                </button>
              </div>
              {desDestino === 'existente' ? (
                <div className="relative">
                  <select value={desLoteDestId} onChange={e => setDesLoteDestId(e.target.value)} className={selectClass}>
                    <option value="">Selecione o lote…</option>
                    {ativos.filter(a => a.id !== loteId).map(a => (
                      <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.{a.categoria_id ? ` · ${catMap[a.categoria_id] ?? ''}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="text" value={desNovoNome} onChange={e => setDesNovoNome(e.target.value)}
                    placeholder="Nome do novo lote (ex: Bezerros Mar/26)"
                    className={inputClass} />
                  <div className="relative">
                    <select value={desNovoCatId} onChange={e => setDesNovoCatId(e.target.value)} className={selectClass}>
                      <option value="">Categoria (opcional)…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={tipoSaida === 'desagrupar' ? confirmarDesagrupar : confirmarSaida}
            disabled={saving || !loteId || !qtd || qtdNum <= 0}
            className={`flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeColor}`}>
            <Scissors className="w-4 h-4" />
            {saving ? 'Registrando...' : `Confirmar ${TIPO_LABELS[tipoSaida] ?? 'Saída'}`}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-700 text-sm">Histórico de saídas</h3>
        </div>
        <HistoricoTable events={events} loading={loadingH} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   TAB 5 — Histórico Completo
══════════════════════════════════════════════════════════════ */

function HistoricoTab({ farmId, animals, pastures }: {
  farmId: string; animals: Animal[]; pastures: Pasture[];
}) {
  const today      = new Date().toISOString().split('T')[0];
  const fom        = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(fom);
  const [dataFim,    setDataFim]    = useState(today);
  const [tiposSel,   setTiposSel]   = useState<string[]>([]);
  const [pastoFiltro, setPastoFiltro] = useState('');
  const [events,     setEvents]     = useState<ManejoEvent[]>([]);
  const [loading,    setLoading]    = useState(true);

  // animal_id → pasto_id (current)
  const animalPastoMap = useMemo(
    () => Object.fromEntries(animals.filter(a => a.pasto_id).map(a => [a.id, a.pasto_id!])),
    [animals]
  );

  // Last 12 months as quick chips
  const monthChips = useMemo(() => {
    const chips: { label: string; start: string; end: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const start = d.toISOString().split('T')[0];
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      chips.push({ label, start, end });
    }
    return chips;
  }, []);

  useEffect(() => {
    if (!farmId) return;
    setLoading(true);
    manejoService.listarHistorico(farmId, undefined, 500)
      .then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, [farmId]);

  const filtered = useMemo(() =>
    events.filter(e => {
      const d = e.created_at.split('T')[0];
      const inRange = d >= dataInicio && d <= dataFim;
      const inType  = tiposSel.length === 0 || tiposSel.includes(e.tipo);
      const inPasto = !pastoFiltro ||
        e.pasto_origem === pastoFiltro ||
        e.pasto_destino === pastoFiltro ||
        animalPastoMap[e.animal_id] === pastoFiltro;
      return inRange && inType && inPasto;
    }),
  [events, dataInicio, dataFim, tiposSel, pastoFiltro, animalPastoMap]);

  function toggleTipo(tipo: string) {
    setTiposSel(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
  }

  const fmtPrintDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div>
      {/* ── Filters (hidden on print) ── */}
      <div className="no-print space-y-4 mb-6">

        {/* Period card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-gray-800">Período</h3>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm">
              <FileText className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>

          {/* Month chips */}
          <div className="flex flex-wrap gap-1.5">
            {monthChips.map(chip => {
              const active = dataInicio === chip.start && dataFim === chip.end;
              return (
                <button key={chip.start}
                  onClick={() => { setDataInicio(chip.start); setDataFim(chip.end); }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors capitalize ${
                    active
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600 bg-white'
                  }`}>
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={labelClass}>De</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Até</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Tipo:</span>
          <button onClick={() => setTiposSel([])}
            className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
              tiposSel.length === 0
                ? 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
            }`}>
            Todos
          </button>
          {Object.keys(TIPO_LABELS).map(tipo => {
            const sel = tiposSel.includes(tipo);
            return (
              <button key={tipo} onClick={() => toggleTipo(tipo)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
                  sel
                    ? TIPO_COLORS[tipo] + ' border-current'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}>
                {TIPO_LABELS[tipo]}
              </button>
            );
          })}
        </div>

        {/* Pasture filter — select */}
        {pastures.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Pasto:</label>
            <div className="relative flex-1 max-w-xs">
              <select
                value={pastoFiltro}
                onChange={e => setPastoFiltro(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none transition-colors"
              >
                <option value="">Todos os pastos</option>
                {pastures.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}{p.area ? ` (${p.area} ha)` : ''}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            {pastoFiltro && (
              <button onClick={() => setPastoFiltro('')}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors flex-shrink-0">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Print-only header ── */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Manejos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Período: {fmtPrintDate(dataInicio)} a {fmtPrintDate(dataFim)}
          {tiposSel.length > 0 && ` · ${tiposSel.map(t => TIPO_LABELS[t]).join(', ')}`}
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-2 mb-4 no-print">
        <span className="text-sm text-gray-500">
          <strong className="text-gray-900">{filtered.length}</strong>{' '}
          evento{filtered.length !== 1 ? 's' : ''} no período
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={3} />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum evento neste período</p>
            <p className="text-xs text-gray-400 mt-1">Tente ampliar o intervalo de datas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">Data / Hora</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-28">Tipo</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(e.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_LABELS[e.tipo] ?? e.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 leading-relaxed">{e.descricao ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── tabs ── */

type Tab = 'lotes' | 'transferir' | 'evolucao' | 'abate' | 'historico';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'lotes',     label: 'Lotes por Pasto',    icon: MapPin },
  { id: 'transferir',label: 'Transferir',          icon: ArrowRight },
  { id: 'evolucao',  label: 'Evolução',            icon: TrendingUp },
  { id: 'abate',     label: 'Saída',               icon: Scissors },
  { id: 'historico', label: 'Histórico',           icon: History },
];

export function Manejos() {
  const { activeFarmId, pastures } = useData();
  const [tab, setTab]             = useState<Tab>('lotes');
  const [animals, setAnimals]     = useState<Animal[]>([]);
  const [categories, setCategories] = useState<AnimalCategory[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!activeFarmId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      manejoService.listarAnimais(activeFarmId),
      manejoService.listarCategorias(activeFarmId),
    ]).then(([a, c]) => {
      setAnimals(a);
      setCategories(c);
    }).catch(() => {
      toast.error('Erro ao carregar dados de manejos.');
    }).finally(() => setLoading(false));
  }, [activeFarmId, refreshTick]);

  function reload() { setRefreshTick(t => t + 1); }

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
            <h1 className="text-3xl font-bold text-gray-900">Manejos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ativos.length} lote{ativos.length !== 1 ? 's' : ''} ativo{ativos.length !== 1 ? 's' : ''}
              {' '}· {ativos.reduce((s, a) => s + a.quantidade, 0).toLocaleString('pt-BR')} cabeças
            </p>
          </div>
          <button onClick={reload}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-white hover:text-teal-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : !activeFarmId ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Selecione uma fazenda para ver os manejos.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {tab === 'lotes' && (
                <LotesTab animals={animals} pastures={pastures} categories={categories}
                  onReload={reload} />
              )}
              {tab === 'transferir' && (
                <TransferirTab animals={animals} pastures={pastures}
                  farmId={activeFarmId} onReload={reload} />
              )}
              {tab === 'evolucao' && (
                <EvolucaoTab animals={animals} categories={categories}
                  farmId={activeFarmId} onReload={reload} />
              )}
              {tab === 'abate' && (
                <AbateTab animals={animals} categories={categories} farmId={activeFarmId} onReload={reload} />
              )}
              {tab === 'historico' && (
                <HistoricoTab farmId={activeFarmId} animals={animals} pastures={pastures} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
