import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Module } from '../types/user';

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function ModuleRoute({ module }: { module: Module }) {
  const { hasModule, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!hasModule(module)) return <Navigate to="/" replace />;
  return <Outlet />;
}
