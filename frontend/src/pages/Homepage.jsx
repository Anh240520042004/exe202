import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Award,
  ChevronRight,
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Kho tài liệu phong phú',
    description: 'Hàng nghìn tài liệu học tập chất lượng cao từ nhiều môn học khác nhau',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    title: 'Mạng lưới Mentor',
    description: 'Kết nối với các mentor giàu kinh nghiệm để được hỗ trợ học tập 1-1',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: TrendingUp,
    title: 'Theo dõi tiến độ',
    description: 'Hệ thống XP, level và badge giúp bạn có động lực học tập mỗi ngày',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Thanh toán an toàn',
    description: 'Tích hợp thanh toán qua VNPay, SePay - Bảo mật tuyệt đối',
    color: 'from-orange-500 to-amber-500'
  },
  {
    icon: Zap,
    title: 'AI Assistant',
    description: 'Trợ lý AI thông minh giúp giải đáp thắc mắc và hỗ trợ học tập',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Award,
    title: 'Chứng chỉ & Thành tích',
    description: 'Thu thập badge và achievement khi hoàn thành các mốc học tập',
    color: 'from-red-500 to-rose-500'
  }
];

const stats = [
  { value: '10,000+', label: 'Tài liệu' },
  { value: '5,000+', label: 'Sinh viên' },
  { value: '200+', label: 'Mentor' },
  { value: '98%', label: 'Hài lòng' }
];

export default function Homepage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-accent-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">F</span>
              </div>
              <span className="text-xl font-bold text-white">FPTAIEZ</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-white/80 hover:text-white transition-colors font-medium"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 flex items-center gap-2"
              >
                Đăng ký
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        </div>

        <div className={`container mx-auto max-w-7xl relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8 backdrop-blur-sm">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80 text-sm">Nền tảng học tập số 1 cho sinh viên</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Học tập thông minh,
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                Thành công bền vững
              </span>
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              FPTAIEZ là nền tảng quản lý học tập toàn diện với kho tài liệu phong phú, 
              mạng lưới mentor chất lượng cao và công cụ AI thông minh.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                to="/register" 
                className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 flex items-center gap-2"
              >
                Bắt đầu miễn phí
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Tôi đã có tài khoản
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tại sao chọn FPTAIEZ?
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Chúng tôi cung cấp giải pháp học tập toàn diện giúp bạn đạt được mục tiêu một cách hiệu quả nhất
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 rounded-3xl bg-gradient-to-r from-primary-600/50 to-accent-600/50 backdrop-blur-xl border border-white/20 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Sẵn sàng bắt đầu hành trình của bạn?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Đăng ký ngay hôm nay và nhận ưu đãi đặc biệt dành cho sinh viên mới
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link 
                  to="/register" 
                  className="group px-8 py-4 bg-white text-primary-900 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  Đăng ký ngay
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Miễn phí đăng ký</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Không cần thẻ tín dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Hủy bất kỳ lúc nào</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <span className="text-white font-semibold">FPTAIEZ</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 FPTAIEZ. Nền tảng quản lý học tập thông minh.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
