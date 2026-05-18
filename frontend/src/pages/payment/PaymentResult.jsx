import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home, User, ArrowRight } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('code');

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center ${isSuccess ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
          {/* Icon */}
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
            {isSuccess ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-bold mb-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isSuccess 
              ? 'Cảm ơn bạn đã thanh toán. Mã xác nhận đã được gửi đến email của bạn.'
              : 'Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại.'
            }
          </p>

          {/* Order ID */}
          {orderId && isSuccess && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Mã đơn hàng</p>
              <p className="font-mono font-semibold text-lg">{orderId.slice(-8).toUpperCase()}</p>
            </div>
          )}

          {/* Error Code */}
          {errorCode && !isSuccess && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-500 mb-1">Mã lỗi</p>
              <p className="font-mono font-semibold">{errorCode}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/profile"
              className={`block w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isSuccess 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <User className="w-5 h-5" />
              Xem lịch sử giao dịch
            </Link>

            <Link
              to="/dashboard"
              className="block w-full py-3 px-6 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Nếu bạn không nhận được email xác nhận trong 5 phút, vui lòng kiểm tra hộp thư spam 
          hoặc liên hệ support@fptaiez.com
        </p>
      </div>
    </div>
  );
}
