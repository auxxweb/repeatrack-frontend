import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Services from './pages/Services.jsx';
import Visits from './pages/Visits.jsx';
import Bookings from './pages/Bookings.jsx';
import Comeback from './pages/Comeback.jsx';
import ComebackPage from './pages/ComebackPage.jsx';
import Reports from './pages/Reports.jsx';
import WhatsAppSettings from './pages/WhatsAppSettings.jsx';
import PublicBook from './pages/PublicBook.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminBusinesses from './pages/AdminBusinesses.jsx';

function LoginRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'superadmin' ? '/admin' : '/'} replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/book/:slug" element={<PublicBook />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <RoleRoute allow="superadmin">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/businesses" element={<AdminBusinesses />} />
      </Route>

      <Route
        element={
          <RoleRoute allow="business">
            <Layout />
          </RoleRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/comeback" element={<Comeback />} />
        <Route path="/comebackpage" element={<ComebackPage />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/whatsapp-settings" element={<WhatsAppSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
