import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword, clearError } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400/90 via-primary-300/90 to-accent-300/90 p-4">
        <div className="w-full max-w-md text-center">
          <div className="glass-panel rounded-ios-lg p-8 border-white/25">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Kiểm tra email của bạn!</h2>
            <p className="text-primary-200 mb-6">
              Chúng tôi đã gửi link đặt lại mật khẩu đến <span className="text-white font-medium">{email}</span>
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400/90 via-primary-300/90 to-accent-300/90 p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại đăng nhập
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-lg mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quên mật khẩu?</h1>
          <p className="text-primary-200">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <div className="glass-panel rounded-ios-lg p-8 border-white/25">
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
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
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
        </div>

        <p className="text-center text-primary-200 text-sm mt-6">
          F.EdTech - Quản lý tài chính thông minh
        </p>
      </div>
    </div>
  );
}
