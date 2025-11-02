// src/components/ProtectedRoute.js
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Loader from './Loader'; // Правильный путь

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !['admin', 'operator'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;