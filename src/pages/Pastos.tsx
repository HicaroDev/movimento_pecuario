import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { Leaf, Plus, Trash2, Pencil, Save, X, ChevronDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
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

function FarmSelector() {
  const { activeFarmId, selectFarm } = useData();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    farmService.list().then(list =>
      setFarms(list.filter(f => f.active).map(f => ({ id: f.id, name: f.nomeFazenda })))
    );
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

/* ─────────────── Main Pastos page ─────────────── */

export function Pastos() {
  const { pastures, addPasture, deletePasture, updatePasture, activeFarmId, loading } = useData();
  const { isAdmin, user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [farmName, setFarmName] = useState<string>(user?.name || '—');

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

  function onDelete(p: Pasture) {
    if (!window.confirm(`Remover o pasto "${p.nome}"?`)) return;
    deletePasture(p.id);
    toast.success('Pasto removido.', { description: p.nome });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
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
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Pasto
          </button>
        </div>

        {/* Admin farm selector */}
        {isAdmin && <FarmSelector />}

        {/* Add form */}
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 mb-6">
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
        )}

        {/* Table */}
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

        {/* Future: relatório de pasto placeholder */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Relatório de Pastos</p>
            <p className="text-xs text-blue-600">Em breve — análise detalhada por pasto com histórico de consumo.</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
