import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from './components/layout';
import { Login, Register, ForgotPassword, EmailVerification } from './pages/auth';
import { Dashboard, StudentDashboard } from './pages/dashboard';
import { Profile, Settings, Notifications } from './pages/user';
import { TransactionsList, CreateTransaction } from './pages/transactions';
import Marketplace from './pages/marketplace/Marketplace';
import Checkout from './pages/checkout/Checkout';
import { MentorNetwork, MentorCourses } from './pages/mentor';
import { MyDocuments, DownloadHistory } from './pages/documents';
import AIAssistant from './pages/ai/AIAssistant';
import Gamification from './pages/gamification/Gamification';
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentResult from './pages/payment/PaymentResult';
import AdminPayments from './pages/admin/AdminPayments';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.auth.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const DashboardComponent = user?.role === 'admin' ? AdminDashboard : 
                            user?.role === 'mentor' ? MentorNetwork : 
                            StudentDashboard;

  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      {/* Verify email is public - accessible after registration */}
      <Route path="/verify-email" element={<EmailVerification />} />
      
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardComponent />} />
        <Route path="/my-documents" element={<MyDocuments />} />
        <Route path="/download-history" element={<DownloadHistory />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/checkout/:type/:id" element={<Checkout />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/mentors" element={<MentorNetwork />} />
        <Route path="/mentor/courses" element={<MentorCourses />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/gamification" element={<Gamification />} />
        <Route path="/transactions" element={<TransactionsList />} />
        <Route path="/transactions/create" element={<CreateTransaction />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Admin routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
          </>
        )}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
