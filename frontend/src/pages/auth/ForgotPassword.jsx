import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/ui';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSubmitted(true);
      toast.success('Đã gửi email đặt lại mật khẩu!');
    } catch (err) {
      toast.error(err || 'Gửi yêu cầu thất bại');
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        subtitle="Liên kết đặt lại mật khẩu đã được gửi đến email của bạn"
        title="Kiểm tra email của bạn!"
        footer="Quay lại trang đăng nhập"
        footerLink={{ to: '/login', label: 'Đăng nhập' }}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Chúng tôi đã gửi link đặt lại mật khẩu đến{' '}
            <span className="font-medium text-gray-900 dark:text-white">{email}</span>
          </p>
          <Link to="/login" className="block">
            <Button variant="secondary" className="w-full">
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      subtitle="Nhập email để nhận link đặt lại mật khẩu"
      title="Quên mật khẩu?"
      footer="Đã nhớ mật khẩu?"
      footerLink={{ to: '/login', label: 'Đăng nhập ngay' }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="Nhập email của bạn"
          icon={Mail}
          variant="auth"
          value={email}
          onChange={handleChange}
        />

        {error && (
          <div className="auth-error p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Gửi yêu cầu
        </Button>
      </form>
    </AuthLayout>
  );
}
