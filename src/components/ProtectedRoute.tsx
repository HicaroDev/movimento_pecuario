import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Module } from '../types/user';

export function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function ModuleRoute({ module }: { module: Module }) {
  const { hasModule } = useAuth();
  if (!hasModule(module)) return <Navigate to="/" replace />;
  return <Outlet />;
}
