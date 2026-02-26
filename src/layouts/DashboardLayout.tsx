import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { FileText, BarChart3, Building2, LogOut, User, Leaf, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import type { Module } from '../types/user';

const navItems = [
  { path: '/',           label: 'Relatório',  icon: BarChart3,  module: 'relatorio'  as Module },
  { path: '/formulario', label: 'Formulário', icon: FileText,   module: 'formulario' as Module },
  { path: '/pastos',     label: 'Pastos',     icon: Leaf,       module: 'pastos'     as Module },
  { path: '/fazendas',   label: 'Fazendas',   icon: Building2,  module: 'fazendas'   as Module },
  { path: '/usuarios',   label: 'Usuários',   icon: Users,      module: 'usuarios'   as Module },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout, isAdmin, hasModule } = useAuth();

  const visibleNavItems = navItems.filter(item => hasModule(item.module));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className="w-64 text-white flex flex-col shadow-2xl flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom, #1a1f2e, #2d3548)' }}
      >
        {/* Logo */}
        <motion.div
          className="p-5 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl p-3 mb-4 shadow-md">
            <img src="/images/logo.png" alt="Movimento Pecuário" className="w-full h-auto" />
          </div>
          <h1 className="text-base font-bold text-white">Suplemento Control</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.name}</p>
        </motion.div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  style={isActive ? { boxShadow: '0 4px 14px rgba(26,96,64,0.4)' } : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                isAdmin ? 'bg-teal-500/20 text-teal-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {isAdmin ? 'Admin' : 'Cliente'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
