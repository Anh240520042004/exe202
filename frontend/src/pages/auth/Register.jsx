import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { register, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/ui';
import AuthLayout from '../../components/auth/AuthLayout';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // SỬA LỖI: thêm hàm handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;

    setLocalError('');
    dispatch(clearError());

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (role) => {
    setLocalError('');
    dispatch(clearError());

    setFormData((prev) => ({
      ...prev,
      role,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    const submittedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
    };

    if (
      !submittedData.name ||
      !submittedData.email ||
      !submittedData.password ||
      !submittedData.confirmPassword
    ) {
      setLocalError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (submittedData.password !== submittedData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (submittedData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await dispatch(
        register({
          name: submittedData.name,
          email: submittedData.email,
          password: submittedData.password,
          role: submittedData.role,
        })
      ).unwrap();

      // Nếu đăng ký xong muốn quay về login thì xóa token được lưu sau register
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      toast.error(err || 'Đăng ký thất bại');
    }
  };

  const displayError = localError || error;

  return (
    <AuthLayout
      subtitle="Tạo tài khoản mới"
      title="Đăng ký"
      footer="Đã có tài khoản?"
      footerLink={{ to: '/login', label: 'Đăng nhập ngay' }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="name"
          label="Họ tên"
          placeholder="Nguyễn Văn A"
          icon={User}
          variant="auth"
          value={formData.name}
          onChange={handleChange}
        />

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

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
            Vai trò
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${formData.role === 'student'
                  ? 'border-primary-400 bg-primary-400/30 text-white'
                  : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10'
                }`}
            >
              <GraduationCap className="w-5 h-5" />
              Sinh viên
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('mentor')}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${formData.role === 'mentor'
                  ? 'border-primary-400 bg-primary-400/30 text-white'
                  : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10'
                }`}
            >
              <Users className="w-5 h-5" />
              Mentor
            </button>
          </div>
        </div>

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Mật khẩu"
            placeholder="Ít nhất 6 ký tự"
            icon={Lock}
            variant="auth"
            value={formData.password}
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[2.15rem] text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <Input
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          icon={Lock}
          variant="auth"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        {displayError && (
          <div className="auth-error p-3 rounded-xl text-sm">
            {displayError}
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
        >
          Đăng ký
        </Button>
      </form>
    </AuthLayout>
  );
}