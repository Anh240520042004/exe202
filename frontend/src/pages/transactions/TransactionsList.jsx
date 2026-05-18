import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionService } from "../../services/transactionService";

import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  CardSkeleton,
  Skeleton
} from "../../components/ui";
import { LoginRequired } from "../../components/ui";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

const categoryLabels = {
  salary: 'Lương',
  investment: 'Đầu tư',
  food: 'Ăn uống',
  transport: 'Di chuyển',
  shopping: 'Mua sắm',
  bills: 'Hóa đơn',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Giáo dục',
  document_purchase: 'Mua tài liệu',
  mentor_session: 'Buổi mentor',
  subscription: 'Đăng ký',
  refund: 'Hoàn tiền',
  other: 'Khác',
};

const statusLabels = {
  pending: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

const categoryOptions = [
  { value: 'salary', label: 'Lương' },
  { value: 'investment', label: 'Đầu tư' },
  { value: 'food', label: 'Ăn uống' },
  { value: 'transport', label: 'Di chuyển' },
  { value: 'shopping', label: 'Mua sắm' },
  { value: 'bills', label: 'Hóa đơn' },
  { value: 'entertainment', label: 'Giải trí' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'education', label: 'Giáo dục' },
  { value: 'document_purchase', label: 'Mua tài liệu' },
  { value: 'mentor_session', label: 'Buổi mentor' },
  { value: 'subscription', label: 'Đăng ký' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'other', label: 'Khác' },
];

const typeOptions = [
  { value: 'income', label: 'Thu nhập' },
  { value: 'expense', label: 'Chi tiêu' },
];

const statusOptions = [
  { value: 'pending', label: 'Đang xử lý' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function TransactionsList() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await transactionService.getAll({
        page,
        limit: 10,
        ...filters,
      });

      // response is { success, message, data: [...], pagination }
      const data = response?.data || [];
      const paginationData = response?.pagination || null;

      setTransactions(Array.isArray(data) ? data : []);
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Lỗi khi tải dữ liệu');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = () => {
    fetchTransactions(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', type: '', category: '', status: '' });
    fetchTransactions(1);
  };

  const handleDelete = async () => {
    try {
      await transactionService.delete(deleteModal.id);
      toast.success('Xóa giao dịch thành công!');
      setDeleteModal({ open: false, id: null });
      fetchTransactions(pagination?.currentPage);
    } catch (error) {
      toast.error('Xóa giao dịch thất bại');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <LoginRequired title="Giao dịch" message="Bạn cần đăng nhập để xem lịch sử giao dịch">
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giao dịch</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tất cả giao dịch của bạn
          </p>
        </div>
        <Link to="/transactions/create">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Thêm giao dịch
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm giao dịch..."
              icon={Search}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6">
            <Select
              label="Loại giao dịch"
              options={typeOptions}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              placeholder="Tất cả"
            />
            <Select
              label="Danh mục"
              options={categoryOptions}
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Tất cả"
            />
            <Select
              label="Trạng thái"
              options={statusOptions}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              placeholder="Tất cả"
            />
            <div className="sm:col-span-3 flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
              <Button onClick={handleApplyFilters}>
                Áp dụng
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Mô tả</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Danh mục</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Ngày</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Số tiền</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trạng thái</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${transaction.type === 'income'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {transaction.description || categoryLabels[transaction.category]}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="default">
                          {categoryLabels[transaction.category]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={`py-4 px-4 text-right font-semibold ${transaction.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {statusLabels[transaction.status]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/transactions/edit/${transaction._id}`)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: transaction._id })}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} của {pagination.totalItems}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chưa có giao dịch nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bắt đầu thêm giao dịch đầu tiên của bạn
            </p>
            <Link to="/transactions/create">
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                Thêm giao dịch
              </Button>
            </Link>
          </div>
        )}
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Xóa giao dịch"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, id: null })}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </Modal>
      </div>
    </LoginRequired>
  );
}
