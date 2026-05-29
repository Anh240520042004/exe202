import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  Play,
  Sparkles
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
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
                <span className="text-xl font-bold text-white">F</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">FPTAIEZ</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 text-white/70 hover:text-white transition-colors font-medium text-sm"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                Đăng ký
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section — Full-screen cinematic video */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source
            src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4"
            type="video/mp4"
          />
        </video>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,black_100%)]" />

        {/* Top Film Grain */}
        <div
          className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px'
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <div
            className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full mb-10 border border-white/10">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-white/80 text-sm font-medium tracking-wide">
                Nền tảng học tập số 1 cho sinh viên
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.05] tracking-tight max-w-5xl">
              Học tập thông minh,
              <br />
              <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-accent-400 bg-clip-text text-transparent">
                Thành công bền vững
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/60 mb-14 max-w-2xl mx-auto leading-relaxed font-light">
              FPTAIEZ là nền tảng quản lý học tập toàn diện với kho tài liệu phong phú,
              mạng lưới mentor chất lượng cao và công cụ AI thông minh.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link
                to="/register"
                className="group relative px-10 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold text-lg overflow-hidden shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Bắt đầu miễn phí
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                to="/login"
                className="group px-10 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-3"
              >
                <Play className="w-5 h-5" />
                Tôi đã có tài khoản
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-white/50 text-xs md:text-sm font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-white/30 text-xs uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black via-primary-950 to-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full mb-6 border border-primary-500/20">
              <Star className="w-4 h-4 text-primary-400" />
              <span className="text-primary-400 text-sm font-medium">Tính năng nổi bật</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Tại sao chọn FPTAIEZ?
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Chúng tôi cung cấp giải pháp học tập toàn diện giúp bạn đạt được mục tiêu một cách hiệu quả nhất
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-500"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-black">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
            {/* Video Background for CTA */}
            <div className="absolute inset-0">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
                <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-black/80 to-accent-900/90" />
            </div>

            {/* Glow Orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/20 rounded-full blur-[120px]" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">
                Sẵn sàng bắt đầu hành trình của bạn?
              </h2>
              <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                Đăng ký ngay hôm nay và nhận ưu đãi đặc biệt dành cho sinh viên mới
              </p>
              <Link
                to="/register"
                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300"
              >
                Đăng ký ngay
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/50 text-sm">Miễn phí đăng ký</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/50 text-sm">Không cần thẻ tín dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/50 text-sm">Hủy bất kỳ lúc nào</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-black border-t border-white/5">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <span className="text-white font-semibold">FPTAIEZ</span>
            </div>
            <p className="text-white/30 text-sm">
              © 2026 FPTAIEZ. Nền tảng quản lý học tập thông minh.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
