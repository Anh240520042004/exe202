import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  BookOpen, Users, Star, ChevronRight, ArrowRight,
  MessageSquare, GraduationCap, ShoppingBag, Bot,
  Facebook, HeartHandshake, Building2, TrendingUp,
  ThumbsUp, Eye, Download, Clock, Zap,
  ExternalLink, Menu, X, Shield,
  LogOut, User,
} from 'lucide-react';
import { API_BASE } from '../config/api';
import heroLogo from '../assets/Screenshot 2026-06-02 153749.png';

// ─── Constants ─────────────────────────────────────────────────────────────
const LINKS = {
  support: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
  fptUniversity: 'https://www.facebook.com/DaihocFPTHaNoi',
  fanpage: 'https://www.facebook.com/profile.php?id=61579562170910&rdid=pVXYqwqm2YDKUh4i&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1HuhGV1yLX#',
};

const NAV_LINKS = [
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/mentors', icon: GraduationCap, label: 'Mentors' },
  { to: '/forum', icon: MessageSquare, label: 'Diễn đàn' },
  { to: '/ai', icon: Bot, label: 'AI Chatbot GPT' },
];

const SOCIAL_BUTTONS = [
  { id: 'support', href: LINKS.support, icon: HeartHandshake, label: 'Ho Tro', color: 'bg-white/10 text-blue-100 hover:bg-white/18 border-white/15' },
  { id: 'fpt-university', href: LINKS.fptUniversity, icon: Building2, label: 'DH FPT', color: 'bg-white/10 text-emerald-100 hover:bg-white/18 border-white/15' },
  { id: 'fanpage', href: LINKS.fanpage, icon: Facebook, label: 'Trang Cua Chung Toi', color: 'bg-white/10 text-indigo-100 hover:bg-white/18 border-white/15' },
];

