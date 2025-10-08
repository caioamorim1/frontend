import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Se ainda estiver a verificar o token, pode mostrar uma mensagem
  if (loading && !isAuthenticated) {
    return <div>A carregar sessão...</div>;
  }

  // Se não estiver autenticado, redireciona para o login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se precisar de alterar a palavra-passe (mesmo sendo admin, é um fluxo possível)
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Se estiver autenticado, permite o acesso a qualquer rota filha
  return <Outlet />;
}