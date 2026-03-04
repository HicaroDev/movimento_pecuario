import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Leaf, Beef, Package, Users, Plus, Pencil, Trash2, Save, X, MapPin, Sprout, Tag, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseAdmin } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { SkeletonTable } from '../components/Skeleton';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

/** Wraps an RHF register result to force UPPERCASE on typing */
function upperReg<T extends { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }>(reg: T): T & { style: { textTransform: 'uppercase' } } {
  const { onChange, ...rest } = reg;
  return {
    ...rest,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.toUpperCase();
      onChange(e);
    },
    style: { textTransform: 'uppercase' as const },
  } as T & { style: { textTransform: 'uppercase' } };
}

/** Format phone number: (XX) XXXXX-XXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/* ── Local types ── */
interface AnimalCategory  { id: string; farm_id: string; nome: string; observacoes?: string; }
interface Animal          { id: string; farm_id: string; nome: string; quantidade: number; raca?: string; categoria_id?: string; peso_medio?: number; sexo?: string; bezerros_quantidade?: number; bezerros_peso_medio?: number; observacoes?: string; }
interface SupplementType  { id: string; farm_id: string; nome: string; unidade: string; peso?: number; valor_kg?: number; observacoes?: string; }
interface Employee        { id: string; farm_id: string; nome: string; funcao?: string; contato?: string; }

const RACAS = ['NELORE', 'CRUZAMENTO INDUSTRIAL', 'COMPOSTO'] as const;
const QUALIDADES_FORRAGEM = ['REGULAR', 'BOA', 'ÓTIMA'] as const;

