import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { register, clearError } from "../../store/slices/authSlice";
import { Button, Input } from "../../components/ui";

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
      const result = await dispatch(register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })).unwrap();
      
      // Registration successful - user is now logged in automatically
      toast.success('Đăng ký thành công! Đang chuyển đến trang chính...');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Đăng ký thất bại');
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
          <p className="text-primary-200">Tạo tài khoản mới</p>
        </div>

        <div className="glass-panel rounded-ios-lg p-8 border-white/25">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              name="name"
              label="Họ tên"
              placeholder="Nhập họ tên của bạn"
              icon={User}
              variant="auth"
              value={formData.name}
              onChange={handleChange}
            />

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
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Mật khẩu"
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
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
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
                {displayError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-primary-200">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-white font-semibold hover:underline">
                Đăng nhập ngay
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
