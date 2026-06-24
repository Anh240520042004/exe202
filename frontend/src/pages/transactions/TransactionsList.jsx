import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  ShoppingBag, Star, Heart, Receipt,
  CheckCircle, Clock, XCircle, AlertCircle,
  RefreshCw, Trash2, X, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionService } from '../../services/transactionService';
import { Card, Skeleton } from '../../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

// 3 loại giao dịch hợp lệ hiển thị trên UI:
// - document_purchase: User mua tài liệu (đang hoạt động)
// - top_suggestion:   Mentor trả gói ưu tiên đề xuất (sắp ra)
// - donate:           Mentor donate cho nền tảng (sắp ra)
// Lưu ý: mentor_session vẫn tồn tại trong DB enum nhưng không hiển thị ở UI
const CATEGORY_CONFIG = {
  document_purchase: {
    label: 'Mua tài liệu',
    icon: ShoppingBag,
    color: 'from-blue-500 to-cyan-500',
    badgeCls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    status: 'active',
  },
  top_suggestion: {
    label: 'Đề xuất top',
    icon: Star,
    color: 'from-amber-500 to-orange-500',
    badgeCls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    status: 'coming',
  },
  donate: {
    label: 'Donate',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    badgeCls: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
    status: 'planned',
  },
};

const STATUS_CONFIG = {
  completed: {
    label: 'Hoàn thành',
    icon: CheckCircle,
    cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  pending: {
    label: 'Đang xử lý',
    icon: Clock,
    cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  failed: {
    label: 'Thất bại',
    icon: XCircle,
    cls: 'bg-red-500/15 text-red-400 border border-red-500/30',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: AlertCircle,
    cls: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  },
};

const ROLE_CONFIG = {
  admin: { label: 'Admin', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  mentor: { label: 'Mentor', cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/30' },
  student: { label: 'Student', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
};

const PAYMENT_METHOD_LABELS = {
  sepay: 'SePay/VietQR',
  vnpay: 'VNPay',
  momo: 'MoMo',
  banking: 'Chuyển khoản',
  credit: 'Thẻ tín dụng',
  wallet: 'Ví điện tử',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getInitials = (name = '') =>
  name.trim().split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, gradient, Icon }) => (
  <div className="glass-card rounded-2xl p-5 flex items-center gap-4 bg-white/95 border border-slate-200/90 dark:bg-slate-900/85 dark:border-white/10">
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  </div>
);

const CATEGORY_LEGACY_LABELS = {
  mentor_session: 'Buổi mentor',
  subscription: 'Đăng ký',
  refund: 'Hoàn tiền',
  other: 'Khác',
};

const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category];
  if (!cfg) {
    // Legacy / unknown category — hiển thị nhãn thân thiện thay vì raw key
    const legacyLabel = CATEGORY_LEGACY_LABELS[category] || category;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
        <Receipt className="w-3 h-3" />
        {legacyLabel}
      </span>
    );
  }
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badgeCls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
      {cfg.status === 'coming' && (
        <span className="ml-1 px-1 rounded text-[9px] bg-amber-500/30 text-amber-300">Sắp ra</span>
      )}
      {cfg.status === 'planned' && (
        <span className="ml-1 px-1 rounded text-[9px] bg-pink-500/30 text-pink-300">Sắp ra</span>
      )}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const UserAvatar = ({ user }) => {
  const initials = getInitials(user?.name);
  const colorClass = user?.role === 'admin'
    ? 'from-red-500 to-rose-600'
    : user?.role === 'mentor'
      ? 'from-purple-500 to-violet-600'
      : 'from-blue-500 to-cyan-600';

  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="text-white text-xs font-bold">{initials}</span>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentHistory() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role === 'admin';

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk delete state (admin only)
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const allPageIds = transactions.map((t) => t._id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      const res = await transactionService.bulkDelete(selectedIds);
      toast.success(res?.message || `Đã xóa ${selectedIds.length} giao dịch`);
      setSelectedIds([]);
      setShowBulkConfirm(false);
      fetchTransactions(currentPage);
    } catch {
      toast.error('Xóa thất bại, vui lòng thử lại');
    } finally {
      setBulkDeleting(false);
    }
  };

  const fetchTransactions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20, ...filters };

      let response;
      if (isAdmin) {
        response = await transactionService.getAllAdmin(params);
      } else {
        response = await transactionService.getMyPayments(params);
      }

      const data = response?.data ?? [];
      const paginationData = response?.pagination ?? null;
      const responseStats = response?.stats ?? null;

      setTransactions(Array.isArray(data) ? data : []);
      setPagination(paginationData);

      if (isAdmin) {
        setStats({
          total: responseStats?.totalTransactions ?? paginationData?.totalItems ?? data.length,
          completed: responseStats?.completedTransactions ?? 0,
          pending: responseStats?.pendingTransactions ?? 0,
          revenue: responseStats?.completedRevenue ?? 0,
        });
      } else if (page === 1) {
        const completed = data.filter((t) => t.status === 'completed');
        const pending = data.filter((t) => t.status === 'pending');
        const totalRevenue = completed.reduce((s, t) => s + (t.amount || 0), 0);
        setStats({ total: paginationData?.totalItems ?? data.length, completed: completed.length, pending: pending.length, revenue: totalRevenue });
      }
    } catch (error) {
      toast.error('Không thể tải lịch sử thanh toán');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions(1);
  }, [filters, isAdmin]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchTransactions(page);
  };

  const handleRefresh = () => fetchTransactions(currentPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-400" />
            {isAdmin ? 'Lịch sử giao dịch thanh toán' : 'Lịch sử thanh toán của tôi'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm font-medium">
            {isAdmin
              ? 'Toàn bộ giao dịch của tất cả người dùng trên hệ thống'
              : 'Các giao dịch thanh toán của tài khoản bạn'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card bg-white/95 border border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Stats — Admin only */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng giao dịch"
            value={stats.total}
            gradient="from-blue-500 to-cyan-600"
            Icon={Receipt}
          />
          <StatCard
            label="Hoàn thành"
            value={stats.completed}
            gradient="from-emerald-500 to-teal-600"
            Icon={CheckCircle}
          />
          <StatCard
            label="Đang xử lý"
            value={stats.pending}
            gradient="from-amber-500 to-orange-600"
            Icon={Clock}
          />
          <StatCard
            label="Doanh thu (trang này)"
            value={formatCurrency(stats.revenue)}
            sub="Các GD đã hoàn thành"
            gradient="from-purple-500 to-violet-600"
            Icon={TrendingUp}
          />
        </div>
      )}

      {/* Transaction type legend */}
      <Card>
        <div className="flex flex-wrap gap-3 mb-5">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.badgeCls}`}>
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
                {cfg.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {cfg.status !== 'active' && (
                  <span className="px-1 rounded text-[9px] bg-white/10">Sắp ra</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-300" />
            <input
              type="text"
              placeholder={isAdmin ? 'Tìm theo mô tả, mã giao dịch...' : 'Tìm kiếm giao dịch...'}
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 glass-card rounded-xl bg-white/95 border border-slate-200/90 text-sm text-slate-900 placeholder-slate-500 dark:bg-slate-900/85 dark:border-white/10 dark:text-white dark:placeholder-slate-400 focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${showFilters ? 'bg-primary-500/20 border-primary-500/50 text-primary-700 dark:text-primary-300' : 'glass-card bg-white/95 border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-slate-300 dark:hover:text-white'}`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 glass-subtle rounded-xl bg-slate-50/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Loại giao dịch</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="w-full glass-card rounded-xl px-3 py-2 text-sm bg-white/95 border border-slate-200/90 text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-white focus:border-primary-500/50 outline-none"
              >
                <option value="" className="bg-gray-900">Tất cả</option>
                <option value="document_purchase" className="bg-gray-900">Mua tài liệu</option>
                <option value="top_suggestion" className="bg-gray-900">Đề xuất top</option>
                <option value="donate" className="bg-gray-900">Donate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full glass-card rounded-xl px-3 py-2 text-sm bg-white/95 border border-slate-200/90 text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-white focus:border-primary-500/50 outline-none"
              >
                <option value="" className="bg-gray-900">Tất cả</option>
                <option value="completed" className="bg-gray-900">Hoàn thành</option>
                <option value="pending" className="bg-gray-900">Đang xử lý</option>
                <option value="failed" className="bg-gray-900">Thất bại</option>
                <option value="cancelled" className="bg-gray-900">Đã hủy</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                onClick={() => setFilters({ search: '', category: '', status: '' })}
                className="px-4 py-2 rounded-xl glass-card bg-white/95 border border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-slate-300 dark:hover:text-white text-sm font-medium transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-subtle flex items-center justify-center">
              <Receipt className="w-8 h-8 text-slate-500 dark:text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Chưa có giao dịch nào</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              {isAdmin ? 'Chưa có giao dịch thanh toán nào trên hệ thống.' : 'Bạn chưa có giao dịch thanh toán nào.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10">
                  {/* Checkbox column — admin only */}
                  {isAdmin && (
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded accent-primary-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {isAdmin ? 'Người dùng' : 'Giao dịch'}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Loại</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Phương thức</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Số tiền</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isChecked = selectedIds.includes(tx._id);
                  return (
                    <tr
                      key={tx._id}
                      className={`transition-colors group ${isChecked ? 'bg-primary-500/10' : 'hover:bg-white/[0.03]'}`}
                    >
                      {/* Checkbox — admin only */}
                      {isAdmin && (
                        <td className="py-4 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(tx._id)}
                            className="w-4 h-4 rounded accent-primary-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {/* User info */}
                      <td className="py-4 px-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-3">
                            <UserAvatar user={tx.user} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                  {tx.user?.name || 'Người dùng'}
                                </span>
                                <RoleBadge role={tx.user?.role} />
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate block font-medium">
                                {tx.user?.email || '—'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white font-semibold line-clamp-1">
                              {tx.description || '—'}
                            </p>
                            {tx.transactionCode && (
                              <code className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                #{tx.transactionCode.slice(-10)}
                              </code>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <CategoryBadge category={tx.category} />
                        {isAdmin && tx.description && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 max-w-[180px] font-medium">
                            {tx.description}
                          </p>
                        )}
                      </td>

                      {/* Payment method */}
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod || '—'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <StatusBadge status={tx.status} />
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                          {formatDate(tx.createdAt || tx.date)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Hiển thị {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, pagination.totalItems)} / {pagination.totalItems} giao dịch
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-xl glass-card bg-white/95 border border-slate-200/90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 hover:text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-slate-300 dark:hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-xl bg-primary-500/20 text-primary-400 text-sm font-medium">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-xl glass-card bg-white/95 border border-slate-200/90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 hover:text-slate-900 dark:bg-slate-900/85 dark:border-white/10 dark:text-slate-300 dark:hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Floating bulk-action bar ─────────────────────────────────────── */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-card border border-white/15 shadow-2xl shadow-black/40">
            <span className="text-sm text-slate-900 dark:text-white font-medium">
              Đã chọn{' '}
              <span className="text-primary-400 font-bold">{selectedIds.length}</span>{' '}
              giao dịch
            </span>
            <div className="w-px h-5 bg-white/20" />
            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Bỏ chọn
            </button>
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedIds.length} mục
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm dialog ───────────────────────────────────────────────── */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full border border-white/15 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Xác nhận xóa</h3>
                <p className="text-xs text-gray-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Bạn có chắc muốn xóa{' '}
              <span className="text-red-400 font-bold">{selectedIds.length}</span>{' '}
              giao dịch đã chọn?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 py-2.5 rounded-xl glass-card text-gray-400 hover:text-white text-sm transition"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {bulkDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {bulkDeleting ? 'Đang xóa...' : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
