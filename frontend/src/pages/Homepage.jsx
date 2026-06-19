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
import { ThemeToggle } from '../components/ui';
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
  { id: 'support', href: LINKS.support, icon: HeartHandshake, label: 'Ho Tro', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-white/10 dark:text-blue-100 dark:hover:bg-white/18 dark:border-white/15' },
  { id: 'fpt-university', href: LINKS.fptUniversity, icon: Building2, label: 'DH FPT', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/18 dark:border-white/15' },
  { id: 'fanpage', href: LINKS.fanpage, icon: Facebook, label: 'Trang Cua Chung Toi', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-white/10 dark:text-indigo-100 dark:hover:bg-white/18 dark:border-white/15' },
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
    <div className={`animate-pulse bg-slate-100 dark:bg-white/10 rounded-2xl p-4 border border-slate-200 dark:border-white/15 ${className}`}>
      <div className="h-3 bg-slate-300 dark:bg-white/25 rounded w-2/3 mb-3" />
      <div className="h-3 bg-slate-200 dark:bg-white/15 rounded w-full mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-white/15 rounded w-4/5" />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, to, toLabel = 'Xem tất cả' }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-white/15 flex items-center justify-center border border-blue-100 dark:border-white/15">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-200" />
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-slate-600 dark:text-blue-100/80 ml-9">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-blue-700 bg-white/80 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors duration-200 border border-slate-200 dark:text-white dark:hover:text-blue-100 dark:bg-white/10 dark:hover:bg-white/18 dark:border-white/20"
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
    pdf: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-100 dark:border-red-200/25',
    docx: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-200/25',
    pptx: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-100 dark:border-orange-200/25',
    xlsx: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-100 dark:border-green-200/25',
  };
  const typeColor = typeColors[type] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-blue-100 dark:border-white/15';

  return (
    <Link
      to={`/documents/${doc._id}`}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-100 transition-all duration-200 dark:hover:bg-white/10 dark:hover:border-white/15"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {subject && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md dark:text-blue-100 dark:bg-white/10 dark:border-white/15">
              {subject}
            </span>
          )}
          <span className={`text-xs font-medium border px-1.5 py-0.5 rounded-md uppercase ${typeColor}`}>
            {type}
          </span>
          {price > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md dark:text-amber-100 dark:bg-amber-500/15 dark:border-amber-200/25">
              {price.toLocaleString('vi-VN')}đ
            </span>
          )}
          {price === 0 && (
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md dark:text-green-100 dark:bg-green-500/15 dark:border-green-200/25">
              Miễn phí
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-950 leading-snug truncate group-hover:text-blue-700 transition-colors dark:text-white dark:group-hover:text-blue-100">
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-blue-100/70">
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
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 flex-shrink-0 mt-1 transition-colors dark:text-blue-100/40 dark:group-hover:text-blue-100" />
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
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-100 transition-all duration-200 dark:hover:bg-white/10 dark:hover:border-white/15"
    >
      <Avatar src={avatar} name={name} size="md" userId={mentor?._id} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-950 group-hover:text-blue-700 transition-colors truncate dark:text-white dark:group-hover:text-blue-100">
          {name}
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-600">{rating.toFixed(1)}</span>
            {reviewCount > 0 && <span className="text-xs text-slate-500 dark:text-blue-100/60">({reviewCount})</span>}
          </div>
        )}
        {bio && (
          <p className="text-xs text-slate-600 dark:text-blue-100/75 mt-0.5 line-clamp-1">{bio}</p>
        )}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {expertise.slice(0, 2).map((e, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md dark:bg-white/10 dark:text-blue-100 dark:border-white/15">
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {hourlyRate > 0 ? (
          <span className="text-xs font-bold text-violet-600">
            {hourlyRate.toLocaleString('vi-VN')}đ<span className="text-slate-500 dark:text-blue-100/60 font-normal">/h</span>
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
      className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-100 transition-all duration-200 dark:hover:bg-white/10 dark:hover:border-white/15"
    >
      <div className="flex items-start gap-2">
        <Avatar src={authorAvatar} name={authorName} size="sm" userId={post?.author?._id} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-950 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug dark:text-white dark:group-hover:text-blue-100">
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-blue-100/60">
            <span className="font-medium text-slate-700 dark:text-blue-100">{authorName}</span>
            <span>·</span>
            <span>{timeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-10">
          {tags.slice(0, 3).map((t, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200 dark:bg-white/10 dark:text-blue-100 dark:border-white/15">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 ml-10 text-xs text-slate-500 dark:text-blue-100/65">
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
    <div className="relative min-h-screen overflow-hidden text-slate-950 dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.26),transparent_34%)]" />

      {/* ── Announcement Banner ── */}
      <div className="relative z-20 bg-white/80 text-slate-800 text-center py-2 px-4 text-xs font-medium backdrop-blur-xl border-b border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10">
        🎉 Nền tảng học tập số 1 dành cho sinh viên FPT —{' '}
        <Link to="/register" className="underline font-bold hover:text-violet-200 transition-colors">
          Đăng ký miễn phí ngay!
        </Link>
      </div>

      {/* ── Top Navbar ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/60 border-b border-slate-200 dark:bg-slate-950/55 dark:shadow-blue-950/20 dark:border-white/15'
        : 'bg-white/65 backdrop-blur-md border-b border-slate-200/80 dark:bg-slate-950/35 dark:border-white/10'
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
                <span className="text-base font-bold text-slate-950 dark:text-white leading-none">
                  F.<span className="text-blue-600 dark:text-blue-200">EdTech</span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-blue-100/70 leading-none font-medium">Nền tảng học tập</p>
              </div>
            </Link>

            {/* Center: Nav Links + Social Buttons */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 dark:text-blue-50/85 dark:hover:text-white dark:hover:bg-white/10"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}

              <div className="h-4 w-px bg-slate-200 dark:bg-white/20 mx-1" />

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
              <ThemeToggle />
              {isAuthenticated ? (
                /* ── Đã đăng nhập: avatar + tên + logout ── */
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 group dark:hover:bg-white/10 dark:hover:border-white/15"
                    title="Xem hồ sơ"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-violet-300/60 shadow-sm"
                    />
                    <div className="hidden sm:block leading-tight">
                      <p className="text-sm font-semibold text-slate-950 group-hover:text-blue-700 transition-colors leading-none dark:text-white dark:group-hover:text-blue-100">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-blue-100/65 leading-none mt-0.5">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200 dark:text-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/25 dark:border-red-200/20"
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
                    className="hidden sm:block px-4 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors dark:text-blue-50 dark:hover:text-white"
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
                className="lg:hidden p-2 rounded-lg hover:bg-blue-50 text-slate-700 dark:hover:bg-white/10 dark:text-blue-50"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3 space-y-1 dark:border-white/10 dark:bg-slate-950/70">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all dark:text-blue-50/85 dark:hover:text-white dark:hover:bg-white/10"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}

            {/* Auth section in mobile */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-all dark:hover:bg-white/10"
                  >
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                      alt={user?.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-violet-300/60"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-blue-100/65">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} · Xem hồ sơ →
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-all dark:text-blue-100 dark:hover:bg-white/10"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Vào Dashboard
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all dark:text-red-100 dark:hover:bg-red-500/15"
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
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-blue-50 transition-all dark:text-blue-50 dark:border-white/15 dark:hover:bg-white/10"
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

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2">
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
        <div className="absolute inset-0 bg-white/45 dark:bg-slate-950/28" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.20),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/70 to-transparent dark:from-slate-950/60" />

        <div className={`relative z-10 mx-auto flex min-h-[320px] max-w-screen-xl items-center justify-center transition-all duration-700 sm:min-h-[370px] lg:min-h-[390px] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold text-blue-700 shadow-lg shadow-slate-200/70 backdrop-blur-md sm:text-sm dark:border-white/25 dark:bg-white/14 dark:text-blue-50 dark:shadow-black/20">
              <Zap className="h-4 w-4 fill-blue-300 text-blue-300" />
              Nền tảng học tập #1 cho sinh viên FPT
            </div>
            <h1 className="mx-auto mb-5 max-w-5xl text-4xl font-black leading-[1.28] text-slate-950 drop-shadow-none sm:text-5xl sm:leading-[1.22] lg:text-6xl lg:leading-[1.18] dark:text-white dark:drop-shadow-2xl">
              Học tập thông minh,{' '}
              <span className="text-blue-700 dark:text-blue-100">
                Thành công bền vững
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-base font-medium leading-7 text-slate-700 drop-shadow-none sm:text-lg dark:text-blue-50 dark:drop-shadow-lg">
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
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-8 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-slate-200/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 dark:border-white/35 dark:bg-white/10 dark:text-white dark:shadow-black/15 dark:hover:bg-white/18"
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
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden dark:bg-white/10 dark:border-white/15 dark:shadow-blue-950/20">
              <div className="p-4 border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
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
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {documents.map((doc) => (
                      <DocumentCard key={doc._id} doc={doc} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <BookOpen className="w-10 h-10 text-blue-500 dark:text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-blue-50/75">Chưa có tài liệu nào</p>
                    <Link to="/marketplace" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-200 dark:hover:text-white">
                      Khám phá Marketplace →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/marketplace"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-100 transition-colors duration-200 dark:bg-white/10 dark:hover:bg-white/18 dark:text-white dark:border-white/15"
                >
                  Xem toàn bộ tài liệu
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 2: Mentor ── */}
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden dark:bg-white/10 dark:border-white/15 dark:shadow-blue-950/20">
              <div className="p-4 border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
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
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {mentors.map((mentor) => (
                      <MentorCard key={mentor._id} mentor={mentor} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 text-blue-500 dark:text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-blue-50/75">Chưa có mentor nào</p>
                    <Link to="/mentors" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-200 dark:hover:text-white">
                      Khám phá Mentors →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/mentors"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-100 transition-colors duration-200 dark:bg-white/10 dark:hover:bg-white/18 dark:text-white dark:border-white/15"
                >
                  Xem tất cả Mentor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Section 3: Diễn đàn ── */}
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden dark:bg-white/10 dark:border-white/15 dark:shadow-blue-950/20">
              <div className="p-4 border-b border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
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
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <MessageSquare className="w-10 h-10 text-blue-500 dark:text-blue-100/70 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-blue-50/75">Chưa có bài viết nào</p>
                    <Link to="/forum" className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-200 dark:hover:text-white">
                      Vào Diễn đàn →
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4 pt-2">
                <Link
                  to="/forum"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl border border-blue-100 transition-colors duration-200 dark:bg-white/10 dark:hover:bg-white/18 dark:text-white dark:border-white/15"
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
              className="group flex items-center gap-4 p-4 bg-white/85 backdrop-blur-xl rounded-2xl text-slate-950 border border-slate-200 hover:bg-blue-50 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-0.5 transition-all duration-300 dark:bg-white/10 dark:text-white dark:border-white/15 dark:hover:bg-white/18 dark:hover:shadow-blue-950/30"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform dark:bg-white/20">
                <Bot className="w-6 h-6 text-blue-700 dark:text-white" />
              </div>
              <div>
                <p className="font-bold text-base mb-0.5">AI Chatbot GPT</p>
                <p className="text-slate-600 dark:text-blue-100/75 text-xs">Trò chuyện GPT, hỏi đáp nhanh và hỗ trợ học tập tức thì</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="group flex items-center gap-4 p-4 bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200 hover:bg-blue-50 hover:shadow-lg hover:shadow-slate-200/70 hover:-translate-y-0.5 transition-all duration-300 dark:bg-white/10 dark:border-white/15 dark:hover:bg-white/18 dark:hover:shadow-blue-950/20"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform dark:bg-white/15">
                <Shield className="w-6 h-6 text-blue-700 dark:text-blue-200" />
              </div>
              <div>
                <p className="font-bold text-base text-slate-950 dark:text-white mb-0.5">Tham gia ngay - Miễn phí!</p>
                <p className="text-slate-600 dark:text-blue-100/75 text-xs">Đăng ký trong 30 giây, không cần thẻ tín dụng</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-transform dark:text-blue-100" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-xl text-slate-950 py-8 px-4 mt-4 border-t border-slate-200 dark:bg-slate-950/45 dark:text-white dark:border-white/10">
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
                <span className="text-lg font-bold">F.<span className="text-blue-600 dark:text-blue-200">EdTech</span></span>
              </Link>
              <p className="text-slate-600 dark:text-blue-100/70 text-xs max-w-xs leading-relaxed">
                Nền tảng học tập số dành cho sinh viên FPT — chia sẻ tài liệu, kết nối mentor, và học cùng AI.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {SOCIAL_BUTTONS.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium text-blue-700 hover:text-blue-800 transition-all duration-200 border border-blue-100 dark:bg-white/10 dark:hover:bg-white/18 dark:text-blue-100/80 dark:hover:text-white dark:border-white/10"
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
              <p className="col-span-2 text-xs font-semibold text-slate-500 dark:text-blue-100/70 uppercase mb-1">Tính năng</p>
              {NAV_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="text-slate-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 py-0.5 dark:text-blue-100/70 dark:hover:text-white">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:border-white/10 dark:text-blue-100/55">
            <p>© 2026 F.EdTech. Nền tảng quản lý học tập thông minh.</p>
            <p>Được xây dựng với ❤️ bởi sinh viên FPT</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
