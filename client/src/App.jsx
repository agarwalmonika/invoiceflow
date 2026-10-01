import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import InvoiceList from './pages/invoice/InvoiceList';
import CreateInvoice from './pages/invoice/CreateInvoice';
import EditInvoice from './pages/invoice/EditInvoice';
import InvoiceDetail from './pages/invoice/InvoiceDetail';
import ClientList from './pages/client/ClientList';
import Reports from './pages/reports/Reports';
import Subscription from './pages/subscription/Subscription';
import SubscriptionSuccess from './pages/subscription/SubscriptionSuccess';
import Profile from './pages/profile/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading InvoiceFlow…</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices/:id/edit" element={<EditInvoice />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="reports" element={<Reports />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="subscription/success" element={<SubscriptionSuccess />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
