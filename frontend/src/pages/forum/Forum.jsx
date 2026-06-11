import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Plus, Clock, MessageCircle, Heart, Eye, X, Tag } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_ORIGIN } from '../../config/api';

const API_URL = API_ORIGIN;

const makeMediaUrl = (url) => {
  if (!url) return url;
  return url.startsWith('/uploads') ? `${API_URL}${url}` : url;
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', icon: Clock },
  { value: 'hot', label: 'Hot', icon: TrendingUp },
  { value: 'comments', label: 'Nhiều bình luận', icon: MessageCircle },
];

const TagBadge = ({ tag, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-50 dark:bg-white/5 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-100 dark:border-white/10 rounded-full text-xs font-semibold text-primary-700 dark:text-white/70 hover:text-primary-800 dark:hover:text-primary-300 transition-all duration-200"
  >
    <Tag className="w-3 h-3" />
    {tag}
  </button>
);

const PostCard = ({ post, onLike }) => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <article className="glass-card p-6 hover:shadow-lg transition-all duration-300">
      {/* Author info */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={`/profile/${post.author?._id}`}
          onClick={e => e.stopPropagation()}
        >
          <img
            src={makeMediaUrl(post.author?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'U')}&background=8b6cf0&color=fff`}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-primary-200/50 dark:border-white/10"
          />
        </Link>
        <div className="flex-1">
          <Link
            to={`/profile/${post.author?._id}`}
            onClick={e => e.stopPropagation()}
            className="font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-300 transition-colors text-sm"
          >
            {post.author?.name || 'Unknown'}
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {new Date(post.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <Link to={`/forum/${post._id}`}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {post.content}
        </p>
      </Link>

      {/* Images with broken handling */}
      {post.images?.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {post.images.slice(0, 3).map((img, i) => {
            if (!img || img === 'undefined' || img === 'null') return null;
            return (
              <img
                key={i}
                src={makeMediaUrl(img)}
                alt=""
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-white/5"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            );
          })}
          {post.images.length > 3 && (
            <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-white/40 text-sm font-semibold">
              +{post.images.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="px-2.5 py-0.5 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-xs font-semibold rounded-full border border-primary-200 dark:border-primary-500/20">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
        <button
          onClick={() => isAuthenticated && onLike(post._id)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500 dark:text-gray-400'}`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-red-500' : ''}`} />
          <span>{post.likeCount}</span>
        </button>

        <Link
          to={`/forum/${post._id}`}
          className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 text-sm font-medium transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount}</span>
        </Link>

        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-sm ml-auto">
          <Eye className="w-4 h-4" />
          <span>{post.viewCount}</span>
        </div>
      </div>
    </article>
  );
};

export default function Forum() {
  const navigate = useNavigate();
  const { isAuthenticated, user, accessToken } = useSelector(state => state.auth);

  const [posts, setPosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const observerRef = useRef();
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20, sort });
      if (search) params.append('search', search);
      if (activeTag) params.append('tag', activeTag);

      const { data } = await axios.get(`${API_URL}/api/posts?${params}`);
      const newPosts = data.data?.posts || [];

      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setTotalPages(data.data?.pagination?.pages || 1);
      setHasMore(pageNum < (data.data?.pagination?.pages || 1));
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [sort, search, activeTag]);

  const fetchTags = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/posts/tags/trending`);
      setTrendingTags(data.data || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [sort, search, activeTag, fetchPosts]);

  useEffect(() => {
    if (page > 1) fetchPosts(page);
  }, [page]);

  const handleLike = async (postId) => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const { data } = await axios.post(
        `${API_URL}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, isLiked: data.data.liked, likeCount: data.data.likeCount }
          : p
      ));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Diễn đàn</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Chia sẻ kiến thức, kết nối cộng đồng học tập</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => navigate('/forum/create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Đăng bài
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/70 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${sort === opt.value ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="inline-block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tag Filter */}
          {activeTag && (
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl">
              <span className="text-sm text-primary-700 dark:text-primary-300">Lọc theo:</span>
              <span className="px-2.5 py-0.5 bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 text-sm font-semibold rounded-full">#{activeTag}</span>
              <button onClick={() => setActiveTag(null)} className="ml-auto">
                <X className="w-4 h-4 text-primary-700 dark:text-primary-300 hover:opacity-85" />
              </button>
            </div>
          )}

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="space-y-2">
                      <div className="w-32 h-3 bg-gray-200 dark:bg-white/10 rounded" />
                      <div className="w-20 h-2 bg-gray-200 dark:bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-3/4 h-5 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="w-2/3 h-3 bg-gray-200 dark:bg-white/10 rounded" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-3 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card text-center py-20">
              <p className="text-gray-400 dark:text-gray-500 text-lg mb-2">Chưa có bài viết nào</p>
              <p className="text-gray-300 dark:text-gray-600 text-sm">Hãy là người đầu tiên đăng bài!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div key={post._id} ref={i === posts.length - 1 ? lastPostRef : null}>
                  <PostCard post={post} onLike={handleLike} />
                </div>
              ))}
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">Bạn đã xem hết bài viết</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Trending Tags */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Tags phổ biến</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(tag => (
                  <TagBadge
                    key={tag._id || tag.name}
                    tag={tag.name}
                    onClick={() => handleTagClick(tag.name)}
                  />
                ))}
                {trendingTags.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Chưa có tags nào</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Khám phá</h3>
              <div className="space-y-2">
                <Link to="/forum" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300 text-sm py-1.5 transition-colors font-medium">
                  <MessageCircle className="w-4 h-4" />
                  Tất cả bài viết
                </Link>
                <Link to="/forum?sort=hot" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-300 text-sm py-1.5 transition-colors font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Bài viết hot
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
