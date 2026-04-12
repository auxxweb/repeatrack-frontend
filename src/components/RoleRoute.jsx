import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

export default function RoleRoute({ children, allow }) {
  const { user, loading, isAuthenticated } = useAuth();
  const loc = useLocation();

  if (loading) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (allow === 'superadmin' && user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  if (allow === 'business' && user?.role !== 'business') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
