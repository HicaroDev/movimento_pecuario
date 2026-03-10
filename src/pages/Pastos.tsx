import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { Leaf, Plus, Trash2, Pencil, Save, X, ChevronDown, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
import { manejoService } from '../services/manejoService';
import type { Animal, AnimalCategory } from '../services/manejoService';
import { SkeletonTable } from '../components/Skeleton';
import type { Pasture } from '../context/DataContext';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

interface PastureForm {
  nome: string;
  area: number;
  observacoes: string;
}

/* ─────────────── Farm selector for admin ─────────────── */

// Cache de módulo — persiste entre remounts (HMR / navegação)
let _farmSelectorCache: { id: string; name: string }[] = [];

function FarmSelector() {
  const { activeFarmId, selectFarm } = useData();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>(_farmSelectorCache);

  useEffect(() => {
    farmService.list().then(list => {
      const active = list.filter(f => f.active).map(f => ({ id: f.id, name: f.nomeFazenda }));
      _farmSelectorCache = active;
      setFarms(active);
    });
  }, []);

  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
      <Leaf className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span className="text-sm font-medium text-amber-800">Fazenda:</span>
      <div className="relative flex-1 max-w-xs">
        <select
          value={activeFarmId}
          onChange={e => selectFarm(e.target.value)}
          className="w-full h-9 pl-3 pr-8 rounded-lg border border-amber-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer"
        >
          {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          {farms.length === 0 && <option value="">Nenhuma fazenda cadastrada</option>}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
      </div>
    </div>
  );
}

/* ─────────────── Inline edit row ─────────────── */

function PastureEditRow({ pasture, onSave, onCancel }: {
  pasture: Pasture;
  onSave: (data: PastureForm) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<PastureForm>({
    defaultValues: { nome: pasture.nome, area: pasture.area, observacoes: pasture.observacoes || '' },
  });

  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2">
        <input {...register('nome', { required: true })} className={inputClass} placeholder="Nome do pasto" />
      </td>
      <td className="px-4 py-2">
        <input type="number" step="0.01" {...register('area', { min: 0, valueAsNumber: true })}
          className={inputClass} placeholder="0.0" />
      </td>
      <td className="px-4 py-2">
        <input {...register('observacoes')} className={inputClass} placeholder="Observações" />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button onClick={handleSubmit(onSave)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
            <Save className="w-3.5 h-3.5" /> Salvar
          </button>
          <button onClick={onCancel}
            className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────── Ocupação dos Pastos (componente vivo) ─────────────── */

function OcupacaoPastos({ pastures, animals, categories, loading }: {
  pastures: Pasture[];
  animals: Animal[];
  categories: AnimalCategory[];
  loading: boolean;
}) {
  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c.nome])),
    [categories]
  );

  const ativos = useMemo(
    () => animals.filter(a => a.status === 'ativo' || !a.status),
    [animals]
  );

  const porPasto = useMemo(() =>
    pastures.map(p => ({
      pasto: p,
      lotes: ativos.filter(a => a.pasto_id === p.id),
    })).sort((a, b) => b.lotes.length - a.lotes.length),
  [pastures, ativos]);

  const pastosOcupados = porPasto.filter(x => x.lotes.length > 0).length;
  const totalCab = ativos.reduce((s, a) => s + a.quantidade, 0);
  const totalBez = ativos.reduce((s, a) => s + (a.bezerros_quantidade ?? 0), 0);
  const areaTotal = pastures.reduce((s, p) => s + (p.area ?? 0), 0);

  if (loading) return <div className="mt-6"><SkeletonTable rows={4} cols={5} /></div>;
  if (pastures.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Cabeçalho da seção */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">Ocupação dos Pastos</h2>
        <p className="text-xs text-gray-400 mt-0.5">Lotes ativos alocados por pasto</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pastos Ocupados', value: `${pastosOcupados} / ${pastures.length}`, color: '#1a6040' },
          { label: 'Área Total',      value: `${areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`, color: '#1a6040' },
          { label: 'Total Cabeças',   value: totalCab.toLocaleString('pt-BR'), color: '#1a6040' },
          { label: 'Total Bezerros',  value: totalBez > 0 ? totalBez.toLocaleString('pt-BR') : '—', color: '#c2410c' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Por pasto */}
      <div className="space-y-3">
        {porPasto.map(({ pasto, lotes }) => {
          const totalPasto = lotes.reduce((s, a) => s + a.quantidade, 0);
          const bezPasto   = lotes.reduce((s, a) => s + (a.bezerros_quantidade ?? 0), 0);
          return (
            <div key={pasto.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Cabeçalho do pasto */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
                style={{ background: 'rgba(26,96,64,0.04)' }}>
                <div className="flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span className="font-semibold text-sm text-gray-900">{pasto.nome}</span>
                  {pasto.area && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                      {pasto.area} ha
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {bezPasto > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                      {bezPasto.toLocaleString('pt-BR')} bez.
                    </span>
                  )}
                  {lotes.length === 0 ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      Vago
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                      {totalPasto.toLocaleString('pt-BR')} cab.
                    </span>
                  )}
                </div>
              </div>

              {/* Lotes */}
              {lotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lote</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Categoria</th>
                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Qtd</th>
                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Peso Médio</th>
                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bezerros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotes.map((a, i) => (
                        <tr key={a.id}
                          style={{ borderBottom: i < lotes.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                          <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{a.nome}</td>
                          <td className="px-4 py-2.5 text-xs">
                            {a.categoria_id && catMap[a.categoria_id] ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-100">
                                {catMap[a.categoria_id]}
                              </span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-right font-semibold" style={{ color: '#1a6040' }}>
                            {a.quantidade.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-right text-gray-500">
                            {a.peso_medio ? `${a.peso_medio} kg` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-right">
                            {(a.bezerros_quantidade ?? 0) > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {a.bezerros_quantidade!.toLocaleString('pt-BR')} cab.
                                {a.bezerros_peso_medio ? ` · ${a.bezerros_peso_medio} kg` : ''}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-3 text-xs text-gray-400 italic">Nenhum lote alocado neste pasto.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Main Pastos page ─────────────── */

export function Pastos() {
  const { pastures, addPasture, deletePasture, updatePasture, activeFarmId, loading } = useData();
  const { isAdmin, user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [farmName, setFarmName] = useState<string>(user?.name || '—');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [categories, setCategories] = useState<AnimalCategory[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PastureForm>();

  // Farm name for display
  useEffect(() => {
    const id = isAdmin ? activeFarmId : (user?.id || '');
    if (!id) return;
    farmService.findById(id).then(f => setFarmName(f?.nomeFazenda || user?.name || '—'));
  }, [activeFarmId, isAdmin, user?.id, user?.name]);

  // Load animals + categories for occupancy report
  useEffect(() => {
    if (!activeFarmId) return;
    setLoadingAnimals(true);
    Promise.all([
      manejoService.listarAnimais(activeFarmId),
      manejoService.listarCategorias(activeFarmId),
    ]).then(([a, c]) => {
      setAnimals(a);
      setCategories(c);
    }).catch(() => {}).finally(() => setLoadingAnimals(false));
  }, [activeFarmId]);

  function onAdd(data: PastureForm) {
    addPasture(data);
    toast.success('Pasto adicionado!', { description: data.nome });
    reset();
    setShowAddForm(false);
  }

  function onEditSave(id: string, data: PastureForm) {
    updatePasture(id, data);
    toast.success('Pasto atualizado!');
    setEditingId(null);
  }

  async function onDelete(p: Pasture) {
    if (!window.confirm(`Remover o pasto "${p.nome}"?`)) return;
    try {
      await deletePasture(p.id);
      toast.success('Pasto removido.', { description: p.nome });
    } catch {
      toast.error('Não foi possível excluir. Este pasto possui lançamentos ou animais vinculados.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto">

        {/* ── Print-only header ── */}
        <div className="print-only mb-6">
          <div className="pdf-brand-bar rounded-xl px-6 py-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-white text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-0.5">
                Movimento Pecuário · Suplemento Control
              </p>
              <h1 className="text-white text-xl font-bold">Relatório de Ocupação dos Pastos</h1>
            </div>
            <div className="text-right">
              <p className="text-white text-xs opacity-70">{farmName} · Emitido em</p>
              <p className="text-white text-sm font-semibold">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between no-print">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Pastos</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{farmName}</span>
              <span className="text-gray-300">·</span>
              <span>{pastures.length} pasto{pastures.length !== 1 ? 's' : ''} cadastrado{pastures.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700 text-sm font-semibold transition-colors"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </button>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Pasto
            </button>
          </div>
        </div>

        {/* Admin farm selector */}
        {isAdmin && <div className="no-print"><FarmSelector /></div>}

        {/* Add form */}
        {showAddForm && (
          <div className="no-print mb-6">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-teal-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Adicionar Pasto</h2>
              </div>
              <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nome do Pasto *</label>
                  <input placeholder="Ex: Lagoa Verde"
                    {...register('nome', { required: true })}
                    className={`${inputClass} ${errors.nome ? 'border-red-400 ring-2 ring-red-400' : ''}`} />
                </div>
                <div>
                  <label className={labelClass}>Área (ha)</label>
                  <input type="number" step="0.01" placeholder="10.5"
                    {...register('area', { min: 0, valueAsNumber: true })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Observações</label>
                  <input placeholder="Info adicional" {...register('observacoes')} className={inputClass} />
                </div>
                <div className="col-span-3 flex gap-3">
                  <button type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); reset(); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Table */}
        <div className="no-print">
        {loading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {pastures.length === 0 ? (
            <div className="py-20 text-center">
              <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum pasto cadastrado</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Novo Pasto" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome do Pasto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Área (ha)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Observações</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastures.map((p, i) =>
                    editingId === p.id ? (
                      <PastureEditRow key={p.id} pasture={p}
                        onSave={data => onEditSave(p.id, data)}
                        onCancel={() => setEditingId(null)} />
                    ) : (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Leaf className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                            {p.nome}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.area ? `${p.area} ha` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.observacoes || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingId(p.id)}
                              className="p-1.5 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(p)}
                              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        )}
        </div>

        {/* Relatório de Ocupação — sempre visível em tela e no PDF */}
        <OcupacaoPastos
          pastures={pastures}
          animals={animals}
          categories={categories}
          loading={loadingAnimals}
        />

      </motion.div>
    </div>
  );
}
