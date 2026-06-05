import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Modal } from '../ui';
import { userService } from '../../services/userService';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
const PAGE_LIMIT = 20;

const roleLabels = {
  student: 'Sinh viên',
  mentor: 'Mentor',
  admin: 'Quản trị viên',
};

export default function FollowListModal({ isOpen, onClose, userId, type = 'followers', currentUserId }) {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [startingChatId, setStartingChatId] = useState('');

  const title = useMemo(() => type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi', [type]);

  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setUsers([]);
      setPagination(null);
      return;
    }

    if (!userId) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = type === 'followers'
          ? await userService.getFollowers(userId, { page, limit: PAGE_LIMIT })
          : await userService.getFollowing(userId, { page, limit: PAGE_LIMIT });

        setUsers(data?.users || []);
        setPagination(data?.pagination || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải danh sách kết nối');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, userId, type, page]);

  const handleOpenProfile = (targetUserId) => {
    if (!targetUserId) return;
    onClose();
    navigate(`/profile/${targetUserId}`);
  };

  const handleStartChat = async (targetUserId) => {
    if (!targetUserId) return;
    if (!isAuthenticated) {
      onClose();
      navigate('/login');
      return;
    }

    setStartingChatId(targetUserId);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/conversations`,
        { participantId: targetUserId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onClose();
      navigate('/chat', { state: { participantId: targetUserId, conversationId: data.data?._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setStartingChatId('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center">
            <UserIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {type === 'followers' ? 'Chưa có ai theo dõi.' : 'Chưa theo dõi ai.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
            {users.map((user) => {
              const targetUserId = user?._id || user?.id;
              const isSelf = String(targetUserId || '') === String(currentUserId || '');
              const isStarting = startingChatId === targetUserId;

              return (
                <div
                  key={targetUserId}
                  className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenProfile(targetUserId)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=8b6cf0&color=fff&size=96`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name || 'Người dùng'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{roleLabels[user.role] || 'Người dùng'}</p>
                    </div>
                  </button>

                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleStartChat(targetUserId)}
                      disabled={isStarting}
                      className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-60 flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isStarting ? 'Đang mở...' : 'Nhắn tin'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t glass-divider border">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-2 rounded-xl text-sm font-semibold glass-nav-link disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages || loading}
              className="px-3 py-2 rounded-xl text-sm font-semibold glass-nav-link disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
