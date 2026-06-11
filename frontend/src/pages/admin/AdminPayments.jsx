import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Search, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Skeleton } from '../../components/ui';
import { API_BASE, API_ORIGIN } from '../../config/api';

export default function AdminPayments() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders/admin/pending-payments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
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
    setProcessing(true);

    try {
      const endpoint = actionType === 'approve' 
        ? `/api/orders/${selectedOrder._id}/approve`
        : `/api/orders/${selectedOrder._id}/reject`;

      const response = await fetch(`${API_ORIGIN}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(actionType === 'approve' 
          ? 'Đã xác nhận thanh toán!' 
          : 'Đã từ chối thanh toán!'
        );
        setShowModal(false);
        fetchPendingPayments();
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý thanh toán
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Xác nhận các yêu cầu thanh toán chuyển khoản
          </p>
        </div>
        <Badge variant="warning" className="text-base px-4 py-2">
          <Clock className="w-4 h-4 mr-1" />
          {orders.length} chờ xử lý
        </Badge>
      </div>

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

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
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
                  <Badge variant="warning">
                    <Clock className="w-3 h-3 mr-1" />
                    Chờ xác nhận
                  </Badge>
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