/* ── Tab definition ── */
const TABS = [
  { key: 'pastos',       label: 'Pastos',       icon: Leaf    },
  { key: 'animais',      label: 'Animais',      icon: Beef    },
  { key: 'forragens',    label: 'Forragens',    icon: Sprout  },
  { key: 'suplementos',  label: 'Suplementos',  icon: Package },
  { key: 'funcionarios', label: 'Funcionários', icon: Users   },
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
      <td className="px-4 py-2"><input {...upperReg(register('nome', { required: true }))} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...upperReg(register('observacoes'))} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function SimpleTab({
  table, label, icon: Icon, emptyText, newLabel, onDataChange, initialItems,
}: {
  table: string; label: string; icon: React.ElementType;
  emptyText: string; newLabel: string;
  onDataChange?: (items: SimpleItem[]) => void;
  initialItems?: SimpleItem[];
}) {
  const { activeFarmId } = useData();
  const [items, setItems] = useState<SimpleItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SimpleForm>();

  useEffect(() => {
    if (!activeFarmId) return;
    let mounted = true;
    setLoading(true);
    const tid = setTimeout(() => { if (mounted) setLoading(false); }, 15_000);
    (async () => {
      try {
        const { data } = await supabaseAdmin.from(table).select('*').eq('farm_id', activeFarmId).order('nome');
        if (!mounted) return;
        const list = data ?? [];
        setItems(list);
        onDataChange?.(list);
      } finally {
        clearTimeout(tid);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; clearTimeout(tid); };
  }, [activeFarmId, table]);

  function notify(list: SimpleItem[]) { setItems(list); onDataChange?.(list); }

  async function onAdd(data: SimpleForm) {
    if (!activeFarmId) return;
    const { data: row, error } = await supabaseAdmin.from(table)
      .insert({ nome: data.nome, observacoes: data.observacoes || null, farm_id: activeFarmId })
      .select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    notify([...items, row].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
    toast.success(`${label} adicionado!`, { description: data.nome });
    reset(); setShowAdd(false);
  }

  async function onEditSave(id: string, data: SimpleForm) {
    const { error } = await supabaseAdmin.from(table).update({ nome: data.nome, observacoes: data.observacoes || null }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    notify(items.map(i => i.id === id ? { ...i, ...data } : i));
    toast.success(`${label} atualizado!`); setEditingId(null);
  }

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    notify(items.filter(i => i.id !== id));
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
              <input placeholder={`Ex.: ${label}`} {...upperReg(register('nome', { required: true }))}
                className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className={labelClass}>Observações</label>
              <input placeholder="Ex.: Info adicional" {...upperReg(register('observacoes'))} className={inputClass} />
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
interface PastureForm { nome: string; area: number; retiro_id: string; forragem: string; qualidade_forragem: string; observacoes: string; }

function PastureEditRow({ pasture, retiros, forages, onSave, onCancel }: {
  pasture: { id: string; nome: string; area?: number; retiro_id?: string; forragem?: string; qualidade_forragem?: string; observacoes?: string };
  retiros: SimpleItem[];
  forages: SimpleItem[];
  onSave: (data: PastureForm) => void; onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<PastureForm>({
    defaultValues: {
      nome: pasture.nome,
      area: pasture.area ?? 0,
      retiro_id: pasture.retiro_id || '',
      forragem: pasture.forragem || '',
      qualidade_forragem: pasture.qualidade_forragem || '',
      observacoes: pasture.observacoes || '',
    },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...upperReg(register('nome', { required: true }))} className={inputClass} placeholder="Nome" /></td>
      <td className="px-4 py-2"><input type="number" step="0.01" {...register('area', { min: 0, valueAsNumber: true })} className={inputClass} placeholder="0.0" /></td>
      <td className="px-4 py-2">
        <select {...register('retiro_id')} className={inputClass}>
          <option value="">— Sem retiro —</option>
          {retiros.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select {...register('forragem')} className={inputClass}>
          <option value="">— Selecione —</option>
          {forages.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select {...register('qualidade_forragem')} className={inputClass}>
          <option value="">— Qualidade —</option>
          {QUALIDADES_FORRAGEM.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </td>
      <td className="px-4 py-2"><input {...upperReg(register('observacoes'))} className={inputClass} placeholder="Observações" /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(onSave)} onCancel={onCancel} /></td>
    </tr>
  );
}

function PastosTab() {
  const { pastures, addPasture, deletePasture, updatePasture, loading } = useData();
  const [retiros, setRetiros] = useState<SimpleItem[]>([]);
  const [forages, setForages] = useState<SimpleItem[]>([]);
  const [showRetiros, setShowRetiros] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterRetiro, setFilterRetiro] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PastureForm>();
  const { activeFarmId } = useData();

  useEffect(() => {
    if (!activeFarmId) return;
    let mounted = true;
    (async () => {
      const [retRes, forRes] = await Promise.all([
        supabaseAdmin.from('retiros').select('*').eq('farm_id', activeFarmId).order('nome'),
        supabaseAdmin.from('forage_types').select('*').eq('farm_id', activeFarmId).order('nome'),
      ]);
      if (mounted) {
        setRetiros(retRes.data ?? []);
        setForages(forRes.data ?? []);
      }
    })();
    return () => { mounted = false; };
  }, [activeFarmId]);

  function getRetiroName(id?: string) { return retiros.find(r => r.id === id)?.nome; }

  const filteredPastures = pastures.filter(p => {
    const matchText = !filterText || p.nome.toLowerCase().includes(filterText.toLowerCase());
    const matchRetiro = !filterRetiro || p.retiro_id === filterRetiro;
    return matchText && matchRetiro;
  });

  function onAdd(data: PastureForm) {
    addPasture({
      nome: data.nome,
      area: data.area > 0 ? data.area : undefined,   // NaN/0 vira undefined
      retiro_id: data.retiro_id || undefined,
      forragem: data.forragem || undefined,
      qualidade_forragem: data.qualidade_forragem || undefined,
      observacoes: data.observacoes,
    });
    toast.success('Pasto adicionado!', { description: data.nome });
    reset(); setShowAddForm(false);
  }
  function onEditSave(id: string, data: PastureForm) {
    updatePasture(id, {
      nome: data.nome,
      area: data.area > 0 ? data.area : undefined,
      retiro_id: data.retiro_id || undefined,
      forragem: data.forragem || undefined,
      qualidade_forragem: data.qualidade_forragem || undefined,
      observacoes: data.observacoes,
    });
    toast.success('Pasto atualizado!'); setEditingId(null);
  }
  function onDelete(p: { id: string; nome: string }) {
    if (!window.confirm(`Remover o pasto "${p.nome}"?`)) return;
    deletePasture(p.id); toast.success('Pasto removido.');
  }

  return (
    <div className="space-y-6">
      {/* ── Sub-seção Retiros (expansível) ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowRetiros(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin className="w-4 h-4 text-teal-600" />
            Retiros
            <span className="text-xs font-normal text-gray-400 ml-1">({retiros.length} cadastrados)</span>
          </div>
          <span className="text-gray-400 text-xs">{showRetiros ? '▲ Recolher' : '▼ Expandir'}</span>
        </button>
        {showRetiros && (
          <div className="border-t border-gray-100 p-5">
            <SimpleTab
              table="retiros"
              label="Retiro"
              icon={MapPin}
              emptyText="Nenhum retiro cadastrado"
              newLabel="Novo Retiro"
              initialItems={retiros}
              onDataChange={list => setRetiros(list)}
            />
          </div>
        )}
      </div>

      {/* ── Lista de Pastos ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por nome do pasto..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
            />
          </div>
          {/* Filtro por retiro */}
          <div className="relative">
            <select
              value={filterRetiro}
              onChange={e => setFilterRetiro(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer transition-colors"
              style={{ minWidth: 140 }}
            >
              <option value="">Todos os retiros</option>
              {retiros.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <AddBtn label="Novo Pasto" onClick={() => setShowAddForm(v => !v)} />
        </div>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Pasto</h2>
            <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input placeholder="Ex.: Lagoa Verde" {...upperReg(register('nome', { required: true }))}
                  className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
              </div>
              <div>
                <label className={labelClass}>Área (ha)</label>
                <input type="number" step="0.01" placeholder="Ex.: 10.5"
                  {...register('area', { min: 0, valueAsNumber: true })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Retiro <span className="text-gray-400 font-normal">(opcional)</span></label>
                <select {...register('retiro_id')} className={`${inputClass} cursor-pointer`}>
                  <option value="">— Sem retiro —</option>
                  {retiros.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Forragem</label>
                <select {...register('forragem')} className={`${inputClass} cursor-pointer`}>
                  <option value="">— Selecione —</option>
                  {forages.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Qualidade da Forragem</label>
                <select {...register('qualidade_forragem')} className={`${inputClass} cursor-pointer`}>
                  <option value="">— Selecione —</option>
                  {QUALIDADES_FORRAGEM.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Observações</label>
                <input placeholder="Ex.: Info adicional" {...upperReg(register('observacoes'))} className={inputClass} />
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
        {loading ? <SkeletonTable rows={4} cols={7} /> : (
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
                      {['Nome do Pasto', 'Área (ha)', 'Retiro', 'Forragem', 'Qualidade', 'Observações', 'Ações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPastures.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                          Nenhum pasto encontrado para "{filterText}"
                        </td>
                      </tr>
                    ) : filteredPastures.map(p =>
                      editingId === p.id ? (
                        <PastureEditRow key={p.id} pasture={p} retiros={retiros} forages={forages}
                          onSave={d => onEditSave(p.id, d)} onCancel={() => setEditingId(null)} />
                      ) : (
                        <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900"><div className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-teal-500" />{p.nome}</div></td>
                          <td className="px-4 py-3 text-gray-600">{p.area ? `${p.area} ha` : '—'}</td>
                          <td className="px-4 py-3">
                            {getRetiroName(p.retiro_id)
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">{getRetiroName(p.retiro_id)}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{p.forragem || '—'}</td>
                          <td className="px-4 py-3">
                            {p.qualidade_forragem
                              ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  p.qualidade_forragem === 'ÓTIMA' ? 'bg-green-50 text-green-700' :
                                  p.qualidade_forragem === 'BOA'   ? 'bg-teal-50 text-teal-700' :
                                  'bg-yellow-50 text-yellow-700'
                                }`}>{p.qualidade_forragem}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.observacoes || '—'}</td>
                          <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(p.id)} onDelete={() => onDelete(p)} /></td>
                        </motion.tr>
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                        {filterText
                          ? `${filteredPastures.length} de ${pastures.length} pastos`
                          : `${pastures.length} pasto${pastures.length !== 1 ? 's' : ''} cadastrado${pastures.length !== 1 ? 's' : ''}`
                        }
                      </td>
                    </tr>
                  </tfoot>
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
   AnimaisTab — com sub-seção de Categorias
═══════════════════════════════════════════════════════════════ */
let _animaisCache: Animal[] = [];
let _acatCache: AnimalCategory[] = [];

interface AnimalForm { nome: string; quantidade: number; raca: string; categoria_id: string; peso_medio: number; sexo: string; bezerros_quantidade: number; bezerros_peso_medio: number; observacoes: string; }

function AnimalEditRow({ item, categories, onSave, onCancel }: {
  item: Animal; categories: AnimalCategory[];
  onSave: (d: AnimalForm) => void; onCancel: () => void;
}) {
  const [temBezerros, setTemBezerros] = useState(() => !!(item.bezerros_quantidade || item.bezerros_peso_medio));
  const { register, handleSubmit } = useForm<AnimalForm>({
    defaultValues: { nome: item.nome, quantidade: item.quantidade, raca: item.raca || '', categoria_id: item.categoria_id || '', peso_medio: item.peso_medio ?? 0, sexo: item.sexo || '', bezerros_quantidade: item.bezerros_quantidade ?? 0, bezerros_peso_medio: item.bezerros_peso_medio ?? 0, observacoes: item.observacoes || '' },
  });
  function handleSave(data: AnimalForm) {
    onSave(!temBezerros ? { ...data, bezerros_quantidade: 0, bezerros_peso_medio: 0 } : data);
  }
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...upperReg(register('nome', { required: true }))} className={inputClass} /></td>
      <td className="px-4 py-2"><input type="number" min="0" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} /></td>
      <td className="px-4 py-2">
        <select {...register('categoria_id')} className={inputClass}>
          <option value="">—</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </td>
      <td className="px-4 py-2"><input type="number" min="0" step="0.1" placeholder="kg" {...register('peso_medio', { valueAsNumber: true })} className={inputClass} /></td>
      <td className="px-4 py-2">
        <select {...register('raca')} className={inputClass}>
          <option value="">—</option>
          {RACAS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <select {...register('sexo')} className={inputClass}>
          <option value="">—</option>
          <option value="MACHO">MACHO</option>
          <option value="FÊMEA">FÊMEA</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="space-y-1">
          <div className="flex rounded border border-gray-200 overflow-hidden text-xs font-medium w-fit">
            <button type="button" onClick={() => setTemBezerros(true)}
              className={`px-2 py-1 transition-colors ${temBezerros ? 'bg-teal-600 text-white' : 'bg-white text-gray-500'}`}>Sim</button>
            <button type="button" onClick={() => setTemBezerros(false)}
              className={`px-2 py-1 border-l border-gray-200 transition-colors ${!temBezerros ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500'}`}>Não</button>
          </div>
          <input type="number" min="0" placeholder="0" disabled={!temBezerros}
            {...register('bezerros_quantidade', { valueAsNumber: true })}
            className={`${inputClass} ${!temBezerros ? 'opacity-40 cursor-not-allowed' : ''}`} />
        </div>
      </td>
      <td className="px-4 py-2">
        <input type="number" min="0" step="0.1" placeholder="kg" disabled={!temBezerros}
          {...register('bezerros_peso_medio', { valueAsNumber: true })}
          className={`${inputClass} ${!temBezerros ? 'opacity-40 cursor-not-allowed' : ''}`} />
      </td>
      <td className="px-4 py-2"><input {...upperReg(register('observacoes'))} className={inputClass} /></td>
      <td className="px-4 py-2"><SaveCancelBtns onSave={handleSubmit(handleSave)} onCancel={onCancel} /></td>
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
  const [temBezerros, setTemBezerros] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnimalForm>({
    defaultValues: { quantidade: 0, peso_medio: 0, bezerros_quantidade: 0, bezerros_peso_medio: 0 },
  });

  useEffect(() => {
    if (!activeFarmId) return;
    let mounted = true;
    setLoading(true);
    const tid = setTimeout(() => { if (mounted) setLoading(false); }, 15_000);
    (async () => {
      try {
        const [animRes, catRes] = await Promise.all([
          supabaseAdmin.from('animals').select('*').eq('farm_id', activeFarmId).order('nome'),
          supabaseAdmin.from('animal_categories').select('*').eq('farm_id', activeFarmId).order('nome'),
        ]);
        if (!mounted) return;
        _animaisCache = animRes.data ?? []; setItems(_animaisCache);
        _acatCache = catRes.data ?? []; setCategories(_acatCache);
      } finally {
        clearTimeout(tid);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; clearTimeout(tid); };
  }, [activeFarmId]);

  async function onAdd(data: AnimalForm) {
    if (!activeFarmId) return;
    const pesoMedio = data.peso_medio > 0 ? data.peso_medio : null;
    const bezQtd    = temBezerros && data.bezerros_quantidade > 0 ? data.bezerros_quantidade : null;
    const bezPeso   = temBezerros && data.bezerros_peso_medio > 0 ? data.bezerros_peso_medio : null;
    const payload = {
      nome: data.nome, quantidade: data.quantidade,
      raca: data.raca || null, categoria_id: data.categoria_id || null,
      observacoes: data.observacoes || null, farm_id: activeFarmId,
      ...(data.sexo      && { sexo: data.sexo }),
      ...(pesoMedio      && { peso_medio: pesoMedio }),
      ...(bezQtd         && { bezerros_quantidade: bezQtd }),
      ...(bezPeso        && { bezerros_peso_medio: bezPeso }),
    };
    const { data: row, error } = await supabaseAdmin.from('animals').insert(payload).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _animaisCache = [..._animaisCache, row]; setItems(_animaisCache);
    toast.success('Lote adicionado!', { description: data.nome });
    reset(); setTemBezerros(false); setShowAddForm(false);
  }

  async function onEditSave(id: string, data: AnimalForm) {
    const pesoMedio = data.peso_medio         > 0 ? data.peso_medio         : null;
    const bezQtd    = data.bezerros_quantidade > 0 ? data.bezerros_quantidade : null;
    const bezPeso   = data.bezerros_peso_medio > 0 ? data.bezerros_peso_medio : null;
    const payload = {
      nome: data.nome, quantidade: data.quantidade,
      raca: data.raca || null, categoria_id: data.categoria_id || null,
      observacoes: data.observacoes || null,
      ...(data.sexo && { sexo: data.sexo }),
      ...(pesoMedio && { peso_medio: pesoMedio }),
      ...(bezQtd    && { bezerros_quantidade: bezQtd }),
      ...(bezPeso   && { bezerros_peso_medio: bezPeso }),
    };
    const { error } = await supabaseAdmin.from('animals').update(payload).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _animaisCache = _animaisCache.map(a => a.id === id ? { ...a, nome: data.nome, quantidade: data.quantidade, raca: data.raca || undefined, categoria_id: data.categoria_id || undefined, peso_medio: pesoMedio ?? undefined, sexo: data.sexo || undefined, bezerros_quantidade: bezQtd ?? undefined, bezerros_peso_medio: bezPeso ?? undefined, observacoes: data.observacoes || undefined } : a); setItems(_animaisCache);
    toast.success('Lote atualizado!'); setEditingId(null);
  }

  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabaseAdmin.from('animals').delete().eq('id', id);
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
              initialItems={categories}
              onDataChange={(list) => { _acatCache = list as AnimalCategory[]; setCategories(_acatCache); }}
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
                <input placeholder="Ex.: Lote A" {...upperReg(register('nome', { required: true }))}
                  className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
              </div>
              <div>
                <label className={labelClass}>Cabeças</label>
                <input type="number" min="0" placeholder="Ex.: 100" {...register('quantidade', { min: 0, valueAsNumber: true })} className={inputClass} />
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
                <select {...register('raca')} className={inputClass}>
                  <option value="">— Selecione —</option>
                  {RACAS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Peso Médio (kg)</label>
                <input type="number" min="0" step="0.1" placeholder="Ex.: 450" {...register('peso_medio', { valueAsNumber: true })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sexo</label>
                <select {...register('sexo')} className={inputClass}>
                  <option value="">—</option>
                  <option value="MACHO">MACHO</option>
                  <option value="FÊMEA">FÊMEA</option>
                </select>
              </div>
              <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bezerros</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Possui bezerros?</span>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                      <button type="button" onClick={() => setTemBezerros(true)}
                        className={`px-3 py-1.5 transition-colors ${temBezerros ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                        Sim
                      </button>
                      <button type="button" onClick={() => setTemBezerros(false)}
                        className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${!temBezerros ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                        Não
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`grid grid-cols-2 gap-4 transition-opacity ${!temBezerros ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                  <div>
                    <label className={labelClass}>Quantidade de Animais</label>
                    <input type="number" min="0" placeholder="Ex.: 0" {...register('bezerros_quantidade', { valueAsNumber: true })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Peso Médio (kg)</label>
                    <input type="number" min="0" step="0.1" placeholder="Ex.: 0" {...register('bezerros_peso_medio', { valueAsNumber: true })} className={inputClass} />
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Observações</label>
                <input placeholder="Ex.: Info adicional" {...upperReg(register('observacoes'))} className={inputClass} />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); reset(); setTemBezerros(false); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? <SkeletonTable rows={4} cols={10} /> : (
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
                      {['Lote', 'Cabeças', 'Categoria', 'Peso Médio', 'Raça', 'Sexo', 'Bez. Qtd', 'Bez. Peso', 'Obs', 'Ações'].map(h => (
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
                          <td className="px-4 py-3 text-gray-600">{item.peso_medio ? `${item.peso_medio} kg` : '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{item.raca || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{item.sexo || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{item.bezerros_quantidade ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{item.bezerros_peso_medio ? `${item.bezerros_peso_medio} kg` : '—'}</td>
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
interface SupplementForm { nome: string; unidade: string; peso: number; valor_kg: number; observacoes: string; }

function SupEditRow({ item, onSave, onCancel }: { item: SupplementType; onSave: (d: SupplementForm) => void; onCancel: () => void; }) {
  const { register, handleSubmit } = useForm<SupplementForm>({
    defaultValues: { nome: item.nome, unidade: item.unidade, peso: item.peso ?? 0, valor_kg: item.valor_kg ?? 0, observacoes: item.observacoes || '' },
  });
  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...upperReg(register('nome', { required: true }))} className={inputClass} /></td>
      <td className="px-4 py-2">
        <select {...register('unidade')} className={inputClass}>
          <option value="kg">KG</option>
          <option value="saco">SACO</option>
        </select>
      </td>
      <td className="px-4 py-2"><input type="number" step="0.1" min="0" {...register('peso', { valueAsNumber: true })} className={inputClass} placeholder="Ex.: 30" /></td>
      <td className="px-4 py-2"><input type="number" step="0.01" min="0" {...register('valor_kg', { valueAsNumber: true })} className={inputClass} placeholder="Ex.: 2.50" /></td>
      <td className="px-4 py-2"><input {...upperReg(register('observacoes'))} className={inputClass} /></td>
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
  const [filterText, setFilterText] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplementForm>({ defaultValues: { unidade: 'kg', peso: 0, valor_kg: 0 } });

  useEffect(() => {
    if (!activeFarmId) return;
    let mounted = true;
    setLoading(true);
    const tid = setTimeout(() => { if (mounted) setLoading(false); }, 15_000);
    (async () => {
      try {
        const { data } = await supabaseAdmin.from('supplement_types').select('*').eq('farm_id', activeFarmId).order('nome');
        if (mounted) { _suplementosCache = data ?? []; setItems(_suplementosCache); }
      } finally {
        clearTimeout(tid);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; clearTimeout(tid); };
  }, [activeFarmId]);

  const filteredItems = items.filter(s =>
    !filterText || s.nome.toLowerCase().includes(filterText.toLowerCase())
  );

  async function onAdd(data: SupplementForm) {
    if (!activeFarmId) return;
    const payload: Record<string, unknown> = {
      nome: data.nome,
      unidade: data.unidade,
      observacoes: data.observacoes || null,
      farm_id: activeFarmId,
      // só inclui colunas novas se tiverem valor — evita erro se SQL ainda não foi rodado
      ...(data.peso     > 0 && { peso:     data.peso }),
      ...(data.valor_kg > 0 && { valor_kg: data.valor_kg }),
    };
    const { data: row, error } = await supabaseAdmin.from('supplement_types').insert(payload).select().single();
    if (error) { toast.error('Erro ao adicionar.'); return; }
    _suplementosCache = [..._suplementosCache, row].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    setItems(_suplementosCache);
    toast.success('Suplemento adicionado!', { description: data.nome });
    reset({ unidade: 'kg', peso: 0, valor_kg: 0 }); setShowAddForm(false);
  }
  async function onEditSave(id: string, data: SupplementForm) {
    const payload: Record<string, unknown> = {
      nome: data.nome,
      unidade: data.unidade,
      observacoes: data.observacoes || null,
      ...(data.peso     > 0 && { peso:     data.peso }),
      ...(data.valor_kg > 0 && { valor_kg: data.valor_kg }),
    };
    const { error } = await supabaseAdmin.from('supplement_types').update(payload).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _suplementosCache = _suplementosCache.map(s => s.id === id ? { ...s, ...data } : s);
    setItems(_suplementosCache);
    toast.success('Suplemento atualizado!'); setEditingId(null);
  }
  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabaseAdmin.from('supplement_types').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover.'); return; }
    _suplementosCache = _suplementosCache.filter(s => s.id !== id); setItems(_suplementosCache);
    toast.success('Suplemento removido.');
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar suplemento..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
          />
        </div>
        <AddBtn label="Novo Suplemento" onClick={() => setShowAddForm(v => !v)} />
      </div>
      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Adicionar Suplemento</h2>
          <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome *</label>
              <input placeholder="Ex.: Mineral Adensado" {...upperReg(register('nome', { required: true }))} className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className={labelClass}>Unidade</label>
              <select {...register('unidade')} className={inputClass}>
                <option value="kg">KG</option>
                <option value="saco">SACO</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Peso por Unidade (kg)</label>
              <input type="number" step="0.1" min="0" placeholder="Ex.: 30" {...register('peso', { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Valor / KG (R$)</label>
              <input type="number" step="0.01" min="0" placeholder="Ex.: 2.50" {...register('valor_kg', { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Observações</label>
              <input placeholder="Ex.: Info adicional" {...upperReg(register('observacoes'))} className={inputClass} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Adicionar</button>
              <button type="button" onClick={() => { setShowAddForm(false); reset({ unidade: 'kg', peso: 0, valor_kg: 0 }); }} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={6} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="py-16 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum suplemento cadastrado</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Nome', 'Unidade', 'Peso (kg)', 'Valor/KG (R$)', 'Obs', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                        Nenhum suplemento encontrado para "{filterText}"
                      </td>
                    </tr>
                  ) : filteredItems.map(item => editingId === item.id ? (
                    <SupEditRow key={item.id} item={item} onSave={d => onEditSave(item.id, d)} onCancel={() => setEditingId(null)} />
                  ) : (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                      <td className="px-4 py-3 text-gray-600 uppercase">{item.unidade}</td>
                      <td className="px-4 py-3 text-gray-600">{item.peso ? `${item.peso} kg` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.valor_kg ? `R$ ${item.valor_kg.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.observacoes || '—'}</td>
                      <td className="px-4 py-3"><ActionBtns onEdit={() => setEditingId(item.id)} onDelete={() => onDelete(item.id, item.nome)} /></td>
                    </motion.tr>
                  ))}
                </tbody>
                {filterText && (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                        {filteredItems.length} de {items.length} suplementos
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
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
  const { register, handleSubmit, setValue } = useForm<EmployeeForm>({
    defaultValues: { nome: item.nome, funcao: item.funcao || '', contato: item.contato || '' },
  });
  const contatoReg = register('contato');

  function handleContatoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    setValue('contato', formatted, { shouldValidate: false });
  }

  return (
    <tr className="bg-teal-50">
      <td className="px-4 py-2"><input {...upperReg(register('nome', { required: true }))} className={inputClass} /></td>
      <td className="px-4 py-2"><input {...upperReg(register('funcao'))} className={inputClass} /></td>
      <td className="px-4 py-2">
        <input {...contatoReg} onChange={handleContatoChange} className={inputClass} placeholder="Ex.: (00) 00000-0000" />
      </td>
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
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EmployeeForm>();

  const contatoReg = register('contato');

  function handleContatoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    setValue('contato', formatted, { shouldValidate: false });
  }

  useEffect(() => {
    if (!activeFarmId) return;
    let mounted = true;
    setLoading(true);
    const tid = setTimeout(() => { if (mounted) setLoading(false); }, 15_000);
    (async () => {
      try {
        const { data, error } = await supabaseAdmin.from('employees').select('*').eq('farm_id', activeFarmId).order('nome');
        if (!mounted) return;
        if (error) {
          toast.error('Tabela de funcionários não encontrada. Execute ajustes_v116b.sql no Supabase.');
        } else {
          _funcionariosCache = data ?? []; setItems(_funcionariosCache);
        }
      } finally {
        clearTimeout(tid);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; clearTimeout(tid); };
  }, [activeFarmId]);

  async function onAdd(data: EmployeeForm) {
    if (!activeFarmId) {
      toast.error('Fazenda não selecionada.');
      return;
    }
    const { data: row, error } = await supabaseAdmin
      .from('employees')
      .insert({ nome: data.nome, funcao: data.funcao || null, contato: data.contato || null, farm_id: activeFarmId })
      .select()
      .single();
    if (error) {
      toast.error('Erro ao adicionar funcionário. Verifique se a tabela employees existe.');
      return;
    }
    _funcionariosCache = [..._funcionariosCache, row]; setItems(_funcionariosCache);
    toast.success('Funcionário adicionado!', { description: data.nome });
    reset(); setShowAddForm(false);
  }
  async function onEditSave(id: string, data: EmployeeForm) {
    const { error } = await supabaseAdmin.from('employees').update({ nome: data.nome, funcao: data.funcao || null, contato: data.contato || null }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    _funcionariosCache = _funcionariosCache.map(e => e.id === id ? { ...e, ...data } : e); setItems(_funcionariosCache);
    toast.success('Funcionário atualizado!'); setEditingId(null);
  }
  async function onDelete(id: string, nome: string) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    const { error } = await supabaseAdmin.from('employees').delete().eq('id', id);
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
            <div>
              <label className={labelClass}>Nome *</label>
              <input placeholder="Ex.: João Silva" {...upperReg(register('nome', { required: true }))} className={`${inputClass} ${errors.nome ? 'border-red-400' : ''}`} />
            </div>
            <div>
              <label className={labelClass}>Função</label>
              <input placeholder="Ex.: Veterinário" {...upperReg(register('funcao'))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contato</label>
              <input
                {...contatoReg}
                onChange={handleContatoChange}
                placeholder="Ex.: (00) 00000-0000"
                className={inputClass}
              />
            </div>
            <div className="col-span-3 flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); reset(); }} className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}
      {loading ? <SkeletonTable rows={4} cols={4} /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="py-16 text-center"><Users className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Nenhum funcionário cadastrado</p></div>
          ) : (
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
        {activeTab === 'animais'      && <AnimaisTab />}
        {activeTab === 'forragens'    && <SimpleTab table="forage_types" label="Forragem" icon={Sprout} emptyText="Nenhuma forragem cadastrada" newLabel="Nova Forragem" />}
        {activeTab === 'suplementos'  && <SuplementosTab />}
        {activeTab === 'funcionarios' && <FuncionariosTab />}

      </motion.div>
    </div>
  );
}
