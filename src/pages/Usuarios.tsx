import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCog, Plus, Pencil, Trash2, Save, X, Eye, EyeOff,
  ToggleLeft, ToggleRight, Shield, BarChart3, FileText, Leaf, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { farmService } from '../services/farmService';
import type { FarmUser, Module, Role } from '../types/user';
import type { Farm } from '../types/farm';

const inputClass =
  'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const ALL_MODULES: Module[] = ['relatorio', 'formulario', 'pastos', 'fazendas', 'usuarios'];
const MODULE_LABELS: Record<Module, string> = {
  relatorio: 'Relatório', formulario: 'Formulário', pastos: 'Pastos',
  fazendas: 'Fazendas', usuarios: 'Usuários',
};
const MODULE_ICONS: Record<Module, React.ElementType> = {
  relatorio: BarChart3, formulario: FileText, pastos: Leaf,
  fazendas: Building2, usuarios: UserCog,
};

/* ─────────────── Modal de usuário ─────────────── */

interface UserFormData { name: string; email: string; password: string; role: Role; farmId: string; }

function UserModal({ editing, currentUserId, onClose, onSaved }: {
  editing: FarmUser | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [farms, setFarms]     = useState<Farm[]>([]);
  const [modules, setModules] = useState<Module[]>(editing?.modules ?? ALL_MODULES);
  const [active, setActive]   = useState<boolean>(editing?.active ?? true);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    farmService.list().then(list => setFarms(list.filter(f => f.active)));
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      name: editing?.name ?? '', email: editing?.email ?? '',
      password: '', role: editing?.role ?? 'client',
      farmId: editing?.farmId ?? '',
    },
  });

  const selectedRole = watch('role');

  function toggleModule(m: Module) {
    setModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  async function onSubmit(data: UserFormData) {
    setSaving(true);
    try {
      const payload: Partial<FarmUser> = {
        name: data.name, email: data.email, role: data.role,
        farmId: data.role === 'admin' ? undefined : (data.farmId || undefined),
        modules, active,
      };
      if (data.password) payload.password = data.password;

      if (editing) {
        await userService.update(editing.id, payload);
        toast.success('Usuário atualizado!');
      } else {
        if (!data.password) { toast.error('Senha é obrigatória.'); setSaving(false); return; }
        await userService.create({ ...payload, password: data.password } as Omit<FarmUser, 'id' | 'createdAt'>);
        toast.success('Usuário criado!', { description: data.name });
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
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{editing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className={labelClass}>Nome *</label>
              <input placeholder="Nome do usuário"
                className={`${inputClass} ${errors.name ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                {...register('name', { required: 'Campo obrigatório' })} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>E-mail *</label>
              <input type="email" placeholder="usuario@email.com"
                className={`${inputClass} ${errors.email ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                {...register('email', { required: 'Campo obrigatório' })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Senha {editing ? <span className="text-gray-400 font-normal">(vazio = manter)</span> : '*'}</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  className={`${inputClass} pr-10 ${errors.password ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                  {...register('password', { minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Perfil</label>
              <select className={inputClass} {...register('role')}>
                <option value="client">Cliente / Funcionário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {selectedRole === 'client' && (
              <div>
                <label className={labelClass}>Fazenda vinculada</label>
                {farms.length > 0 ? (
                  <select className={inputClass} {...register('farmId')}>
                    {farms.map(f => <option key={f.id} value={f.id}>{f.nomeFazenda}</option>)}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Nenhuma fazenda ativa. Cadastre uma fazenda primeiro.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>Módulos de acesso</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ALL_MODULES.map(m => {
                  const Icon = MODULE_ICONS[m];
                  const on = modules.includes(m);
                  return (
                    <label key={m}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        on ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      <input type="checkbox" checked={on} onChange={() => toggleModule(m)} className="sr-only" />
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{MODULE_LABELS[m]}</span>
                      {on && <Shield className="w-3 h-3 ml-auto text-teal-500" />}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-800">Usuário ativo</p>
                <p className="text-xs text-gray-500">{active ? 'Acesso liberado' : 'Acesso bloqueado'}</p>
              </div>
              <button type="button" onClick={() => setActive(v => !v)}
                disabled={editing?.id === currentUserId}
                className={`transition-colors ${active ? 'text-teal-600' : 'text-gray-400'} disabled:opacity-40`}>
                {active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─────────────── Linha de usuário na tabela ─────────────── */

function UserRow({ u, currentUserId, onEdit, onRefresh }: {
  u: FarmUser;
  currentUserId: string;
  onEdit: (u: FarmUser) => void;
  onRefresh: () => void;
}) {
  const [farm, setFarm] = useState<Farm | null>(null);

  useEffect(() => {
    if (u.farmId) farmService.findById(u.farmId).then(f => setFarm(f));
  }, [u.farmId]);

  async function toggleActive() {
    if (u.id === currentUserId) return;
    try {
      await userService.update(u.id, { active: !u.active });
      onRefresh();
      toast.success(u.active ? 'Usuário desativado.' : 'Usuário ativado.');
    } catch { toast.error('Erro ao atualizar.'); }
  }

  async function onDelete() {
    if (u.id === currentUserId) { toast.error('Não é possível excluir seu próprio usuário.'); return; }
    if (!window.confirm(`Excluir "${u.name}"?`)) return;
    try {
      await userService.remove(u.id);
      onRefresh();
      toast.success('Usuário removido.');
    } catch { toast.error('Erro ao remover.'); }
  }

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
          <p className="text-xs text-gray-500">{u.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
          {u.role === 'admin' ? 'Admin' : 'Cliente'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-600">{farm?.nomeFazenda || <span className="text-gray-400 italic">—</span>}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {u.modules.map(m => (
            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {MODULE_LABELS[m]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {u.active ? '● Ativo' : '○ Inativo'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(u)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil className="w-4 h-4" /></button>
          <button onClick={toggleActive} disabled={u.id === currentUserId}
            className={`p-1.5 rounded transition-colors disabled:opacity-30 ${u.active ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}>
            {u.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} disabled={u.id === currentUserId}
            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ─────────────── Página principal ─────────────── */

export function Usuarios() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers]         = useState<FarmUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<FarmUser | null>(null);

  // Cliente: dados da sua fazenda
  const [farmUsers, setFarmUsers] = useState<FarmUser[]>([]);
  const [farm, setFarm]           = useState<Farm | null>(null);

  async function refresh() { setUsers(await userService.list()); }

  useEffect(() => {
    if (isAdmin) {
      refresh();
    } else if (user?.id) {
      userService.findById(user.id).then(profile => {
        if (profile?.farmId) {
          userService.listByFarm(profile.farmId).then(setFarmUsers);
          farmService.findById(profile.farmId).then(f => setFarm(f));
        }
      });
    }
  }, [user?.id, isAdmin]);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(u: FarmUser) { setEditing(u); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  /* ── Admin ── */
  if (isAdmin) return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Usuários</h1>
            <p className="text-sm text-gray-500">
              {users.filter(u => u.active).length} ativo{users.filter(u => u.active).length !== 1 ? 's' : ''}
              {' '}· {users.length} total
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Usuário', 'Perfil', 'Fazenda', 'Módulos', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhum usuário cadastrado.</td></tr>
                ) : (
                  users.map(u => <UserRow key={u.id} u={u} currentUserId={user!.id} onEdit={openEdit} onRefresh={refresh} />)
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && <UserModal editing={editing} currentUserId={user!.id} onClose={closeModal} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );

  /* ── Cliente ── */
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto">

        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suplemento Control</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Usuários</h1>
          <p className="text-sm text-gray-500">
            {farm?.nomeFazenda || 'Minha fazenda'} · {farmUsers.length} usuário{farmUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">Equipe da Fazenda</span>
          </div>

          {farmUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <UserCog className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum usuário vinculado a esta fazenda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {farmUsers.map(u => (
                <li key={u.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {u.active ? '● Ativo' : '○ Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{u.email}</p>
                      <div className="flex flex-wrap gap-1">
                        {u.modules.map(m => {
                          const Icon = MODULE_ICONS[m];
                          return (
                            <span key={m} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                              <Icon className="w-3 h-3" /> {MODULE_LABELS[m]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
