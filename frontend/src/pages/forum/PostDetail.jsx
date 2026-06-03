import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2, Edit, Flag } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const makeMediaUrl = (url) => {
  if (!url) return url;
  return url.startsWith('/uploads') ? `${API_URL}${url}` : url;
};

const CommentItem = ({ comment, onReply, isOwn, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent, comment._id);
    setReplyContent('');
    setReplying(false);
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <Link to={`/profile/${comment.author?._id}`}>
          <img
            src={makeMediaUrl(comment.author?.avatar) || `https://ui-avatars.com/api/?name=${comment.author?.name || 'U'}&background=6366f1&color=fff`}
            alt={comment.author?.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Link
                to={`/profile/${comment.author?._id}`}
                className="font-semibold text-white text-sm hover:text-primary-300"
              >
                {comment.author?.name || 'Unknown'}
              </Link>
              <span className="text-white/30 text-xs">
                {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <button
              onClick={() => onReply(null, comment._id)}
              className="text-white/40 hover:text-primary-400 text-xs transition-colors"
            >
              Trả lời
            </button>
            {isOwn && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-white/30 hover:text-red-400 text-xs transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {replying && (
            <div className="flex gap-2 mt-2 ml-2">
              <input
                type="text"
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                placeholder="Viết trả lời..."
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 text-sm outline-none focus:border-primary-500/50"
                autoFocus
              />
              <button onClick={handleReply} className="p-1.5 bg-primary-500 rounded-lg">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => setReplying(false)} className="p-1.5 text-white/40 hover:text-white">Hủy</button>
            </div>
          )}

          {comment.replyCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-primary-400 text-xs mt-2 ml-2 hover:text-primary-300"
            >
              {showReplies ? 'Ẩn' : `Xem ${comment.replyCount} trả lời`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useSelector(state => state.auth);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchPost = async () => {
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const { data } = await axios.get(`${API_URL}/api/posts/${id}`, { headers });
      const postData = data.data?.post;
      setPost(postData);
      setComments(data.data?.comments || []);
      setLikeCount(data.data?.post?.likeCount || 0);

      if (isAuthenticated && postData?.author?._id && postData.author._id !== user?._id) {
        const profileRes = await axios.get(`${API_URL}/api/users/${postData.author._id}`, { headers });
        setIsFollowing(profileRes.data.data?.isFollowing || false);
      }
    } catch (err) {
      toast.error('Không tìm thấy bài viết');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const { data } = await axios.post(
        `${API_URL}/api/posts/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setIsLiked(data.data.liked);
      setLikeCount(data.data.likeCount);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await axios.delete(`${API_URL}/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success('Đã xóa bài viết');
      navigate('/forum');
    } catch (err) {
      toast.error('Không thể xóa bài viết');
    }
  };

  const handleComment = async (content, parentId = null) => {
    if (!isAuthenticated) return navigate('/login');
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/posts/${id}/comments`,
        { content, parentId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setComments(prev => [...prev, data.data]);
      setPost(prev => ({ ...prev, commentCount: prev.commentCount + 1 }));
      setCommentContent('');
      toast.success('Đã bình luận');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPost(prev => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
    } catch (err) {
      toast.error('Không thể xóa bình luận');
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!post?.author?._id) return;

    setFollowLoading(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/users/${post.author._id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setIsFollowing(data.data?.following);
      toast.success(data.data?.following ? 'Đã theo dõi' : 'Bỏ theo dõi thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái theo dõi');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!post?.author?._id) return;

    try {
      const { data } = await axios.post(
        `${API_URL}/api/conversations`,
        { participantId: post.author._id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const conversationId = data.data?._id;
      navigate('/chat', { state: { participantId: post.author._id, conversationId } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  const isOwner = user?.id === post.author?._id || user?._id === post.author?._id;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/forum')}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Quay lại diễn đàn</span>
        </button>

        {/* Post */}
        <article className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 mb-8">
          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            <Link to={`/profile/${post.author?._id}`}>
              <img
                src={makeMediaUrl(post.author?.avatar) || `https://ui-avatars.com/api/?name=${post.author?.name || 'U'}&background=6366f1&color=fff`}
                alt={post.author?.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1">
              <Link
                to={`/profile/${post.author?._id}`}
                className="font-bold text-white hover:text-primary-300 text-lg block"
              >
                {post.author?.name || 'Unknown'}
              </Link>
              <p className="text-white/40 text-sm">
                {new Date(post.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              {isAuthenticated && user?._id !== post.author?._id && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${isFollowing ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/30'}`}
                  >
                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                  >
                    Nhắn tin
                  </button>
                </div>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button onClick={handleDeletePost} className="p-2 text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold text-white mb-6 leading-tight">{post.title}</h1>
          <p className="text-white/70 leading-relaxed text-base whitespace-pre-wrap mb-6">{post.content}</p>

          {/* Images */}
          {post.images?.length > 0 && (
            <div className={`grid gap-3 mb-6 ${post.images.length === 1 ? 'max-w-lg' : ''}`}
              style={{ gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {post.images.map((img, i) => (
                <img key={i} src={makeMediaUrl(img)} alt="" className="w-full object-cover rounded-xl max-h-96" />
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-white/5">
              {post.tags.map(tag => (
                <Link key={tag} to={`/forum?tag=${tag}`} className="px-3 py-1.5 bg-primary-500/10 text-primary-300 text-sm rounded-full border border-primary-500/20 hover:bg-primary-500/20 transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isLiked ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/20'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likeCount}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post.commentCount}</span>
            </div>

            <div className="ml-auto flex items-center gap-2 text-white/30 text-sm">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount} lượt xem</span>
            </div>
          </div>
        </article>

        {/* Comments */}
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Bình luận ({post.commentCount})
          </h3>

          {/* Comment Form */}
          {isAuthenticated ? (
            <div className="flex gap-3 mb-6">
              <img
                src={makeMediaUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=6366f1&color=fff`}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <textarea
                  placeholder="Viết bình luận..."
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  rows={2}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm outline-none focus:border-primary-500/50 transition-colors resize-none"
                />
                <button
                  onClick={() => handleComment(commentContent)}
                  disabled={submitting || !commentContent.trim()}
                  className="px-4 py-2.5 bg-primary-500 rounded-xl text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 mb-6 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/50 text-sm mb-2">Đăng nhập để bình luận</p>
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-medium">Đăng nhập ngay</Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem
                key={comment._id}
                comment={comment}
                isOwn={user?.id === comment.author?._id || user?._id === comment.author?._id}
                onReply={(content, parentId) => handleComment(content, parentId)}
                onDelete={handleDeleteComment}
              />
            ))}
            {comments.length === 0 && (
              <p className="text-center text-white/30 py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Eye = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
