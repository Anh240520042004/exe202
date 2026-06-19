import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  User,
  ArrowRight,
  Download,
  FileText,
} from 'lucide-react';
import { orderService, downloadOrderDocument } from '../../services/api';
import { API_BASE } from '../../config/api';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('code');
  const method = searchParams.get('method');
  const amount = searchParams.get('amount');
  const isVNPayReturnRoute = location.pathname === '/payment/vnpay-return';

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const isSuccess = status === 'success';
  const isVNPay = method === 'vnpay';
  const isSePay = method === 'sepay';

  useEffect(() => {
    if (isVNPayReturnRoute) {
      const query = searchParams.toString();
      window.location.replace(`${API_BASE}/payments/vnpay-return${query ? `?${query}` : ''}`);
      return;
    }

    let isMounted = true;

    const loadOrder = async () => {
      if (!isSuccess || !orderId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await orderService.getById(orderId);
        if (isMounted) {
          setOrderDetails(response.data?.data || response.data);
        }
      } catch (error) {
        console.error('Failed to load payment result order:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [isSuccess, isVNPayReturnRoute, orderId, searchParams]);

  const getPaymentMethodName = () => {
    if (isVNPay) return 'VNPay';
    if (isSePay) return 'SePay/VietQR';
    return 'Chuyển khoản ngân hàng';
  };

  const getSuccessMessage = () => {
    if (isSePay) {
      if (orderDetails?.status === 'processing') {
        return 'Thanh toán của bạn đã được ghi nhận thành công! Tài liệu đang chờ Admin kích hoạt (thường trong vòng 24h).';
      }
      return 'Thanh toán đã được xác nhận. Bạn có thể tải tài liệu ngay bên dưới.';
    }
    if (isVNPay) return 'Thanh toán qua cổng VNPay đã được xác nhận thành công.';
    return 'Cảm ơn bạn đã thanh toán. Mã xác nhận đã được gửi đến email của bạn.';
  };

  const formatPrice = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} VNĐ`;

  const purchasedDocuments = (orderDetails?.documents || []).filter((item) => item?.document);

  const handleDownload = async (item) => {
    const documentId = item.document?._id;
    if (!orderDetails?._id || !documentId) {
      return;
    }

    try {
      setDownloadingId(documentId);
      await downloadOrderDocument(orderDetails._id, documentId);
    } catch (error) {
      console.error('Download failed from payment result:', error);
      window.alert('Không thể tải tài liệu. Vui lòng thử lại.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl p-8 border ${isSuccess ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {isSuccess ? (
                <CheckCircle className="w-16 h-16 text-green-400" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400" />
              )}
            </div>

            <h1 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>

            {(isVNPay || isSePay) && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isVNPay ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {isVNPay ? 'V' : 'S'}
                </span>
                <span className="text-white/80 text-sm font-medium">{getPaymentMethodName()}</span>
              </div>
            )}

            <p className="text-white/70 max-w-xl mx-auto">
              {isSuccess ? getSuccessMessage() : 'Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại.'}
            </p>
          </div>

          {orderId && isSuccess && (
            <div className="bg-white/10 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Mã đơn hàng</span>
                <span className="font-mono font-semibold text-white">{orderId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Số tiền</span>
                <span className="font-bold text-green-400">{formatPrice(orderDetails?.totalAmount || amount)}</span>
              </div>
            </div>
          )}

          {isSuccess && purchasedDocuments.length > 0 && orderDetails?.status === 'completed' && (
            <div className="bg-white/10 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Tài liệu đã mở sau thanh toán</h2>
              </div>

              <div className="space-y-3">
                {purchasedDocuments.map((item) => {
                  const doc = item.document;
                  const isDownloading = downloadingId === doc?._id;

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/10 rounded-2xl p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{doc?.title || 'Tài liệu'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/60">
                          {doc?.subjectCode && <span>{doc.subjectCode}</span>}
                          {doc?.fileType && <span className="uppercase">• {doc.fileType}</span>}
                          {doc?.pageCount > 0 && <span>• {doc.pageCount} trang</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownload(item)}
                        disabled={isDownloading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isDownloading ? 'Đang tải...' : 'Tải ngay'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {errorCode && !isSuccess && (
            <div className="bg-red-500/20 rounded-2xl p-4 mb-6">
              <p className="text-red-400 text-sm mb-1">Mã lỗi</p>
              <p className="font-mono font-semibold text-white">{errorCode}</p>
              <p className="text-red-300/60 text-xs mt-2">
                Vui lòng liên hệ support nếu cần hỗ trợ
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/transactions')}
              className={`block w-full py-3 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              <User className="w-5 h-5" />
              Xem lịch sử giao dịch
            </button>

            {isSuccess && orderDetails?.status === 'completed' && (
              <button
                onClick={() => navigate('/my-documents')}
                className="block w-full py-3 px-6 rounded-2xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Vào thư viện tài liệu
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="block w-full py-3 px-6 rounded-2xl font-medium border border-white/20 text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Nếu bạn không nhận được email xác nhận trong 5 phút, vui lòng kiểm tra hộp thư spam
        </p>
      </div>
    </div>
  );
}
