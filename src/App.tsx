import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute, ModuleRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Relatorio } from './pages/Relatorio';
import { Formulario } from './pages/Formulario';
import { Fazendas } from './pages/Fazendas';
import { Usuarios } from './pages/Usuarios';
import { Pastos } from './pages/Pastos';

const router = createBrowserRouter([
  { path: '/login', Component: Login },
  {
    Component: ProtectedRoute,
    children: [{
      path: '/',
      Component: DashboardLayout,
      children: [
        { index: true, Component: Relatorio },
        {
          element: <ModuleRoute module="formulario" />,
          children: [{ path: 'formulario', Component: Formulario }],
        },
        {
          element: <ModuleRoute module="pastos" />,
          children: [{ path: 'pastos', Component: Pastos }],
        },
        {
          element: <ModuleRoute module="fazendas" />,
          children: [{ path: 'fazendas', Component: Fazendas }],
        },
        {
          element: <ModuleRoute module="usuarios" />,
          children: [{ path: 'usuarios', Component: Usuarios }],
        },
      ],
    }],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </DataProvider>
    </AuthProvider>
  );
}
