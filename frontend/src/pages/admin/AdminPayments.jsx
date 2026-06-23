import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Search, Star, Zap, Crown, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Skeleton } from '../../components/ui';
import { API_BASE, API_ORIGIN } from '../../config/api';

const TABS = [
  { key: 'documents', label: 'Thanh toán tài liệu' },
  { key: 'promotions', label: 'Gói đề xuất Mentor' },
];

const PLAN_LABELS = {
  '7_days': { label: '7 Ngày', icon: Zap, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  '30_days': { label: '30 Ngày', icon: Star, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400' },
  yearly: { label: '1 Năm', icon: Crown, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function AdminPayments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');

  // Document payments
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mentor promotion transactions
  const [promotionTxns, setPromotionTxns] = useState([]);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSearch, setPromotionSearch] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    if (activeTab === 'promotions' && promotionTxns.length === 0) {
      fetchPromotionTransactions();
    }
  }, [activeTab]);

  const fetchPendingPayments = async ({ silent = false } = {}) => {
    try {
      const response = await fetch(`${API_BASE}/orders/admin/pending-payments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const nextOrders = data.data.orders || [];
        setOrders(nextOrders);
        return nextOrders;
      }
    } catch (error) {
      if (!silent) toast.error('Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
    return [];
  };

  const fetchPromotionTransactions = async () => {
    setPromotionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transactions/admin/all?category=top_suggestion&limit=50&sortBy=createdAt&sortOrder=desc`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPromotionTxns(data.data?.transactions || data.data?.items || data.data || []);
      }
    } catch {
      toast.error('Không thể tải giao dịch đề xuất mentor');
    } finally {
      setPromotionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = (order, type) => {
    setSelectedOrder(order);
    setActionType(type);
    setAdminNotes('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedOrder) return;
    const orderToProcess = selectedOrder;
    const currentAction = actionType;
    const previousOrders = orders;

    setProcessing(true);
    setOrders((current) => current.filter((order) => order._id !== orderToProcess._id));
    setShowModal(false);
    toast.success(currentAction === 'approve' ? 'Đã xác nhận thanh toán!' : 'Đã từ chối thanh toán!');

    try {
      const endpoint = currentAction === 'approve'
        ? `/api/orders/${orderToProcess._id}/approve`
        : `/api/orders/${orderToProcess._id}/reject`;

      const response = await fetch(`${API_ORIGIN}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentAction === 'approve' ? { adminNotes } : { reason: adminNotes })
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        if (response.status === 400 && data.message === 'Order already paid') {
          return;
        }
        const nextOrders = await fetchPendingPayments({ silent: true });
        const stillPending = nextOrders.some((order) => order._id === orderToProcess._id);
        if (!stillPending) return;
        throw new Error(data.message || 'Không thể xử lý thanh toán');
      }

      await fetchPendingPayments({ silent: true });
    } catch (error) {
      console.error('Payment action failed:', error);
      setOrders(previousOrders);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.user?.name?.toLowerCase().includes(search) ||
      order.user?.email?.toLowerCase().includes(search) ||
      order._id?.toLowerCase().includes(search)
    );
  });

  const filteredPromotions = promotionTxns.filter(txn => {
    if (!promotionSearch) return true;
    const search = promotionSearch.toLowerCase();
    return (
      txn.user?.name?.toLowerCase().includes(search) ||
      txn.user?.email?.toLowerCase().includes(search) ||
      txn.transactionCode?.toLowerCase().includes(search) ||
      txn.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý thanh toán
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Xác nhận thanh toán tài liệu & theo dõi gói đề xuất mentor
          </p>
        </div>
        <Badge variant="warning" className="text-base px-4 py-2">
          <Clock className="w-4 h-4 mr-1" />
          {orders.length} chờ xử lý
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.key === 'documents' && orders.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Document payments */}
      {activeTab === 'documents' && (
        <>
          {/* Search */}
          <Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc mã đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl glass-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </Card>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Tất cả đã được xử lý!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Không có yêu cầu thanh toán nào đang chờ xử lý.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order._id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-400/15 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {order.user?.name || 'Người dùng'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="glass-subtle/50 rounded-xl p-3 mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Tài liệu đã đặt:
                        </p>
                        <ul className="space-y-1">
                          {order.documents?.map((doc, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-900 dark:text-white">
                                {doc.document?.title || 'Tài liệu'}
                              </span>
                              <span className="text-gray-500">
                                {formatCurrency(doc.price)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Mã đơn: <code className="glass-subtle px-1 rounded">{order._id.slice(-8)}</code></span>
                        <span>|</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-primary-600 mb-3">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      {order.paymentStatus === 'paid' ? (
                        <Badge variant="success" className="mb-2 w-full justify-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Đã nhận tiền - Cần kích hoạt
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="mb-2 w-full justify-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Chờ xác nhận tiền
                        </Badge>
                      )}
                      <Badge variant="info" className="mt-2">
                        {order.paymentMethod === 'sepay' ? 'SePay/VietQR' :
                         order.paymentMethod === 'vnpay' ? 'VNPay' :
                         order.paymentMethod === 'momo' ? 'MoMo' :
                         order.paymentMethod === 'banking' ? 'Chuyển khoản' : 'Khác'}
                      </Badge>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAction(order, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Xác nhận
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAction(order, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Mentor Promotion Transactions */}
      {activeTab === 'promotions' && (
        <>
          <Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên mentor, email, mã giao dịch..."
                value={promotionSearch}
                onChange={(e) => setPromotionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl glass-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </Card>

          {promotionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredPromotions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Chưa có giao dịch đề xuất
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có mentor nào thanh toán gói đề xuất.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPromotions.map((txn) => {
                // Try to detect plan from description or amount
                let planKey = null;
                if (txn.amount <= 19000) planKey = '7_days';
                else if (txn.amount <= 49000) planKey = '30_days';
                else planKey = 'yearly';
                const planInfo = PLAN_LABELS[planKey] || {};
                const PlanIcon = planInfo.icon || CreditCard;

                return (
                  <Card key={txn._id}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${planInfo.color || 'bg-gray-100 text-gray-600'}`}>
                        <PlanIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {txn.user?.name || 'Mentor'}
                          </p>
                          <span className="text-xs text-gray-400">({txn.user?.email})</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {txn.description || `Gói ${planInfo.label || ''}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{formatDate(txn.createdAt)}</span>
                          {txn.transactionCode && (
                            <>
                              <span>·</span>
                              <code className="font-mono">{txn.transactionCode}</code>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          {formatCurrency(txn.amount)}
                        </p>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 mt-1 rounded ${
                          txn.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : txn.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {txn.status === 'completed' ? '✓ Đã thanh toán' :
                           txn.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={actionType === 'approve' ? 'Xác nhận thanh toán' : 'Từ chối thanh toán'}
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Người dùng:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedOrder.user?.name} ({selectedOrder.user?.email})
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Số tiền:</p>
              <p className="text-xl font-bold text-primary-600">
                {formatCurrency(selectedOrder.totalAmount)}
              </p>
            </div>

            {actionType === 'approve' && (
              <p className="text-gray-600 dark:text-gray-400">
                Bạn có chắc chắn xác nhận thanh toán này? Người dùng sẽ có thể tải tài liệu.
              </p>
            )}

            {actionType === 'reject' && (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  Bạn có chắc chắn từ chối thanh toán này?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lý do từ chối (tùy chọn)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl glass-card text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={confirmAction}
                isLoading={processing}
              >
                {actionType === 'approve' ? 'Xác nhận' : 'Từ chối'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
