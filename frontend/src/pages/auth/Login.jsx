import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { login, clearError } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";
import AuthLayout from '../../components/auth/AuthLayout';

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

  const displayError = localError || error;

  useEffect(() => {
    if (!displayError) return;

    const timeoutId = setTimeout(() => {
      setLocalError('');
      if (error) dispatch(clearError());
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, error, displayError]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      // Chỉ xóa password, giữ nguyên email
      setFormData((prev) => ({
        ...prev,
        password: '',
      }));
    }
  };

  return (
    <AuthLayout
      subtitle="Đăng nhập để tiếp tục"
      title="Chào mừng trở lại"
      footer="Chưa có tài khoản?"
      footerLink={{
        to: '/register',
        label: 'Đăng ký ngay',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="name@example.com"
          icon={Mail}
          variant="auth"
          value={formData.email}
          onChange={handleChange}
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Mật khẩu"
            placeholder="••••••••"
            icon={Lock}
            variant="auth"
            value={formData.password}
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[2.15rem] text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {displayError && (
          <div className="auth-error p-3 rounded-xl text-sm">
            {displayError}
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-white/20 bg-white/60 dark:bg-white/5 accent-primary-400"
            />
            Ghi nhớ đăng nhập
          </label>

          <Link
            to="/forgot-password"
            className="text-primary-600 dark:text-primary-300 hover:text-primary-500 dark:hover:text-primary-200 transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
        >
          Đăng nhập
        </Button>
      </form>
    </AuthLayout>
  );
}