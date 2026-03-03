import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, MapPin, ArrowRight, TrendingUp, Scissors,
  X, Save, RefreshCw, ChevronDown, AlertTriangle, History,
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
  abate:              'Saída',
  ajuste_quantidade:  'Ajuste',
};
const TIPO_COLORS: Record<string, string> = {
  alocacao:           'bg-blue-50 text-blue-700',
  transferencia:      'bg-indigo-50 text-indigo-700',
  evolucao_categoria: 'bg-amber-50 text-amber-700',
  abate:              'bg-red-50 text-red-700',
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
  const [saving, setSaving] = useState(false);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.nome])),
    [categories]
  );
  const pastoMap = useMemo(
    () => Object.fromEntries(pastures.map(p => [p.id, p.nome])),
    [pastures]
  );

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);

  const byPasto = useMemo(() => {
    const map: Record<string, Animal[]> = {};
    for (const a of ativos) {
      if (a.pasto_id) {
        map[a.pasto_id] = [...(map[a.pasto_id] ?? []), a];
      }
    }
    return map;
  }, [ativos]);

  const semPasto = ativos.filter(a => !a.pasto_id);
  const pastosComLotes = pastures.filter(p => byPasto[p.id]?.length);

  async function confirmarAlocacao() {
    if (!alocarAnimal || !pastoSel) return;
    setSaving(true);
    try {
      await manejoService.alocarPasto(alocarAnimal, pastoSel, pastoMap[pastoSel] ?? pastoSel);
      toast.success(`Lote "${alocarAnimal.nome}" alocado!`);
      setAlocarAnimal(null);
      onReload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alocar lote.');
    } finally {
      setSaving(false);
    }
  }

  function AnimalRow({ a }: { a: Animal }) {
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">{a.nome}</td>
        <td className="px-4 py-2.5 text-xs text-gray-600">{a.categoria_id ? catMap[a.categoria_id] ?? '—' : '—'}</td>
        <td className="px-4 py-2.5 text-sm font-semibold text-blue-600">{a.quantidade.toLocaleString('pt-BR')}</td>
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
      <div className="space-y-6">
        {pastosComLotes.map(p => (
          <section key={p.id}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <h3 className="font-semibold text-gray-800">{p.nome}</h3>
              {p.area && <span className="text-xs text-gray-400">· {p.area} ha</span>}
              <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full ml-auto">
                {byPasto[p.id].length} lote{byPasto[p.id].length !== 1 ? 's' : ''}
              </span>
            </div>
            <TableWrap>
              {byPasto[p.id].map(a => <AnimalRow key={a.id} a={a} />)}
            </TableWrap>
          </section>
        ))}

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
   TAB 3 — Evolução de Categoria
══════════════════════════════════════════════════════════════ */

function EvolucaoTab({
  animals, categories, farmId, onReload,
}: {
  animals: Animal[]; categories: AnimalCategory[]; farmId: string; onReload: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [novaCatId, setNovaCatId] = useState('');
  const [pesoMedio, setPesoMedio] = useState('');
  const [saving, setSaving]       = useState(false);
  const [events, setEvents]       = useState<ManejoEvent[]>([]);
  const [loadingH, setLoadingH]   = useState(true);

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.nome])), [categories]);

  useEffect(() => {
    setLoadingH(true);
    manejoService.listarHistorico(farmId, 'evolucao_categoria', 20)
      .then(setEvents).catch(() => {}).finally(() => setLoadingH(false));
  }, [farmId]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedAnimals = ativos.filter(a => selected.has(a.id));
  const totalCab = selectedAnimals.reduce((s, a) => s + a.quantidade, 0);

  async function confirmar() {
    if (selected.size === 0) { toast.error('Selecione pelo menos um lote.'); return; }
    if (!novaCatId) { toast.error('Selecione a nova categoria.'); return; }
    const catOrigemNomes = [...new Set(selectedAnimals.map(a => a.categoria_id ? (catMap[a.categoria_id] ?? 'sem categoria') : 'sem categoria'))].join(', ');
    const catDestinoNome = catMap[novaCatId] ?? novaCatId;
    setSaving(true);
    try {
      await manejoService.evoluirCategorias(
        selectedAnimals, novaCatId,
        catOrigemNomes, catDestinoNome,
        pesoMedio ? Number(pesoMedio) : undefined,
      );
      toast.success(`${selected.size} lote(s) evoluído(s) para ${catDestinoNome}!`);
      setSelected(new Set()); setNovaCatId(''); setPesoMedio('');
      onReload();
      const updated = await manejoService.listarHistorico(farmId, 'evolucao_categoria', 20);
      setEvents(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao evoluir categoria.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Seleção + form */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Selecione os lotes</h3>
            </div>
            {selected.size > 0 && (
              <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                {selected.size} selecionado{selected.size !== 1 ? 's' : ''} · {totalCab} cab.
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {ativos.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-400">Nenhum lote ativo.</p>
            ) : ativos.map(a => {
              const on = selected.has(a.id);
              return (
                <label key={a.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${on ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                    {on && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" checked={on} onChange={() => toggle(a.id)} className="sr-only" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.nome}</p>
                    <p className="text-xs text-gray-500">
                      {a.categoria_id ? catMap[a.categoria_id] : 'sem categoria'} · {a.quantidade} cab.
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <label className={labelClass}>Nova categoria</label>
            <div className="relative">
              <select value={novaCatId} onChange={e => setNovaCatId(e.target.value)} className={selectClass}>
                <option value="">Selecione a categoria…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Novo peso médio (opcional)</label>
            <input type="number" min="0" step="0.1" value={pesoMedio}
              onChange={e => setPesoMedio(e.target.value)}
              placeholder="Ex: 220 kg"
              className={inputClass} />
          </div>
          <button onClick={confirmar} disabled={saving || selected.size === 0 || !novaCatId}
            className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <TrendingUp className="w-4 h-4" />
            {saving ? 'Salvando...' : `Evoluir ${selected.size > 0 ? `${selected.size} lote(s) · ${totalCab} cab.` : 'selecionados'}`}
          </button>
        </div>
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

function AbateTab({
  animals, farmId, onReload,
}: {
  animals: Animal[]; farmId: string; onReload: () => void;
}) {
  const [loteId, setLoteId]     = useState('');
  const [qtd, setQtd]           = useState('');
  const [peso, setPeso]         = useState('');
  const [obs, setObs]           = useState('');
  const [saving, setSaving]     = useState(false);
  const [events, setEvents]     = useState<ManejoEvent[]>([]);
  const [loadingH, setLoadingH] = useState(true);

  const ativos = animals.filter(a => a.status === 'ativo' || !a.status);
  const lote = ativos.find(a => a.id === loteId);
  const qtdNum = Number(qtd);
  const restam = lote ? lote.quantidade - qtdNum : 0;

  useEffect(() => {
    setLoadingH(true);
    manejoService.listarHistorico(farmId, 'abate', 20)
      .then(setEvents).catch(() => {}).finally(() => setLoadingH(false));
  }, [farmId]);

  async function confirmar() {
    if (!lote) { toast.error('Selecione um lote.'); return; }
    if (!qtd || qtdNum <= 0) { toast.error('Informe a quantidade de cabeças abatidas.'); return; }
    if (qtdNum > lote.quantidade) { toast.error(`Máximo ${lote.quantidade} cabeças para este lote.`); return; }

    const encerrar = qtdNum >= lote.quantidade;
    if (encerrar && !window.confirm(`Atenção: isso vai encerrar o lote "${lote.nome}" (todas as ${lote.quantidade} cabeças serão marcadas como abatidas). Confirmar?`)) return;

    setSaving(true);
    try {
      await manejoService.registrarAbate(lote, qtdNum, peso ? Number(peso) : undefined, obs || undefined);
      toast.success(`Saída de ${qtdNum} cab. registrada!${encerrar ? ' Lote encerrado.' : ''}`);
      setLoteId(''); setQtd(''); setPeso(''); setObs('');
      onReload();
      const updated = await manejoService.listarHistorico(farmId, 'abate', 20);
      setEvents(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar saída.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Scissors className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-gray-900">Registrar saída</h3>
        </div>

        <div>
          <label className={labelClass}>Lote</label>
          <div className="relative">
            <select value={loteId} onChange={e => { setLoteId(e.target.value); setQtd(''); }} className={selectClass}>
              <option value="">Selecione um lote…</option>
              {ativos.map(a => (
                <option key={a.id} value={a.id}>{a.nome} · {a.quantidade} cab.</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Cabeças abatidas</label>
          <input type="number" min="1" max={lote?.quantidade}
            value={qtd} onChange={e => setQtd(e.target.value)}
            placeholder={lote ? `Máx. ${lote.quantidade}` : '0'}
            className={inputClass}
            disabled={!loteId} />
          {lote && qtdNum > 0 && (
            <p className={`text-xs mt-1 font-medium ${restam <= 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {restam <= 0
                ? '⚠ O lote será encerrado (abatido)'
                : `Restam ${restam} cabeças após a saída`}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Peso médio (opcional)</label>
          <input type="number" min="0" step="0.1"
            value={peso} onChange={e => setPeso(e.target.value)}
            placeholder="Ex: 420 kg"
            className={inputClass} disabled={!loteId} />
        </div>

        <div>
          <label className={labelClass}>Observação (opcional)</label>
          <input type="text"
            value={obs} onChange={e => setObs(e.target.value)}
            placeholder="Ex: Saída programada — lote 01/03"
            className={inputClass} disabled={!loteId} />
        </div>

        <button onClick={confirmar} disabled={saving || !loteId || !qtd || qtdNum <= 0}
          className="flex items-center gap-2 w-full justify-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Scissors className="w-4 h-4" />
          {saving ? 'Registrando...' : 'Confirmar Saída'}
        </button>
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

type Tab = 'lotes' | 'transferir' | 'evolucao' | 'abate';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'lotes',     label: 'Lotes por Pasto',    icon: MapPin },
  { id: 'transferir',label: 'Transferir',          icon: ArrowRight },
  { id: 'evolucao',  label: 'Evolução',            icon: TrendingUp },
  { id: 'abate',     label: 'Saída',               icon: Scissors },
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
                <AbateTab animals={animals} farmId={activeFarmId} onReload={reload} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
