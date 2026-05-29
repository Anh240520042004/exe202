import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSafeGoogleLogin } from '../../hooks/useSafeGoogleLogin';
import { login, clearError, setCredentials } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loginKey, setLoginKey] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setLocalError('');
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setLocalError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err || 'Email hoặc mật khẩu không đúng');
      setFormData((prev) => ({ ...prev, password: '' }));
      setLoginKey((k) => k + 1);
    }
  };

  const displayError = localError || error;

  const googleLoginFn = useSafeGoogleLogin();
  const googleLogin = googleLoginFn ? googleLoginFn({
    onSuccess: async (tokenResponse) => {
      try {
        const { data } = await axios.post(`${API_URL}/auth/google`, {
          idToken: tokenResponse.token_id || tokenResponse.credential,
        });
        if (data.success) {
          dispatch(setCredentials(data.data));
          toast.success(data.message || 'Đăng nhập Google thành công!');
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Đăng nhập Google thất bại');
      }
    },
    onError: () => {
      toast.error('Đăng nhập Google thất bại');
    },
  }) : null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Video */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/80 via-primary-950/70 to-black/80" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,black_100%)]" />
      <div className="absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px'
        }}
      />

      <div className="w-full max-w-md relative z-20 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-lg mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FPTAIEZ</h1>
          <p className="text-primary-200">Đăng nhập để tiếp tục</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="Nhập email của bạn"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
            />

            <div className="relative">
              <Input
                key={loginKey}
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {displayError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {displayError}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-primary-200 cursor-pointer">
                <input type="checkbox" className="rounded border-primary-300" />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-primary-200 hover:text-white transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Đăng nhập
            </Button>

            {googleLogin && (
            <>
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">hoặc</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => googleLogin()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </button>
            </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-primary-200">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-white font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-primary-200 text-sm mt-6">
          FPTAIEZ - Quản lý tài chính thông minh
        </p>
      </div>
    </div>
  );
}
