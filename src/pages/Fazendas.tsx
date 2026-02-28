import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Plus, Trash2, Pencil, Save, X,
  Users, MapPin, Phone, Mail, ToggleLeft, ToggleRight, Upload, Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
import { userService } from '../services/userService';
import { SkeletonCard } from '../components/Skeleton';
import type { Farm } from '../types/farm';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

/* ─────────────── Modal criar / editar fazenda ─────────────── */

function FarmModal({ editing, onClose, onSaved }: {
  editing: Farm | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [logoPreview, setLogoPreview] = useState(editing?.logoUrl || '');
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Farm>({
    defaultValues: editing || { active: true },
  });

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result as string;
      setLogoPreview(r);
      setValue('logoUrl', r);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: Farm) {
    setSaving(true);
    try {
      const payload = { ...data, logoUrl: logoPreview };
      if (editing) {
        await farmService.update(editing.id, payload);
        toast.success('Fazenda atualizada!');
      } else {
        await farmService.create({ ...payload, active: data.active ?? true });
        toast.success('Fazenda cadastrada!', { description: data.nomeFazenda });
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {editing ? 'Editar Fazenda' : 'Nova Fazenda'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* Logo */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative group">
                    <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain border-2 border-gray-200 rounded-xl bg-gray-50" />
                    <button type="button" onClick={() => { setLogoPreview(''); setValue('logoUrl', ''); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-2">
                <label htmlFor="farm-logo" className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors text-sm text-gray-600 font-medium">
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Alterar logo' : 'Enviar logo'}
                </label>
                <input id="farm-logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, SVG — máx. 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome da Fazenda *</label>
                <input placeholder="Fazenda Boa Vista"
                  className={`${inputClass} ${errors.nomeFazenda ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                  {...register('nomeFazenda', { required: 'Campo obrigatório' })} />
                {errors.nomeFazenda && <p className="text-xs text-red-500 mt-1">{errors.nomeFazenda.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Responsável</label>
                <input placeholder="João Silva" {...register('nomeResponsavel')} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Quantidade de Cabeças</label>
              <input type="number" placeholder="1200"
                {...register('quantidadeCabecas', { min: 0, valueAsNumber: true })} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Endereço</label>
              <input placeholder="Cidade / Estado / Município" {...register('endereco')} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Telefone</label>
                <input placeholder="(00) 00000-0000" {...register('telefone')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>E-mail</label>
                <input type="email" placeholder="fazenda@email.com" {...register('email')} className={inputClass} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Fazenda ativa</p>
                <p className="text-xs text-gray-500">Controla se os usuários da fazenda conseguem acessar o sistema</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" {...register('active')} className="sr-only peer" />
                <div className="relative w-11 h-6 bg-gray-300 peer-checked:bg-teal-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-teal-400">
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar fazenda'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─────────────── Card da fazenda ─────────────── */

function FarmCard({ farm, onEdit, onRefresh }: {
  farm: Farm;
  onEdit: (f: Farm) => void;
  onRefresh: () => void;
}) {
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    userService.listByFarm(farm.id).then(users => setUsersCount(users.length));
  }, [farm.id]);

  async function toggleActive() {
    try {
      await farmService.update(farm.id, { active: !farm.active });
      onRefresh();
      toast.success(farm.active ? 'Fazenda desativada.' : 'Fazenda ativada.');
    } catch { toast.error('Erro ao atualizar fazenda.'); }
  }

  async function onDelete() {
    if (!window.confirm(`Excluir a fazenda "${farm.nomeFazenda}"?\n\nAtenção: os usuários vinculados perderão o acesso.`)) return;
    try {
      await farmService.remove(farm.id);
      onRefresh();
      toast.success('Fazenda removida.');
    } catch { toast.error('Erro ao remover fazenda.'); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${farm.active ? 'border-gray-200' : 'border-red-200 opacity-70'}`}>
      <div className={`h-1.5 ${farm.active ? 'bg-gradient-to-r from-teal-400 to-teal-600' : 'bg-red-300'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {farm.logoUrl ? (
              <img src={farm.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-teal-600" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{farm.nomeFazenda}</h3>
              {farm.nomeResponsavel && <p className="text-xs text-gray-500 truncate">{farm.nomeResponsavel}</p>}
            </div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${farm.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {farm.active ? '● Ativo' : '○ Inativo'}
          </span>
        </div>

        <div className="space-y-1.5 mb-4">
          {farm.quantidadeCabecas ? (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{farm.quantidadeCabecas.toLocaleString('pt-BR')} cabeças</span>
            </div>
          ) : null}
          {farm.endereco && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{farm.endereco}</span>
            </div>
          )}
          {farm.telefone && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{farm.telefone}</span>
            </div>
          )}
          {farm.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{farm.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {usersCount} usuário{usersCount !== 1 ? 's' : ''} vinculado{usersCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(farm)} title="Editar"
              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={toggleActive} title={farm.active ? 'Desativar' : 'Ativar'}
              className={`p-1.5 rounded-lg transition-colors ${farm.active ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}>
              {farm.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} title="Excluir"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── View do cliente (read-only) ─────────────── */

function MyFarmView({ farm }: { farm: Farm | null }) {
  if (!farm) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
      <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Fazenda não vinculada</p>
      <p className="text-xs text-gray-400 mt-1">Entre em contato com o administrador.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        {farm.logoUrl ? (
          <img src={farm.logoUrl} alt="Logo" className="w-16 h-16 object-contain border border-gray-200 rounded-xl bg-gray-50" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-teal-600" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{farm.nomeFazenda}</h2>
          {farm.nomeResponsavel && <p className="text-sm text-gray-500">{farm.nomeResponsavel}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {farm.quantidadeCabecas ? (
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4 text-gray-400" />
            <span><span className="font-semibold">{farm.quantidadeCabecas.toLocaleString('pt-BR')}</span> cabeças</span>
          </div>
        ) : null}
        {farm.endereco && <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /><span>{farm.endereco}</span></div>}
        {farm.telefone && <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400" /><span>{farm.telefone}</span></div>}
        {farm.email    && <div className="flex items-center gap-2 text-gray-700"><Mail  className="w-4 h-4 text-gray-400" /><span>{farm.email}</span></div>}
      </div>
    </div>
  );
}

/* ─────────────── Página principal ─────────────── */

// Cache de módulo — persiste entre navegações sem precisar de contexto
let _farmsCache: Farm[]    = [];
let _myFarmCache: Farm | null = null;

export function Fazendas() {
  const { user, isAdmin } = useAuth();
  const [farms, setFarms]         = useState<Farm[]>(_farmsCache);
  const [loading, setLoading]     = useState(_farmsCache.length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Farm | null>(null);
  const [myFarm, setMyFarm]       = useState<Farm | null>(_myFarmCache);
  const [refreshTick, setRefreshTick] = useState(0);

  async function refresh() {
    if (_farmsCache.length === 0) setLoading(true);
    const result = await farmService.list();
    _farmsCache = result;
    setFarms(result);
    setLoading(false);
  }

  // Recarrega apenas se tab ficou oculto 30+ segundos
  const hiddenAtRef = useRef<number | null>(null);
  useEffect(() => {
    const THRESHOLD = 30_000;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const elapsed = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (elapsed > THRESHOLD) setRefreshTick(t => t + 1);
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => { refresh(); }, [refreshTick]);

  // Carrega fazenda do cliente
  useEffect(() => {
    if (!isAdmin && user?.id) {
      userService.findById(user.id).then(profile => {
        if (profile?.farmId) farmService.findById(profile.farmId).then(f => {
          _myFarmCache = f;
          setMyFarm(f);
        });
      });
    }
  }, [user?.id, isAdmin]);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(f: Farm) { setEditing(f); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  /* ── Admin view ── */
  if (isAdmin) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Fazendas</h1>
            <p className="text-sm text-gray-500">
              {farms.filter(f => f.active).length} ativa{farms.filter(f => f.active).length !== 1 ? 's' : ''}
              {' '}· {farms.length} total
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Fazenda
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : farms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma fazenda cadastrada</p>
            <button onClick={openCreate}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold mx-auto hover:bg-teal-700 transition-colors">
              <Plus className="w-4 h-4" /> Cadastrar primeira fazenda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map(f => <FarmCard key={f.id} farm={f} onEdit={openEdit} onRefresh={refresh} />)}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen && <FarmModal editing={editing} onClose={closeModal} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );

  /* ── Client view ── */
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Fazenda</h1>
        </div>
        <MyFarmView farm={myFarm} />
      </motion.div>
    </div>
  );
}
