import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 p-4">
      <div className="w-full max-w-md">
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
          FPTAIEZ - Quản lý tài chính thông minh
        </p>
      </div>
    </div>
  );
}
