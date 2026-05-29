import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { login, clearError } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400/90 via-primary-300/90 to-accent-300/90 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-lg mb-4">
            <span className="text-2xl font-bold text-white">F.</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">F.EdTech</h1>
          <p className="text-primary-200">Đăng nhập để tiếp tục</p>
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
                variant="auth"
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
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
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
          F.EdTech - Quản lý tài chính thông minh
        </p>
      </div>
    </div>
  );
}
