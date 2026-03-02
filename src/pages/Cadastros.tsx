import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Leaf, Beef, Package, Users, Wrench, Plus, Pencil, Trash2, Save, X, MapPin, Sprout, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { SkeletonTable } from '../components/Skeleton';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

/* ── Local types ── */
interface AnimalCategory  { id: string; farm_id: string; nome: string; observacoes?: string; }
interface Animal          { id: string; farm_id: string; nome: string; quantidade: number; raca?: string; categoria_id?: string; observacoes?: string; }
interface SupplementType  { id: string; farm_id: string; nome: string; unidade: string; observacoes?: string; }
interface Employee        { id: string; farm_id: string; nome: string; funcao?: string; contato?: string; }
interface Equipment       { id: string; farm_id: string; nome: string; tipo?: string; quantidade: number; observacoes?: string; }

/* ── Tab definition ── */
const TABS = [
  { key: 'pastos',       label: 'Pastos',       icon: Leaf    },
  { key: 'retiros',      label: 'Retiros',      icon: MapPin  },
  { key: 'animais',      label: 'Animais',      icon: Beef    },
  { key: 'forragens',    label: 'Forragens',    icon: Sprout  },
  { key: 'suplementos',  label: 'Suplementos',  icon: Package },
  { key: 'funcionarios', label: 'Funcionários', icon: Users   },
  { key: 'equipamentos', label: 'Equipamentos', icon: Wrench  },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ── Reusable helpers ── */

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm">
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

function ActionBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"><Pencil className="w-4 h-4" /></button>
      <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

function SaveCancelBtns({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
        <Save className="w-3.5 h-3.5" /> Salvar
      </button>
      <button onClick={onCancel} className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Generic simple CRUD tab (nome + observacoes)
   Used for: Retiros, Forragens, AnimalCategories
═══════════════════════════════════════════════════════════════ */

interface SimpleItem { id: string; farm_id: string; nome: string; observacoes?: string; }
interface SimpleForm { nome: string; observacoes: string; }

function SimpleEditRow({ item, onSave, onCancel }: {
  item: SimpleItem; onSave: (d: SimpleForm) => void; onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<SimpleForm>({
    defaultValues: { nome: item.nome, observacoes: item.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('observacoes')} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function SimpleTab({
  table, label, icon: Icon, emptyText, newLabel,
}: {
  table: string; label: string; icon: React.ElementType;
  emptyText: string; newLabel: string;
}) {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SimpleForm>();

  useEffect(() => {
    if (!activeFarmId) return;
    setLoading(true);
    supabase.from(table).select('*').eq('farm_id', activeFarmId).order('nome')
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, [activeFarmId, table]);

  async function onAdd(data: SimpleForm) {
    if (!activeFarmId) return;
    const { data: row, error } = await supabase.from(table)
      .insert({ nome: data.nome, observacoes: data.observacoes || null, farm_id: activeFarmId })
      .select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    setItems(prev => [...prev, row].sort((a, b) => a.nome.localeCompare(b.nome)));
    toast.success(`${label} adicionado!`, { description: data.nome });
    reset(); setShowAdd(false);
  }

  async function onEditSave(id: string, data: SimpleForm) {
    const { error } = await supabase.from(table).update({ nome: data.nome, observacoes: data.observacoes || null }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    toast.success(`${label} atualizado!`); setEditingId(null);
  }

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success(`${label} removido.`);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddBtn label={newLabel} onClick={() => setShowAdd(v => !v)} />
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar {label}</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome *</label>
              <input placeholder={`Ex: ${label}`} {...register('nome', { required: true })}
                className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className={labelClass}>Observações</label>
              <input placeholder="Info adicional" {...register('observacoes')} className={inputClass} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
              <button type="button" onClick={() => { setShowAdd(false); reset(); }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? <SkeletonTable rows={4} cols={3} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{emptyText}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Nome', 'Observações', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item =>
                    editingId === item.id ? (
                      <SimpleEditRow key={item.id} item={item}
                        onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
                    ) : (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-teal-500" />{item.nome}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.observacoes || '—'}</td>
                        <td className="px-4 py-3">
                          <ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} />
                        </td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PastosTab — reutiliza DataContext
═══════════════════════════════════════════════════════════════ */
interface PastureForm { nome: string; area: number; observacoes: string; }

function PastureEditRow({ pasture, onSave, onCancel }: {
  pasture: { id: string; nome: string; area?: number; observacoes?: string };
  onSave: (data: PastureForm) => void; onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<PastureForm>({
    defaultValues: { nome: pasture.nome, area: pasture.area ?? 0, observacoes: pasture.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} placeholder="Nome" /></td>
      <td className="px-4 py-2"><input type="number" step="0.01" {...register('area', { min: 0, valueAsNumber: true })} className={inputClass} placeholder="0.0" /></td>
      <td className="px-4 py-2"><input {...register('observacoes')} className={inputClass} placeholder="Observações" /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function PastosTab() {
  const { pastures, addPasture, deletePasture, updatePasture, loading } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PastureForm>();

  function onAdd(data: PastureForm) {
    addPasture(data); toast.success('Pasto adicionado!', { description: data.nome });
    reset(); setShowAddForm(false);
  }
  function onEditSave(id: string, data: PastureForm) {
    updatePasture(id, data); toast.success('Pasto atualizado!'); setEditingId(null);
  }
  function onDelete(p: { id: string; nome: string }) {
    if (!window.confirm(`Remover o pasto "${p.nome}"?`)) return;
    deletePasture(p.id); toast.success('Pasto removido.');
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddBtn label="Novo Pasto" onClick={() => setShowAddForm(v => !v)} />
      </div>
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Pasto</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Nome *</label>
              <input placeholder="Ex: Lagoa Verde" {...register('nome', { required: true })}
                className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
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
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); reset(); }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={4} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {pastures.length === 0 ? (
            <div className="py-16 text-center">
              <Leaf className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum pasto cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Nome do Pasto', 'Área (ha)', 'Observações', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastures.map(p =>
                    editingId === p.id ? (
                      <PastureEditRow key={p.id} pasture={p}
                        onSave={d => onEditSave(p.id, d)} onCancel={() => setEditingId(null)} />
                    ) : (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900"><div className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-teal-500" />{p.nome}</div></td>
                        <td className="px-4 py-3 text-gray-600">{p.area ? `${p.area} ha` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.observacoes || '—'}</td>
                        <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(p.id)} onDelete={() => onDelete(p)} /></td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AnimaisTab — com sub-seção de Categorias
═══════════════════════════════════════════════════════════════ */
let _animaisCache: Animal[] = [];
let _acatCache: AnimalCategory[] = [];

interface AnimalForm { nome: string; quantidade: number; raca: string; categoria_id: string; observacoes: string; }

function AnimalEditRow({ item, categories, onSave, onCancel }: {
  item: Animal; categories: AnimalCategory[];
  onSave: (d: AnimalForm) => void; onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<AnimalForm>({
    defaultValues: { nome: item.nome, quantidade: item.quantidade, raca: item.raca || '', categoria_id: item.categoria_id || '', observacoes: item.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} /></td>
      <td className="px-4 py-2"><input type="number" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} /></td>
      <td className="px-4 py-2">
        <select {...register('categoria_id')} className={inputClass}>
          <option value="">—</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </td>
      <td className="px-4 py-2"><input {...register('raca')} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('observacoes')} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function AnimaisTab() {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<Animal[]>(_animaisCache);
  const [categories, setCategories] = useState<AnimalCategory[]>(_acatCache);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatSection, setShowCatSection] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnimalForm>();

  useEffect(() => {
    if (!activeFarmId) return;
    setLoading(true);
    Promise.all([
      supabase.from('animals').select('*').eq('farm_id', activeFarmId).order('nome'),
      supabase.from('animal_categories').select('*').eq('farm_id', activeFarmId).order('nome'),
    ]).then(([animRes, catRes]) => {
      _animaisCache = animRes.data ?? []; setItems(_animaisCache);
      _acatCache = catRes.data ?? []; setCategories(_acatCache);
      setLoading(false);
    });
  }, [activeFarmId]);

  async function onAdd(data: AnimalForm) {
    if (!activeFarmId) return;
    const payload = { nome: data.nome, quantidade: data.quantidade, raca: data.raca || null, categoria_id: data.categoria_id || null, observacoes: data.observacoes || null, farm_id: activeFarmId };
    const { data: row, error } = await supabase.from('animals').insert(payload).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _animaisCache = [..._animaisCache, row]; setItems(_animaisCache);
    toast.success('Lote adicionado!', { description: data.nome });
    reset(); setShowAddForm(false);
  }

  async function onEditSave(id: string, data: AnimalForm) {
    const payload = { nome: data.nome, quantidade: data.quantidade, raca: data.raca || null, categoria_id: data.categoria_id || null, observacoes: data.observacoes || null };
    const { error } = await supabase.from('animals').update(payload).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _animaisCache = _animaisCache.map(a => a.id === id ? { ...a, nome: data.nome, quantidade: data.quantidade, raca: data.raca || undefined, categoria_id: data.categoria_id || undefined, observacoes: data.observacoes || undefined } : a); setItems(_animaisCache);
    toast.success('Lote atualizado!'); setEditingId(null);
  }

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabase.from('animals').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    _animaisCache = _animaisCache.filter(a => a.id !== id); setItems(_animaisCache);
    toast.success('Lote removido.');
  }

  function getCatName(id?: string) {
    return categories.find(c => c.id === id)?.nome || '—';
  }

  return (
    <div className="space-y-6">
      {/* ── Seção Categorias (expansível) ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowCatSection(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Tag className="w-4 h-4 text-teal-600" />
            Categorias de Animais
            <span className="text-xs font-normal text-gray-400 ml-1">({categories.length} cadastradas)</span>
          </div>
          <span className="text-gray-400 text-xs">{showCatSection ? '▲ Recolher' : '▼ Expandir'}</span>
        </button>

        {showCatSection && (
          <div className="border-t border-gray-100 p-5">
            <SimpleTab
              table="animal_categories"
              label="Categoria"
              icon={Tag}
              emptyText="Nenhuma categoria cadastrada"
              newLabel="Nova Categoria"
            />
          </div>
        )}
      </div>

      {/* ── Lotes ── */}
      <div>
        <div className="flex justify-end mb-4">
          <AddBtn label="Novo Lote" onClick={() => setShowAddForm(v => !v)} />
        </div>

        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Lote / Animal</h2>
            <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome / Lote *</label>
                <input placeholder="Ex: Lote A" {...register('nome', { required: true })}
                  className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
              </div>
              <div>
                <label className={labelClass}>Cabeças</label>
                <input type="number" placeholder="100" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Categoria</label>
                <select {...register('categoria_id')} className={inputClass}>
                  <option value="">Selecione</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Raça</label>
                <input placeholder="Nelore" {...register('raca')} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Observações</label>
                <input placeholder="Info adicional" {...register('observacoes')} className={inputClass} />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); reset(); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? <SkeletonTable rows={4} cols={6} /> : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <Beef className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum lote cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Lote', 'Cabeças', 'Categoria', 'Raça', 'Obs', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item =>
                      editingId === item.id ? (
                        <AnimalEditRow key={item.id} item={item} categories={categories}
                          onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
                      ) : (
                        <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                          <td className="px-4 py-3 text-gray-600">{item.quantidade}</td>
                          <td className="px-4 py-3">
                            {item.categoria_id
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">{getCatName(item.categoria_id)}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.raca || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.observacoes || '—'}</td>
                          <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} /></td>
                        </motion.tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SuplementosTab
═══════════════════════════════════════════════════════════════ */
let _suplementosCache: SupplementType[] = [];
interface SupplementForm { nome: string; unidade: string; observacoes: string; }

function SupEditRow({ item, onSave, onCancel }: { item: SupplementType; onSave: (d: SupplementForm) => void; onCancel: () => void; }) {
  const { register, handleSubmit } = useForm<SupplementForm>({
    defaultValues: { nome: item.nome, unidade: item.unidade, observacoes: item.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} /></td>
      <td className="px-4 py-2">
        <select {...register('unidade')} className={inputClass}>
          <option value="kg">kg</option><option value="saco">saco</option><option value="litro">litro</option>
        </select>
      </td>
      <td className="px-4 py-2"><input {...register('observacoes')} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function SuplementosTab() {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<SupplementType[]>(_suplementosCache);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplementForm>({ defaultValues: { unidade: 'kg' } });

  useEffect(() => {
    if (!activeFarmId) return;
    setLoading(true);
    supabase.from('supplement_types').select('*').eq('farm_id', activeFarmId).order('nome')
      .then(({ data }) => { _suplementosCache = data ?? []; setItems(_suplementosCache); setLoading(false); });
  }, [activeFarmId]);

  async function onAdd(data: SupplementForm) {
    if (!activeFarmId) return;
    const { data: row, error } = await supabase.from('supplement_types').insert({ ...data, farm_id: activeFarmId }).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _suplementosCache = [..._suplementosCache, row]; setItems(_suplementosCache);
    toast.success('Suplemento adicionado!', { description: data.nome });
    reset({ unidade: 'kg' }); setShowAddForm(false);
  }
  async function onEditSave(id: string, data: SupplementForm) {
    const { error } = await supabase.from('supplement_types').update(data).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _suplementosCache = _suplementosCache.map(s => s.id === id ? { ...s, ...data } : s); setItems(_suplementosCache);
    toast.success('Suplemento atualizado!'); setEditingId(null);
  }
  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabase.from('supplement_types').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    _suplementosCache = _suplementosCache.filter(s => s.id !== id); setItems(_suplementosCache);
    toast.success('Suplemento removido.');
  }

  return (
    <div>
      <div className="flex justify-end mb-4"><AddBtn label="Novo Suplemento" onClick={() => setShowAddForm(v => !v)} /></div>
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Suplemento</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Nome *</label>
              <input placeholder="Ex: Mineral Adensado" {...register('nome', { required: true })} className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} /></div>
            <div><label className={labelClass}>Unidade</label>
              <select {...register('unidade')} className={inputClass}>
                <option value="kg">kg</option><option value="saco">saco</option><option value="litro">litro</option>
              </select></div>
            <div><label className={labelClass}>Observações</label>
              <input placeholder="Info adicional" {...register('observacoes')} className={inputClass} /></div>
            <div className="col-span-3 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Adicionar</button>
              <button type="button" onClick={() => { setShowAddForm(false); reset({ unidade: 'kg' }); }} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={4} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (<div className="py-16 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum suplemento cadastrado</p></div>) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{['Nome', 'Unidade', 'Obs', 'Ações'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-100">{items.map(item => editingId === item.id ? (
                <SupEditRow key={item.id} item={item} onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
              ) : (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unidade}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.observacoes || '—'}</td>
                  <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} /></td>
                </motion.tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FuncionariosTab
═══════════════════════════════════════════════════════════════ */
let _funcionariosCache: Employee[] = [];
interface EmployeeForm { nome: string; funcao: string; contato: string; }

function EmpEditRow({ item, onSave, onCancel }: { item: Employee; onSave: (d: EmployeeForm) => void; onCancel: () => void; }) {
  const { register, handleSubmit } = useForm<EmployeeForm>({ defaultValues: { nome: item.nome, funcao: item.funcao || '', contato: item.contato || '' } });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('funcao')} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('contato')} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function FuncionariosTab() {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<Employee[]>(_funcionariosCache);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeForm>();

  useEffect(() => {
    if (!activeFarmId) return;
    setLoading(true);
    supabase.from('employees').select('*').eq('farm_id', activeFarmId).order('nome')
      .then(({ data }) => { _funcionariosCache = data ?? []; setItems(_funcionariosCache); setLoading(false); });
  }, [activeFarmId]);

  async function onAdd(data: EmployeeForm) {
    if (!activeFarmId) return;
    const { data: row, error } = await supabase.from('employees').insert({ ...data, farm_id: activeFarmId }).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _funcionariosCache = [..._funcionariosCache, row]; setItems(_funcionariosCache);
    toast.success('Funcionário adicionado!', { description: data.nome });
    reset(); setShowAddForm(false);
  }
  async function onEditSave(id: string, data: EmployeeForm) {
    const { error } = await supabase.from('employees').update(data).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _funcionariosCache = _funcionariosCache.map(e => e.id === id ? { ...e, ...data } : e); setItems(_funcionariosCache);
    toast.success('Funcionário atualizado!'); setEditingId(null);
  }
  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    _funcionariosCache = _funcionariosCache.filter(e => e.id !== id); setItems(_funcionariosCache);
    toast.success('Funcionário removido.');
  }

  return (
    <div>
      <div className="flex justify-end mb-4"><AddBtn label="Novo Funcionário" onClick={() => setShowAddForm(v => !v)} /></div>
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Funcionário</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Nome *</label>
              <input placeholder="João Silva" {...register('nome', { required: true })} className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} /></div>
            <div><label className={labelClass}>Função</label><input placeholder="Veterinário" {...register('funcao')} className={inputClass} /></div>
            <div><label className={labelClass}>Contato</label><input placeholder="(00) 00000-0000" {...register('contato')} className={inputClass} /></div>
            <div className="col-span-3 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Adicionar</button>
              <button type="button" onClick={() => { setShowAddForm(false); reset(); }} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={4} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (<div className="py-16 text-center"><Users className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum funcionário cadastrado</p></div>) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{['Nome', 'Função', 'Contato', 'Ações'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-100">{items.map(item => editingId === item.id ? (
                <EmpEditRow key={item.id} item={item} onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
              ) : (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{item.funcao || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.contato || '—'}</td>
                  <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} /></td>
                </motion.tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EquipamentosTab
═══════════════════════════════════════════════════════════════ */
let _equipamentosCache: Equipment[] = [];
interface EquipmentForm { nome: string; tipo: string; quantidade: number; observacoes: string; }

function EquipEditRow({ item, onSave, onCancel }: { item: Equipment; onSave: (d: EquipmentForm) => void; onCancel: () => void; }) {
  const { register, handleSubmit } = useForm<EquipmentForm>({
    defaultValues: { nome: item.nome, tipo: item.tipo || '', quantidade: item.quantidade, observacoes: item.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...register('nome', { required: true })} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('tipo')} className={inputClass} /></td>
      <td className="px-4 py-2"><input type="number" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...register('observacoes')} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function EquipamentosTab() {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<Equipment[]>(_equipamentosCache);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipmentForm>({ defaultValues: { quantidade: 1 } });

  useEffect(() => {
    if (!activeFarmId) return;
    setLoading(true);
    supabase.from('equipment').select('*').eq('farm_id', activeFarmId).order('nome')
      .then(({ data }) => { _equipamentosCache = data ?? []; setItems(_equipamentosCache); setLoading(false); });
  }, [activeFarmId]);

  async function onAdd(data: EquipmentForm) {
    if (!activeFarmId) return;
    const { data: row, error } = await supabase.from('equipment').insert({ ...data, farm_id: activeFarmId }).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _equipamentosCache = [..._equipamentosCache, row]; setItems(_equipamentosCache);
    toast.success('Equipamento adicionado!', { description: data.nome });
    reset({ quantidade: 1 }); setShowAddForm(false);
  }
  async function onEditSave(id: string, data: EquipmentForm) {
    const { error } = await supabase.from('equipment').update(data).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _equipamentosCache = _equipamentosCache.map(e => e.id === id ? { ...e, ...data } : e); setItems(_equipamentosCache);
    toast.success('Equipamento atualizado!'); setEditingId(null);
  }
  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    _equipamentosCache = _equipamentosCache.filter(e => e.id !== id); setItems(_equipamentosCache);
    toast.success('Equipamento removido.');
  }

  return (
    <div>
      <div className="flex justify-end mb-4"><AddBtn label="Novo Equipamento" onClick={() => setShowAddForm(v => !v)} /></div>
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Equipamento</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>Nome *</label>
              <input placeholder="Ex: Trator" {...register('nome', { required: true })} className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} /></div>
            <div><label className={labelClass}>Tipo</label><input placeholder="Maquinário" {...register('tipo')} className={inputClass} /></div>
            <div><label className={labelClass}>Quantidade</label><input type="number" placeholder="1" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} /></div>
            <div><label className={labelClass}>Observações</label><input placeholder="Info adicional" {...register('observacoes')} className={inputClass} /></div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Adicionar</button>
              <button type="button" onClick={() => { setShowAddForm(false); reset({ quantidade: 1 }); }} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={5} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (<div className="py-16 text-center"><Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum equipamento cadastrado</p></div>) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{['Nome', 'Tipo', 'Qtd', 'Obs', 'Ações'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-100">{items.map(item => editingId === item.id ? (
                <EquipEditRow key={item.id} item={item} onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
              ) : (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{item.tipo || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.quantidade}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.observacoes || '—'}</td>
                  <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} /></td>
                </motion.tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Cadastros — página principal
═══════════════════════════════════════════════════════════════ */
export function Cadastros() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('aba') ?? 'pastos') as TabKey;

  function setTab(key: TabKey) {
    setSearchParams({ aba: key }, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto">

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                  isActive ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'pastos'       && <PastosTab />}
        {activeTab === 'retiros'      && <SimpleTab table="retiros" label="Retiro" icon={MapPin} emptyText="Nenhum retiro cadastrado" newLabel="Novo Retiro" />}
        {activeTab === 'animais'      && <AnimaisTab />}
        {activeTab === 'forragens'    && <SimpleTab table="forage_types" label="Forragem" icon={Sprout} emptyText="Nenhuma forragem cadastrada" newLabel="Nova Forragem" />}
        {activeTab === 'suplementos'  && <SuplementosTab />}
        {activeTab === 'funcionarios' && <FuncionariosTab />}
        {activeTab === 'equipamentos' && <EquipamentosTab />}

      </motion.div>
    </div>
  );
}
