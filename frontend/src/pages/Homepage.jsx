import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  BookOpen, Users, Star, ChevronRight, ArrowRight,
  MessageSquare, GraduationCap, ShoppingBag, Bot,
  Facebook, HeartHandshake, Building2, TrendingUp,
  ThumbsUp, Eye, Download, Clock, Award, Zap,
  ExternalLink, Menu, X, Shield, FileText, BadgeCheck,
  LogOut, User,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const API_BASE = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')}/api`;

const LINKS = {
  support: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
  fptUniversity: 'https://www.facebook.com/DaihocFPTHaNoi',
  fanpage: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
};

const NAV_LINKS = [
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/mentors', icon: GraduationCap, label: 'Mentors' },
  { to: '/forum', icon: MessageSquare, label: 'Diễn đàn' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
];

const SOCIAL_BUTTONS = [
  { href: LINKS.support, icon: HeartHandshake, label: 'Hỗ Trợ', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200' },
  { href: LINKS.fptUniversity, icon: Building2, label: 'ĐH FPT', color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200' },
  { href: LINKS.fanpage, icon: Facebook, label: 'Trang Của Chúng Tôi', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200' },
];

const STATS = [
  { value: '10,000+', label: 'Tài liệu', icon: FileText },
  { value: '5,000+', label: 'Sinh viên', icon: Users },
  { value: '200+', label: 'Mentor', icon: BadgeCheck },
  { value: '98%', label: 'Hài lòng', icon: Award },
];

// ─── Helper Components ──────────────────────────────────────────────────────
function Avatar({ src, name, size = 'sm' }) {
  const [err, setErr] = useState(false);
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12';
  const initials = (name || '?')[0].toUpperCase();
  if (!src || err) {
    return (
      <div className={`${dim} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className={`${dim} rounded-full object-cover flex-shrink-0`}
    />
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/60 rounded-2xl p-4 border border-violet-100 ${className}`}>
      <div className="h-3 bg-violet-100 rounded w-2/3 mb-3" />
      <div className="h-3 bg-violet-50 rounded w-full mb-2" />
      <div className="h-3 bg-violet-50 rounded w-4/5" />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, to, toLabel = 'Xem tất cả' }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-gray-500 ml-9">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors duration-200 border border-violet-200"
        >
          {toLabel}
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Document Card ──────────────────────────────────────────────────────────
function DocumentCard({ doc }) {
  const price = doc?.price ?? 0;
  const title = doc?.title || 'Tài liệu';
  const subject = doc?.subjectCode || '';
  const downloads = doc?.downloads ?? 0;
  const rating = doc?.rating ?? doc?.avgRating ?? 0;
  const authorName = doc?.author?.name || 'Ẩn danh';
  const type = doc?.documentType || doc?.fileType || 'pdf';

  const typeColors = {
    pdf: 'bg-red-50 text-red-600 border-red-200',
    docx: 'bg-blue-50 text-blue-600 border-blue-200',
    pptx: 'bg-orange-50 text-orange-600 border-orange-200',
    xlsx: 'bg-green-50 text-green-600 border-green-200',
  };
  const typeColor = typeColors[type] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <Link
      to={`/documents/${doc._id}`}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {subject && (
            <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-md">
              {subject}
            </span>
          )}
          <span className={`text-xs font-medium border px-1.5 py-0.5 rounded-md uppercase ${typeColor}`}>
            {type}
          </span>
          {price > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
              {price.toLocaleString('vi-VN')}đ
            </span>
          )}
          {price === 0 && (
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
              Miễn phí
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 leading-snug truncate group-hover:text-violet-700 transition-colors">
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <Download className="w-3 h-3" /> {downloads.toLocaleString()}
          </span>
          {rating > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-current" /> {rating.toFixed(1)}
            </span>
          )}
          <span className="truncate">{authorName}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 flex-shrink-0 mt-1 transition-colors" />
    </Link>
  );
}

// ─── Mentor Card ────────────────────────────────────────────────────────────
function MentorCard({ mentor }) {
  const name = mentor?.name || 'Mentor';
  const avatar = mentor?.avatar;
  const rating = mentor?.mentorProfile?.rating ?? mentor?.rating ?? 0;
  const reviewCount = mentor?.mentorProfile?.reviewCount ?? mentor?.reviewCount ?? 0;
  const expertise = mentor?.mentorProfile?.expertise || [];
  const bio = mentor?.mentorProfile?.bio || mentor?.bio || '';
  const hourlyRate = mentor?.mentorProfile?.hourlyRate ?? 0;

  return (
    <Link
      to={`/mentors/${mentor._id}`}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all duration-200"
    >
      <Avatar src={avatar} name={name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 group-hover:text-violet-700 transition-colors truncate">
          {name}
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-600">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span className="text-xs text-gray-400">({reviewCount})</span>}
          </div>
        )}
        {bio && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bio}</p>
        )}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {expertise.slice(0, 2).map((e, i) => (
              <span key={i} className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-md">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {hourlyRate > 0 ? (
          <span className="text-xs font-bold text-violet-600">
            {hourlyRate.toLocaleString('vi-VN')}đ<span className="text-gray-400 font-normal">/h</span>
          </span>
        ) : (
          <span className="text-xs font-bold text-green-600">Miễn phí</span>
        )}
      </div>
    </Link>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post }) {
  const title = post?.title || 'Bài viết';
  const authorName = post?.author?.name || 'Ẩn danh';
  const authorAvatar = post?.author?.avatar;
  const likeCount = post?.likeCount ?? 0;
  const commentCount = post?.commentCount ?? 0;
  const viewCount = post?.viewCount ?? 0;
  const tags = post?.tags || [];
  const createdAt = post?.createdAt ? new Date(post.createdAt) : null;

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <Link
      to={`/forum/${post._id}`}
      className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all duration-200"
    >
      <div className="flex items-start gap-2">
        <Avatar src={authorAvatar} name={authorName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{authorName}</span>
            <span>·</span>
            <span>{timeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-10">
          {tags.slice(0, 3).map((t, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 ml-10 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" /> {likeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> {commentCount}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {viewCount}
        </span>
      </div>
    </Link>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Homepage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  const fetchData = useCallback(async () => {
    try {
      const [docsRes, mentorsRes, postsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/documents/featured?limit=6`),
        fetch(`${API_BASE}/mentors/top?limit=6`),
        fetch(`${API_BASE}/posts?page=1&limit=6&sort=hot`),
      ]);

      if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
        const data = await docsRes.value.json();
        setDocuments(data?.data?.slice(0, 6) || []);
      }
      if (mentorsRes.status === 'fulfilled' && mentorsRes.value.ok) {
        const data = await mentorsRes.value.json();
        setMentors((data?.data || []).slice(0, 6));
      }
      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const data = await postsRes.value.json();
        setPosts((data?.data?.posts || []).slice(0, 6));
      }
    } catch (err) {
      console.error('Homepage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #f0f9ff 60%, #faf5ff 100%)' }}>

      {/* ── Announcement Banner ── */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white text-center py-2 px-4 text-xs font-medium">
        🎉 Nền tảng học tập số 1 dành cho sinh viên FPT —{' '}
        <Link to="/register" className="underline font-bold hover:text-violet-200 transition-colors">
          Đăng ký miễn phí ngay!
        </Link>
      </div>

      {/* ── Top Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-violet-500/10 border-b border-violet-200/50'
        : 'bg-white/60 backdrop-blur-md border-b border-violet-200/30'
        }`}>
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Logo — always links to / */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-gray-900 leading-none">
                  F.<span className="text-violet-600">EdTech</span>
                </span>
                <p className="text-[10px] text-gray-400 leading-none font-medium">Nền tảng học tập</p>
              </div>
            </Link>

            {/* Center: Nav Links + Social Buttons */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}

              <div className="h-4 w-px bg-violet-200 mx-1" />

              {SOCIAL_BUTTONS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${item.color}`}
                  title={item.label}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{item.label}</span>
                </a>
              ))}
            </div>

            {/* Right: Auth area */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated ? (
                /* ── Đã đăng nhập: avatar + tên + logout ── */
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all duration-200 group"
                    title="Xem hồ sơ"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-violet-300/60 shadow-sm"
                    />
                    <div className="hidden sm:block leading-tight">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-700 transition-colors leading-none">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                /* ── Chưa đăng nhập ── */
                <>
                  <Link
                    to="/login"
                    className="hidden sm:block px-4 py-1.5 text-sm font-semibold text-gray-700 hover:text-violet-600 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1"
                  >
                    Đăng ký
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-violet-50 text-gray-600"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-violet-100 bg-white/90 backdrop-blur-xl px-4 py-3 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {/* Auth section in mobile */}
            <div className="pt-2 border-t border-violet-100">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-violet-50 transition-all"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-violet-300/60"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-400">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} · Xem hồ sơ →
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Vào Dashboard
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:opacity-90 transition-all"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-violet-100 grid grid-cols-3 gap-2">
              {SOCIAL_BUTTONS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1 p-2 text-xs font-semibold rounded-xl border text-center ${item.color}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-10 pb-8 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/10 rounded-full blur-3xl" />
        </div>

        <div className={`max-w-screen-xl mx-auto relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold mb-4 border border-violet-200">
              <Zap className="w-3.5 h-3.5 fill-violet-500" />
              Nền tảng học tập #1 cho sinh viên FPT
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight">
              Học tập thông minh,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                Thành công bền vững
              </span>
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
              Khám phá kho tài liệu, kết nối mentor và tham gia diễn đàn — tất cả trong một nền tảng dành riêng cho sinh viên FPT.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group px-7 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Vào Dashboard
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="group px-7 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Bắt đầu miễn phí
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                to="/marketplace"
                className="px-7 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-bold text-sm hover:bg-white hover:text-violet-600 transition-all duration-300 flex items-center justify-center gap-2 border border-violet-200 hover:border-violet-300"
              >
                <ShoppingBag className="w-4 h-4" />
                Xem tài liệu
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-violet-100 shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <s.icon className="w-4 h-4 text-violet-500" />
                    <span className="text-lg font-black text-gray-900">{s.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Main Sections ── */}
      <section className="px-4 pb-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* ── Section 1: Khóa học / Tài liệu ── */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-violet-200/60 shadow-sm shadow-violet-500/5 overflow-hidden">
              <div className="p-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
                <SectionHeader
                  icon={BookOpen}
                  title="Khóa học & Tài liệu"
                  subtitle="Tài liệu nổi bật trên Marketplace"
                  to="/marketplace"
                />
              </div>
              <div className="p-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} className="mb-1" />)
                ) : documents.length > 0 ? (
                  <div className="divide-y divide-violet-50">
                    {documents.map((doc) => (
                      <DocumentCard key={doc._id} doc={doc} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <BookOpen className="w-10 h-10 text-violet-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa có tài liệu nào</p>
                    <Link to="/marketplace" className="mt-2 inline-block text-xs text-violet-600 hover:underline">
                      Khám phá Marketplace →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/marketplace"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-semibold rounded-xl border border-violet-200 transition-colors duration-200"
                >
                  Xem toàn bộ tài liệu
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 2: Mentor ── */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-violet-200/60 shadow-sm shadow-violet-500/5 overflow-hidden">
              <div className="p-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
                <SectionHeader
                  icon={GraduationCap}
                  title="Mentor Nổi Bật"
                  subtitle="Kết nối với mentor giàu kinh nghiệm"
                  to="/mentors"
                />
              </div>
              <div className="p-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} className="mb-1" />)
                ) : mentors.length > 0 ? (
                  <div className="divide-y divide-violet-50">
                    {mentors.map((mentor) => (
                      <MentorCard key={mentor._id} mentor={mentor} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 text-violet-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa có mentor nào</p>
                    <Link to="/mentors" className="mt-2 inline-block text-xs text-violet-600 hover:underline">
                      Khám phá Mentors →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/mentors"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-semibold rounded-xl border border-violet-200 transition-colors duration-200"
                >
                  Xem tất cả Mentor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 3: Diễn đàn ── */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-violet-200/60 shadow-sm shadow-violet-500/5 overflow-hidden">
              <div className="p-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
                <SectionHeader
                  icon={MessageSquare}
                  title="Diễn Đàn Cộng Đồng"
                  subtitle="Bài viết hot nhất từ cộng đồng"
                  to="/forum"
                />
              </div>
              <div className="p-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} className="mb-1" />)
                ) : posts.length > 0 ? (
                  <div className="divide-y divide-violet-50">
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <MessageSquare className="w-10 h-10 text-violet-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Chưa có bài viết nào</p>
                    <Link to="/forum" className="mt-2 inline-block text-xs text-violet-600 hover:underline">
                      Vào Diễn đàn →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/forum"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-semibold rounded-xl border border-violet-200 transition-colors duration-200"
                >
                  Vào diễn đàn
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* ── AI + Quick Feature Banner ── */}
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <Link
              to="/ai"
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-base mb-0.5">AI Assistant (Gemini)</p>
                <p className="text-violet-200 text-xs">Hỏi đáp thông minh, giải bài tập, tóm tắt tài liệu tức thì</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="group flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-base text-gray-900 mb-0.5">Tham gia ngay — Miễn phí!</p>
                <p className="text-gray-500 text-xs">Đăng ký trong 30 giây, không cần thẻ tín dụng</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-violet-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">F</span>
                </div>
                <span className="text-lg font-bold">F.<span className="text-violet-400">EdTech</span></span>
              </Link>
              <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                Nền tảng học tập số dành cho sinh viên FPT — chia sẻ tài liệu, kết nối mentor, và học cùng AI.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {SOCIAL_BUTTONS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-violet-500/20 rounded-lg text-xs font-medium text-gray-300 hover:text-violet-400 transition-all duration-200"
                    title={item.label}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm">
              <p className="col-span-2 text-xs font-semibold text-gray-400 uppercase mb-1">Tính năng</p>
              {NAV_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="text-gray-400 hover:text-violet-400 transition-colors flex items-center gap-1.5 py-0.5">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>© 2026 F.EdTech. Nền tảng quản lý học tập thông minh.</p>
            <p>Được xây dựng với ❤️ bởi sinh viên FPT</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