// ─── Helper Components ──────────────────────────────────────────────────────
function Avatar({ src, name, size = 'sm', userId }) {
  const [err, setErr] = useState(false);
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12';
  const initials = (name || '?')[0].toUpperCase();
  const goToProfile = (event) => {
    if (!userId) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(`/profile/${userId}`);
  };
  if (!src || err) {
    return (
      <button
        type="button"
        onClick={goToProfile}
        className={`${dim} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${userId ? 'cursor-pointer hover:ring-2 hover:ring-blue-200/70' : ''}`}
      >
        {initials}
      </button>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      onClick={goToProfile}
      className={`${dim} rounded-full object-cover flex-shrink-0 ${userId ? 'cursor-pointer hover:ring-2 hover:ring-blue-200/70' : ''}`}
    />
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-2xl p-4 border border-white/15 ${className}`}>
      <div className="h-3 bg-white/25 rounded w-2/3 mb-3" />
      <div className="h-3 bg-white/15 rounded w-full mb-2" />
      <div className="h-3 bg-white/15 rounded w-4/5" />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, to, toLabel = 'Xem tất cả' }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center border border-white/15">
            <Icon className="w-4 h-4 text-blue-200" />
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-blue-100/80 ml-9">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-xs font-semibold text-white hover:text-blue-100 bg-white/10 hover:bg-white/18 px-3 py-1.5 rounded-lg transition-colors duration-200 border border-white/20"
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
    pdf: 'bg-red-500/15 text-red-100 border-red-200/25',
    docx: 'bg-blue-500/15 text-blue-100 border-blue-200/25',
    pptx: 'bg-orange-500/15 text-orange-100 border-orange-200/25',
    xlsx: 'bg-green-500/15 text-green-100 border-green-200/25',
  };
  const typeColor = typeColors[type] || 'bg-white/10 text-blue-100 border-white/15';

  return (
    <Link
      to={`/documents/${doc._id}`}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/15 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {subject && (
            <span className="text-xs font-bold text-blue-100 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded-md">
              {subject}
            </span>
          )}
          <span className={`text-xs font-medium border px-1.5 py-0.5 rounded-md uppercase ${typeColor}`}>
            {type}
          </span>
          {price > 0 && (
            <span className="text-xs font-bold text-amber-100 bg-amber-500/15 border border-amber-200/25 px-1.5 py-0.5 rounded-md">
              {price.toLocaleString('vi-VN')}đ
            </span>
          )}
          {price === 0 && (
            <span className="text-xs font-bold text-green-100 bg-green-500/15 border border-green-200/25 px-1.5 py-0.5 rounded-md">
              Miễn phí
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-snug truncate group-hover:text-blue-100 transition-colors">
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-blue-100/70">
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
      <ChevronRight className="w-4 h-4 text-blue-100/40 group-hover:text-blue-100 flex-shrink-0 mt-1 transition-colors" />
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
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/15 transition-all duration-200"
    >
      <Avatar src={avatar} name={name} size="md" userId={mentor?._id} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white group-hover:text-blue-100 transition-colors truncate">
          {name}
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-600">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span className="text-xs text-blue-100/60">({reviewCount})</span>}
          </div>
        )}
        {bio && (
          <p className="text-xs text-blue-100/75 mt-0.5 line-clamp-1">{bio}</p>
        )}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {expertise.slice(0, 2).map((e, i) => (
              <span key={i} className="text-xs bg-white/10 text-blue-100 border border-white/15 px-1.5 py-0.5 rounded-md">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {hourlyRate > 0 ? (
          <span className="text-xs font-bold text-violet-600">
            {hourlyRate.toLocaleString('vi-VN')}đ<span className="text-blue-100/60 font-normal">/h</span>
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
      className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/15 transition-all duration-200"
    >
      <div className="flex items-start gap-2">
        <Avatar src={authorAvatar} name={authorName} size="sm" userId={post?.author?._id} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white group-hover:text-blue-100 transition-colors line-clamp-2 leading-snug">
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-100/60">
            <span className="font-medium text-blue-100">{authorName}</span>
            <span>·</span>
            <span>{timeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-10">
          {tags.slice(0, 3).map((t, i) => (
            <span key={i} className="text-xs bg-white/10 text-blue-100 px-1.5 py-0.5 rounded-md border border-white/15">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 ml-10 text-xs text-blue-100/65">
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
        fetch(`${API_BASE}/documents?page=1&limit=6&sortBy=createdAt&order=desc`),
        fetch(`${API_BASE}/mentors/top?limit=6`),
        fetch(`${API_BASE}/posts?page=1&limit=6&sort=hot`),
      ]);

      if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
        const data = await docsRes.value.json();
        const homepageDocuments = Array.isArray(data?.data?.documents)
          ? data.data.documents
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setDocuments(homepageDocuments.slice(0, 6));
      }
      if (mentorsRes.status === 'fulfilled' && mentorsRes.value.ok) {
        const data = await mentorsRes.value.json();
        setMentors(Array.isArray(data?.data) ? data.data.slice(0, 6) : []);
      }
      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const data = await postsRes.value.json();
        setPosts(Array.isArray(data?.data?.posts) ? data.data.posts.slice(0, 6) : []);
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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.26),transparent_34%)]" />

      {/* ── Announcement Banner ── */}
      <div className="relative z-20 bg-white/10 text-white text-center py-2 px-4 text-xs font-medium backdrop-blur-xl border-b border-white/10">
        🎉 Nền tảng học tập số 1 dành cho sinh viên FPT —{' '}
        <Link to="/register" className="underline font-bold hover:text-violet-200 transition-colors">
          Đăng ký miễn phí ngay!
        </Link>
      </div>

      {/* ── Top Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-slate-950/55 backdrop-blur-xl shadow-lg shadow-blue-950/20 border-b border-white/15'
        : 'bg-slate-950/35 backdrop-blur-md border-b border-white/10'
        }`}>
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Logo — always links to / */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow overflow-hidden border border-white/40">
                <img
                  src={heroLogo}
                  alt="F.EdTech"
                  className="h-full w-full object-contain p-1"
                  draggable="false"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-white leading-none">
                  F.<span className="text-blue-200">EdTech</span>
                </span>
                <p className="text-[10px] text-blue-100/70 leading-none font-medium">Nền tảng học tập</p>
              </div>
            </Link>

            {/* Center: Nav Links + Social Buttons */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-50/85 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}

              <div className="h-4 w-px bg-white/20 mx-1" />

              {SOCIAL_BUTTONS.map((item) => (
                <a
                  key={item.id}
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
                    className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/15 transition-all duration-200 group"
                    title="Xem hồ sơ"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-violet-300/60 shadow-sm"
                    />
                    <div className="hidden sm:block leading-tight">
                      <p className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors leading-none">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-blue-100/65 leading-none mt-0.5">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-100 bg-red-500/15 hover:bg-red-500/25 border border-red-200/20 rounded-xl transition-all duration-200"
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
                    className="hidden sm:block px-4 py-1.5 text-sm font-semibold text-blue-50 hover:text-white transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-900/30 hover:-translate-y-0.5 hover:bg-blue-400 transition-all duration-200 flex items-center gap-1"
                  >
                    Đăng ký
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-blue-50"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 py-3 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-50/85 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {/* Auth section in mobile */}
            <div className="pt-2 border-t border-white/10">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-violet-300/60"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-blue-100/65">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} · Xem hồ sơ →
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Vào Dashboard
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/15 rounded-lg transition-all"
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-50 border border-white/15 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-400 transition-all"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2">
              {SOCIAL_BUTTONS.map((item) => (
                <a
                  key={item.id}
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
      <section className="relative min-h-[420px] overflow-hidden px-4 py-14 sm:min-h-[480px] lg:min-h-[500px] lg:py-20">
        <div className="absolute inset-0 bg-slate-950/28" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.20),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/60 to-transparent" />

        <div className={`relative z-10 mx-auto flex min-h-[320px] max-w-screen-xl items-center justify-center transition-all duration-700 sm:min-h-[370px] lg:min-h-[390px] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/14 px-4 py-2 text-xs font-bold text-blue-50 shadow-lg shadow-black/20 backdrop-blur-md sm:text-sm">
              <Zap className="h-4 w-4 fill-blue-300 text-blue-300" />
              Nền tảng học tập #1 cho sinh viên FPT
            </div>
            <h1 className="mx-auto mb-5 max-w-5xl text-4xl font-black leading-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
              Học tập thông minh,{' '}
              <span className="text-blue-100">
                Thành công bền vững
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-base font-medium leading-7 text-blue-50 drop-shadow-lg sm:text-lg">
              Khám phá kho tài liệu, kết nối mentor và tham gia diễn đàn - tất cả trong một nền tảng dành riêng cho sinh viên FPT.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-400"
                >
                  Vào Dashboard
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-400"
                >
                  Bắt đầu miễn phí
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              <Link
                to="/marketplace"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-black/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/18"
              >
                <ShoppingBag className="h-4 w-4" />
                Xem tài liệu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Main Sections ── */}
      <section className="px-4 pb-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-5">

            {/* ── Section 1: Khóa học / Tài liệu ── */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl shadow-blue-950/20 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
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
                  <div className="divide-y divide-white/10">
                    {documents.map((doc) => (
                      <DocumentCard key={doc._id} doc={doc} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <BookOpen className="w-10 h-10 text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-blue-50/75">Chưa có tài liệu nào</p>
                    <Link to="/marketplace" className="mt-2 inline-block text-xs text-blue-200 hover:text-white hover:underline">
                      Khám phá Marketplace →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/marketplace"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/18 text-white text-sm font-semibold rounded-xl border border-white/15 transition-colors duration-200"
                >
                  Xem toàn bộ tài liệu
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 2: Mentor ── */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl shadow-blue-950/20 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
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
                  <div className="divide-y divide-white/10">
                    {mentors.map((mentor) => (
                      <MentorCard key={mentor._id} mentor={mentor} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-blue-50/75">Chưa có mentor nào</p>
                    <Link to="/mentors" className="mt-2 inline-block text-xs text-blue-200 hover:text-white hover:underline">
                      Khám phá Mentors →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/mentors"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/18 text-white text-sm font-semibold rounded-xl border border-white/15 transition-colors duration-200"
                >
                  Xem tất cả Mentor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 3: Diễn đàn ── */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl shadow-blue-950/20 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5">
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
                  <div className="divide-y divide-white/10">
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <MessageSquare className="w-10 h-10 text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-blue-50/75">Chưa có bài viết nào</p>
                    <Link to="/forum" className="mt-2 inline-block text-xs text-blue-200 hover:text-white hover:underline">
                      Vào Diễn đàn →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/forum"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/18 text-white text-sm font-semibold rounded-xl border border-white/15 transition-colors duration-200"
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
              className="group flex items-center gap-4 p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white border border-white/15 hover:bg-white/18 hover:shadow-xl hover:shadow-blue-950/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-base mb-0.5">AI Chatbot GPT</p>
                <p className="text-blue-100/75 text-xs">Trò chuyện GPT, hỏi đáp nhanh và hỗ trợ học tập tức thì</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="group flex items-center gap-4 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 hover:bg-white/18 hover:shadow-lg hover:shadow-blue-950/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <p className="font-bold text-base text-white mb-0.5">Tham gia ngay - Miễn phí!</p>
                <p className="text-blue-100/75 text-xs">Đăng ký trong 30 giây, không cần thẻ tín dụng</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-blue-100 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 bg-slate-950/45 backdrop-blur-xl text-white py-8 px-4 mt-4 border-t border-white/10">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center overflow-hidden border border-white/30">
                  <img
                    src={heroLogo}
                    alt="F.EdTech"
                    className="h-full w-full object-contain p-1"
                    draggable="false"
                  />
                </div>
                <span className="text-lg font-bold">F.<span className="text-blue-200">EdTech</span></span>
              </Link>
              <p className="text-blue-100/70 text-xs max-w-xs leading-relaxed">
                Nền tảng học tập số dành cho sinh viên FPT — chia sẻ tài liệu, kết nối mentor, và học cùng AI.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {SOCIAL_BUTTONS.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/18 rounded-lg text-xs font-medium text-blue-100/80 hover:text-white transition-all duration-200 border border-white/10"
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
              <p className="col-span-2 text-xs font-semibold text-blue-100/70 uppercase mb-1">Tính năng</p>
              {NAV_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="text-blue-100/70 hover:text-white transition-colors flex items-center gap-1.5 py-0.5">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-100/55">
            <p>© 2026 F.EdTech. Nền tảng quản lý học tập thông minh.</p>
            <p>Được xây dựng với ❤️ bởi sinh viên FPT</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
