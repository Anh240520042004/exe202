import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, User, Clock, Shield } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: currentUser, accessToken, isAuthenticated } = useSelector(state => state.auth);
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use ref so token value is always current inside effect (not stale closure)
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const headers = {};
        if (tokenRef.current) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        const { data } = await axios.get(`${API_URL}/api/users/${userId}`, { headers });
        setProfile(data.data?.user);
        setStats(data.data?.stats);
        setIsFollowing(data.data?.isFollowing ?? false);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const fetchPosts = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/posts/users/${userId}/posts`);
      setPosts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  useEffect(() => { if (userId) fetchPosts(); }, [userId]);

  const handleFollow = async () => {
    if (!isAuthenticated) return navigate('/login');
    const token = tokenRef.current;
    try {
      const { data } = await axios.post(
        `${API_URL}/api/users/${userId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const following = data.data?.following ?? false;
      const nextStats = data.data?.stats;
      setIsFollowing(following);
      setStats(prev => {
        if (nextStats) {
          return {
            ...prev,
            followerCount: nextStats.followerCount,
          };
        }
        return prev ? {
          ...prev,
          followerCount: Math.max(0, following ? prev.followerCount + 1 : prev.followerCount - 1),
        } : prev;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi theo dõi');
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) return navigate('/login');
    const token = tokenRef.current;
    try {
      const { data } = await axios.post(
        `${API_URL}/api/conversations`,
        { participantId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/chat', { state: { participantId: userId, conversationId: data.data?._id } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[420px] bg-slate-950 flex items-center justify-center rounded-2xl">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[420px] bg-slate-950 flex items-center justify-center rounded-2xl">
        <p className="text-white/50">Không tìm thấy người dùng</p>
      </div>
    );
  }

  // Normalize currentUser id for comparison
  const currentUserId = currentUser?.id || currentUser?._id || '';
  const isOwn = currentUserId === userId;

  return (
    <div className="bg-slate-950 text-white rounded-2xl overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-primary-900/50 to-black">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=6366f1&color=fff&size=128`}
              alt={profile.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/10"
            />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">{profile.name || 'Không có tên'}</h1>
              <p className="text-white/50 text-sm mb-2">{
                { student: 'Sinh viên', mentor: 'Mentor', admin: 'Quản trị viên' }[profile.role] || 'Người dùng'
              }</p>
              {profile.email && (
                <p className="text-white/50 text-sm mb-3">{profile.email}</p>
              )}

              {profile.bio && (
                <p className="text-white/60 text-sm mb-4 max-w-lg">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 mb-4">
                <div className="text-center">
                  <span className="text-xl font-bold text-white">{stats?.followerCount ?? 0}</span>
                  <p className="text-white/40 text-xs">Followers</p>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-white">{stats?.followeeCount ?? 0}</span>
                  <p className="text-white/40 text-xs">Following</p>
                </div>
                <div className="text-center">
                  <span className="text-xl font-bold text-white">{stats?.postCount ?? 0}</span>
                  <p className="text-white/40 text-xs">Bài viết</p>
                </div>
              </div>

              {!isOwn && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                      isFollowing
                        ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                        : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/30'
                    }`}
                  >
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/20 transition-all"
                  >
                    Nhắn tin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-white mb-6">Bài viết ({posts.length})</h2>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30">Chưa có bài viết nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <article key={post._id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all">
                <Link to={`/forum/${post._id}`}>
                  <h3 className="text-lg font-bold text-white mb-2 hover:text-primary-300 transition-colors">{post.title}</h3>
                  <p className="text-white/50 text-sm line-clamp-2 mb-3">{post.content}</p>
                </Link>
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-primary-500/10 text-primary-300 text-xs rounded-full">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-white/30 text-sm">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likeCount ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentCount ?? 0}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.viewCount ?? 0}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
