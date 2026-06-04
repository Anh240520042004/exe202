import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from './components/layout';
import { Login, Register, ForgotPassword, EmailVerification } from './pages/auth';
import Homepage from './pages/Homepage';
import { Dashboard, StudentDashboard } from './pages/dashboard';
import { Profile, Settings, Notifications } from './pages/user';
import UserProfile from './pages/user/UserProfile';
import { TransactionsList, CreateTransaction } from './pages/transactions';
import Marketplace from './pages/marketplace/Marketplace';
import Checkout from './pages/checkout/Checkout';
import { MentorNetwork, MentorDocuments, MentorProfile } from './pages/mentor';
import { MyDocuments, DownloadHistory } from './pages/documents';
import DocumentDetail from './pages/documents/DocumentDetail';
import AIAssistant from './pages/ai/AIAssistant';
import Gamification from './pages/gamification/Gamification';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDocuments from './pages/admin/AdminDocuments';
import PaymentResult from './pages/payment/PaymentResult';
import AdminPayments from './pages/admin/AdminPayments';
import AdminForumPosts from './pages/admin/AdminForumPosts';
import Forum from './pages/forum/Forum';
import CreatePost from './pages/forum/CreatePost';
import PostDetail from './pages/forum/PostDetail';
import ChatPage from './pages/chat/ChatPage';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const DashboardComponent = user?.role === 'admin' ? AdminDashboard :
                            user?.role === 'mentor' ? MentorNetwork :
                            StudentDashboard;

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/forgot-password" element={
        !isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />
      } />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/payment/result" element={<PaymentResult />} />
      <Route path="/payment/vnpay-return" element={<PaymentResult />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardComponent />} />
        <Route path="/my-documents" element={<MyDocuments />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/download-history" element={<DownloadHistory />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/checkout/:type/:id" element={<Checkout />} />
        <Route path="/mentors" element={<MentorNetwork />} />
        <Route path="/mentors/:id" element={<MentorProfile />} />
        <Route path="/mentor/documents" element={<MentorDocuments />} />
        <Route path="/mentor/courses" element={<Navigate to="/mentor/documents" replace />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/gamification" element={<Gamification />} />
        <Route path="/transactions" element={<TransactionsList />} />
        <Route path="/transactions/create" element={<CreateTransaction />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/create" element={<CreatePost />} />
        <Route path="/forum/:id" element={<PostDetail />} />
        <Route path="/chat" element={<ChatPage />} />

        {/* Admin routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/forum-posts" element={<AdminForumPosts />} />
          </>
        )}
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
