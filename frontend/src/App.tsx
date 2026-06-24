import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/app/page';
import LoginPage from '@/app/auth/login';
import SignInPage from '@/app/auth/signin';
import SignUpPage from '@/app/auth/signup';
import DashboardPage from '@/app/dashboard/page';
import CreateEscrowPage from '@/app/escrow/new/page';
import EscrowDetailPage from '@/app/escrow/[id]/page';
import DisputesPage from '@/app/disputes/page';
import AnalyticsPage from '@/app/analytics/page';
import ChatPage from '@/app/chat/page';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { ToastContainer } from '@/components/shared/ToastContainer';

// Redirect route for general /dashboard access
function DashboardRedirect() {
  const { user, token } = useAuthStore();
  if (!token || !user) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  if (user.role === 'CLIENT') {
    return <Navigate to="/client/dashboard" replace />;
  } else if (user.role === 'FREELANCER') {
    return <Navigate to="/freelancer/dashboard" replace />;
  } else if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />
        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/login" element={<Navigate to="/auth/sign-in" replace />} />
        <Route path="/auth/login-legacy" element={<LoginPage />} />

        {/* Generic Dashboard Redirect */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* CLIENT Protected Routes */}
        <Route path="/client/dashboard" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="overview" /></ProtectedRoute>} />
        <Route path="/client/jobs" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="jobs" /></ProtectedRoute>} />
        <Route path="/client/escrows" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="escrows" /></ProtectedRoute>} />
        <Route path="/client/payments" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="payments" /></ProtectedRoute>} />
        <Route path="/client/reviews" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="reviews" /></ProtectedRoute>} />
        <Route path="/client/settings" element={<ProtectedRoute allowedRoles={['CLIENT']}><DashboardPage tab="settings" /></ProtectedRoute>} />
        <Route path="/client/escrow/new" element={<ProtectedRoute allowedRoles={['CLIENT']}><CreateEscrowPage /></ProtectedRoute>} />
        <Route path="/client/escrow/:id" element={<ProtectedRoute allowedRoles={['CLIENT']}><EscrowDetailPage /></ProtectedRoute>} />
        <Route path="/client/chat" element={<ProtectedRoute allowedRoles={['CLIENT']}><ChatPage /></ProtectedRoute>} />
        <Route path="/client/analytics" element={<ProtectedRoute allowedRoles={['CLIENT']}><AnalyticsPage /></ProtectedRoute>} />

        {/* FREELANCER Protected Routes */}
        <Route path="/freelancer/dashboard" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="overview" /></ProtectedRoute>} />
        <Route path="/freelancer/jobs" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="jobs" /></ProtectedRoute>} />
        <Route path="/freelancer/applications" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="applications" /></ProtectedRoute>} />
        <Route path="/freelancer/escrows" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="escrows" /></ProtectedRoute>} />
        <Route path="/freelancer/payments" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="payments" /></ProtectedRoute>} />
        <Route path="/freelancer/reviews" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="reviews" /></ProtectedRoute>} />
        <Route path="/freelancer/settings" element={<ProtectedRoute allowedRoles={['FREELANCER']}><DashboardPage tab="settings" /></ProtectedRoute>} />
        <Route path="/freelancer/escrow/:id" element={<ProtectedRoute allowedRoles={['FREELANCER']}><EscrowDetailPage /></ProtectedRoute>} />
        <Route path="/freelancer/chat" element={<ProtectedRoute allowedRoles={['FREELANCER']}><ChatPage /></ProtectedRoute>} />
        <Route path="/freelancer/analytics" element={<ProtectedRoute allowedRoles={['FREELANCER']}><AnalyticsPage /></ProtectedRoute>} />

        {/* ADMIN Protected Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardPage tab="overview" /></ProtectedRoute>} />
        <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['ADMIN']}><DisputesPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardPage tab="settings" /></ProtectedRoute>} />

        {/* Legacy redirect matchers for safety */}
        <Route path="/jobs" element={<DashboardRedirect />} />
        <Route path="/escrows" element={<DashboardRedirect />} />
        <Route path="/applications" element={<DashboardRedirect />} />
        <Route path="/payments" element={<DashboardRedirect />} />
        <Route path="/reviews" element={<DashboardRedirect />} />
        <Route path="/settings" element={<DashboardRedirect />} />
        <Route path="/escrow/new" element={<DashboardRedirect />} />
        <Route path="/escrow/:id" element={<DashboardRedirect />} />
        <Route path="/disputes" element={<DashboardRedirect />} />
        <Route path="/analytics" element={<DashboardRedirect />} />
        <Route path="/chat" element={<DashboardRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
