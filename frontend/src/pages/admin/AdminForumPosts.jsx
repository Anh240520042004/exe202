import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, MessageCircle, Search, ShieldOff, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Badge, Button, Card, Skeleton } from '../../components/ui';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'visible', label: 'Đang hiển thị' },
  { value: 'hidden', label: 'Đã ẩn' },
];

export default function AdminForumPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (filter === 'hidden') params.hidden = 'true';
      if (filter === 'visible') params.hidden = 'false';

      const { data } = await api.get('/posts/admin/all', { params });
      setPosts(data.data?.posts || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleToggleHidden = async (post) => {
    const nextHidden = !post.isHidden;
    const reason = nextHidden ? window.prompt('Lý do ẩn bài viết (tùy chọn):') : null;

    if (nextHidden && reason === null) return;

    setProcessingId(post._id);
    try {
      const { data } = await api.patch(`/posts/${post._id}/hide`, {
        hidden: nextHidden,
        reason: reason?.trim() || null,
      });

      setPosts((prev) =>
        prev.map((item) =>
          item._id === post._id
            ? {
                ...item,
                isHidden: data.data?.isHidden,
                hiddenReason: nextHidden ? reason?.trim() || null : null,
              }
            : item
        )
      );

      toast.success(nextHidden ? 'Đã ẩn bài viết' : 'Đã hiển thị lại bài viết');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật bài viết');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      post.title?.toLowerCase().includes(search) ||
      post.content?.toLowerCase().includes(search) ||
      post.author?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý bài đăng diễn đàn</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Admin có thể ẩn bài vi phạm và hiển thị lại khi cần.
          </p>
        </div>
        <Badge variant="info" className="text-base px-4 py-2">
          {posts.length} bài viết
        </Badge>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung hoặc tác giả..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/50 py-2.5 pl-10 pr-4 text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="flex rounded-xl border border-gray-200 bg-white/40 p-1 dark:border-gray-700 dark:bg-white/5">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filter === item.value
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <ShieldOff className="mx-auto mb-4 h-14 w-14 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Không có bài viết phù hợp</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={post.isHidden ? 'danger' : 'success'}>
                      {post.isHidden ? 'Đã ẩn' : 'Đang hiển thị'}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <Link
                    to={`/forum/${post._id}`}
                    className="line-clamp-2 text-lg font-semibold text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-300"
                  >
                    {post.title}
                  </Link>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {post.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Tác giả: {post.author?.name || 'Không rõ'}</span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {post.likeCount || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentCount || 0}
                    </span>
                  </div>

                  {post.isHidden && post.hiddenReason && (
                    <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                      Lý do ẩn: {post.hiddenReason}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant={post.isHidden ? 'success' : 'danger'}
                    size="sm"
                    isLoading={processingId === post._id}
                    onClick={() => handleToggleHidden(post)}
                  >
                    {post.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {post.isHidden ? 'Hiện lại' : 'Ẩn bài'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
