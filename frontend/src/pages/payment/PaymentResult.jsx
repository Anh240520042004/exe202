import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, User, ArrowRight } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('code');
  const method = searchParams.get('method');
  const amount = searchParams.get('amount');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  const isSuccess = status === 'success';
  const isVNPay = method === 'vnpay';
  const isSePay = method === 'sepay';

  const getPaymentMethodName = () => {
    if (isVNPay) return 'VNPay';
    if (isSePay) return 'SePay/VietQR';
    return 'Chuyển khoản ngân hàng';
  };

  const getSuccessMessage = () => {
    if (isVNPay) return 'Thanh toán qua cổng VNPay đã được xác nhận thành công.';
    if (isSePay) return 'Thanh toán qua SePay/VietQR đã được xác nhận thành công.';
    return 'Cảm ơn bạn đã thanh toán. Mã xác nhận đã được gửi đến email của bạn.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-accent-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className={`bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border ${isSuccess ? 'border-green-500/50' : 'border-red-500/50'}`}>
          {/* Icon */}
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isSuccess ? (
              <CheckCircle className="w-16 h-16 text-green-400" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400" />
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>

          {/* Payment Method Badge */}
          {(isVNPay || isSePay) && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isVNPay ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                {isVNPay ? 'V' : 'S'}
              </span>
              <span className="text-white/80 text-sm font-medium">{getPaymentMethodName()}</span>
            </div>
          )}

          {/* Message */}
          <p className="text-white/70 mb-6">
            {isSuccess ? getSuccessMessage() : 'Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại.'}
          </p>

          {/* Order ID & Amount */}
          {orderId && isSuccess && (
            <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Mã đơn hàng</span>
                <span className="font-mono font-semibold text-white">{orderId.slice(-8).toUpperCase()}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-white/60">Số tiền</span>
                  <span className="font-bold text-green-400">{parseInt(amount).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
            </div>
          )}

          {/* Error Code */}
          {errorCode && !isSuccess && (
            <div className="bg-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm mb-1">Mã lỗi</p>
              <p className="font-mono font-semibold text-white">{errorCode}</p>
              <p className="text-red-300/60 text-xs mt-2">
                Vui lòng liên hệ support nếu cần hỗ trợ
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/transactions')}
              className={`block w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                isSuccess 
                  ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25' 
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              <User className="w-5 h-5" />
              Xem lịch sử giao dịch
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="block w-full py-3 px-6 rounded-xl font-medium border border-white/20 text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-white/40 text-sm mt-6">
          Nếu bạn không nhận được email xác nhận trong 5 phút, vui lòng kiểm tra hộp thư spam 
        </p>
      </div>
    </div>
  );
}
