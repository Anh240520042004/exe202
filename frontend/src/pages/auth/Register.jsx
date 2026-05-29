import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, clearError } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";
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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setLocalError('');
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await dispatch(register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })).unwrap();
      toast.success('Đăng ký thành công! Đang chuyển đến trang chính...');
      navigate('/dashboard');
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
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[2.15rem] text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

        <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
          Đăng ký
        </Button>
      </form>
    </AuthLayout>
  );
}
