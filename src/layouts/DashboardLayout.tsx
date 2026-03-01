import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { FileText, BarChart3, Building2, LogOut, User, Leaf, Users, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { farmService } from '../services/farmService';
import type { Module } from '../types/user';
import type { Farm } from '../types/farm';

const navItems = [
  { path: '/',           label: 'Relatório',  icon: BarChart3,  module: 'relatorio'  as Module },
  { path: '/formulario', label: 'Formulário', icon: FileText,   module: 'formulario' as Module },
  { path: '/pastos',     label: 'Pastos',     icon: Leaf,       module: 'pastos'     as Module },
  { path: '/fazendas',   label: 'Fazendas',   icon: Building2,  module: 'fazendas'   as Module },
  { path: '/usuarios',   label: 'Usuários',   icon: Users,      module: 'usuarios'   as Module },
];

/* ── Seletor de fazenda reutilizável ── */
let _adminFarmsCache: Farm[]  = [];
let _clientFarmsCache: Farm[] = [];

function FarmSelectorWidget({ farms }: { farms: Farm[] }) {
  const { activeFarmId, selectFarm } = useData();
  if (farms.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-gray-400">
        Fazenda
      </p>
      <div className="relative">
        <select
          value={activeFarmId}
          onChange={e => selectFarm(e.target.value)}
          className="w-full h-8 pl-2.5 pr-7 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 appearance-none cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)' }}
        >
          {farms.map(f => (
            <option key={f.id} value={f.id}>{f.nomeFazenda}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-gray-400" />
      </div>
    </div>
  );
}

function AdminFarmSelector() {
  const [farms, setFarms] = useState<Farm[]>(_adminFarmsCache);
  useEffect(() => {
    farmService.list().then(list => {
      const active = list.filter(f => f.active);
      _adminFarmsCache = active;
      setFarms(active);
    });
  }, []);
  return <FarmSelectorWidget farms={farms} />;
}

function ClientFarmSelector() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>(_clientFarmsCache);
  const farmIds = user?.farmIds ?? [];

  useEffect(() => {
    if (farmIds.length <= 1) return;
    Promise.all(farmIds.map(id => farmService.findById(id))).then(results => {
      const active = results.filter((f): f is Farm => f !== null && f.active);
      _clientFarmsCache = active;
      setFarms(active);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmIds.join(',')]);

  if (farmIds.length <= 1) return null;
  return <FarmSelectorWidget farms={farms} />;
}

export function DashboardLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout, isAdmin, hasModule } = useAuth();

  const visibleNavItems = navItems.filter(item => hasModule(item.module));

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div
      className="flex h-screen"
      style={{
        background: `
          radial-gradient(ellipse at 20% 60%, rgba(26,96,64,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(11,39,72,0.05) 0%, transparent 45%),
          linear-gradient(160deg, #f8fafb 0%, #f0f9f6 40%, #f8fafb 100%)
        `,
      }}
    >
      {/* Sidebar — glassmorphism claro */}
      <aside
        className="w-64 flex flex-col flex-shrink-0 relative no-print"
        style={{
          background: 'rgba(255, 255, 255, 0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.07)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <motion.div
          className="p-5"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="rounded-xl p-3 mb-4"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <img src="/images/logo.png" alt="Movimento Pecuário" className="w-full h-auto" />
          </div>
          <h1 className="text-sm font-bold text-gray-800">Suplemento Control</h1>
          <p className="text-xs mt-0.5 truncate text-gray-400">{user?.name}</p>
        </motion.div>

        {/* Seletor de fazenda — admin (todas) ou cliente multi-fazenda */}
        {(isAdmin || (user?.farmIds?.length ?? 0) > 1) && (
          <motion.div
            className="pt-3"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isAdmin ? <AdminFarmSelector /> : <ClientFarmSelector />}
          </motion.div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item, index) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #1a6040, #0f4a30)',
                    color: '#ffffff',
                    boxShadow: '0 4px 16px rgba(26,96,64,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    border: '1px solid rgba(26,96,64,0.3)',
                  } : {
                    color: '#6b7280',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(26,96,64,0.10)', border: '1px solid rgba(26,96,64,0.15)' }}
            >
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={isAdmin
                  ? { background: 'rgba(26,96,64,0.12)', color: '#1a6040' }
                  : { background: 'rgba(59,130,246,0.12)', color: '#2563eb' }
                }
              >
                {isAdmin ? 'Admin' : 'Cliente'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl transition-all text-sm text-gray-400"
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
              (e.currentTarget as HTMLElement).style.color = '#374151';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#9ca3af';
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main
        className="flex-1 overflow-auto"
        style={{ background: '#f8fafc' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
