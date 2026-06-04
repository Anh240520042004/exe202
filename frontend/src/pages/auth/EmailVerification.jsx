import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyEmail, resendVerification } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/ui';
import AuthLayout from '../../components/auth/AuthLayout';

export default function EmailVerification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, user } = useSelector((state) => state.auth);

  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState(location.state?.email || user?.email || '');
  const [isResending, setIsResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Vui lòng nhập mã xác thực 6 số');
      return;
    }

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      await dispatch(verifyEmail({ code: verificationCode, email })).unwrap();
      toast.success('Xac thuc email thanh cong! Dang chuyen den dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      toast.error(err || 'Mã xác thực không đúng');
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsResending(true);
    try {
      await dispatch(resendVerification(email)).unwrap();
      toast.success('Ma xac thuc moi da duoc gui!');
      setCodeSent(true);
    } catch (err) {
      toast.error(err || 'Không thể gửi lại mã');
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  return (
    <AuthLayout
      subtitle="Nhập mã xác thực đã được gửi đến email của bạn"
      title="Xác thực Email"
      footer="Quay lại trang đăng nhập"
      footerLink={{ to: '/login', label: 'Đăng nhập' }}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-200/60 dark:bg-primary-400/15 mb-4">
            <CheckCircle className="w-8 h-8 text-primary-600 dark:text-primary-300" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mã xác thực gồm 6 chữ số đã được gửi đến email của bạn
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mã xác thực
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={handleCodeChange}
            placeholder="Nhập 6 số"
            maxLength={6}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest glass-input-auth text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            style={{ letterSpacing: '0.5em' }}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          disabled={verificationCode.length !== 6}
        >
          Xác thực
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t glass-divider">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          Không nhận được mã?
        </p>

        <div className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Nhập email của bạn"
            icon={Mail}
            variant="auth"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            isLoading={isResending}
          >
            <Send className="w-4 h-4 mr-2" />
            Gửi lại mã xác thực
          </Button>
        </div>
      </div>

      {codeSent && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <p className="text-sm text-green-700 dark:text-green-400 text-center">
            Mã mới đã được gửi! Vui lòng kiểm tra hộp thư.
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
