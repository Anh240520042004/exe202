import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  Loader2,
  QrCode,
  Copy,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/api';

const PLANS = [
  {
    id: '7_days',
    label: '7 Ngày',
    days: 7,
    price: 19000,
    icon: Zap,
    color: 'from-blue-400 to-cyan-500',
    border: 'border-blue-300 dark:border-blue-600',
    bg: 'bg-blue-50/70 dark:bg-blue-900/20',
    highlight: false,
    description: 'Dùng thử nhanh',
    features: ['Ưu tiên hiển thị 7 ngày', 'Xuất hiện trong Top Mentor', 'Tăng độ hiển thị profile'],
  },
  {
    id: '30_days',
    label: '30 Ngày',
    days: 30,
    price: 49000,
    icon: Star,
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-400 dark:border-violet-500',
    bg: 'bg-violet-50/70 dark:bg-violet-900/20',
    highlight: true,
    badge: 'Phổ biến nhất',
    description: 'Lựa chọn tốt nhất',
    features: ['Ưu tiên hiển thị 30 ngày', 'Vị trí cao trong Top Mentor', 'Badge nổi bật trên profile', 'Tăng tương tác x3'],
  },
  {
    id: 'yearly',
    label: '1 Năm',
    days: 365,
    price: 299000,
    icon: Crown,
    color: 'from-amber-400 to-orange-500',
    border: 'border-amber-400 dark:border-amber-600',
    bg: 'bg-amber-50/70 dark:bg-amber-900/20',
    highlight: false,
    badge: 'Tiết kiệm nhất',
    description: 'Đầu tư dài hạn',
    features: ['Ưu tiên hiển thị 12 tháng', 'Vị trí đặc biệt trong Top Mentor', 'Badge Mentor Premium', 'Hỗ trợ ưu tiên từ admin'],
  },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';

const MAX_POLL_ATTEMPTS = 60;

export default function MentorPromotionModal({ isOpen, onClose, mentorName }) {
  const [step, setStep] = useState('select'); // 'select' | 'qr' | 'success'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollTimeout, setPollTimeout] = useState(false);
  const pollingRef = useRef(null);
  const pollingAttemptsRef = useRef(0);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setStep('select');
      setSelectedPlan(null);
      setPaymentData(null);
      setPollingCount(0);
      setPollTimeout(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (step !== 'qr' || !paymentData?.transactionId) {
      stopPolling();
      return;
    }

    pollingAttemptsRef.current = 0;
    setPollingCount(0);
    setPollTimeout(false);

    const checkPayment = async () => {
      if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPollTimeout(true);
        stopPolling();
        return;
      }

      try {
        const res = await paymentService.checkStatus(paymentData.transactionId);
        const data = res.data?.data;
        const isPaid = res.data?.success &&
          (data?.paymentStatus === 'paid' || data?.status === 'completed');

        if (isPaid) {
          stopPolling();
          setStep('success');
          toast.success('🎉 Thanh toán gói đề xuất thành công!');
          return;
        }
      } catch {
        // silent
      }

      pollingAttemptsRef.current += 1;
      setPollingCount(pollingAttemptsRef.current);
      if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPollTimeout(true);
        stopPolling();
      }
    };

    checkPayment();
    pollingRef.current = setInterval(checkPayment, 3000);

    return () => stopPolling();
  }, [step, paymentData]);

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    setLoading(true);
    try {
      const res = await paymentService.createMentorPromotion(plan.id);
      const data = res.data?.data;
      setPaymentData(data);
      setStep('qr');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo yêu cầu thanh toán');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {step === 'select' && 'Gói đề xuất Mentor'}
              {step === 'qr' && 'Quét mã QR thanh toán'}
              {step === 'success' && 'Thanh toán thành công!'}
            </h2>
            {step === 'select' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Chọn gói để tăng hiển thị trong Top Mentor
              </p>
            )}
            {step === 'qr' && selectedPlan && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedPlan.label} — {formatPrice(selectedPlan.price)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1: Plan Selection */}
          {step === 'select' && (
            <div className="space-y-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loading}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${plan.border} ${plan.bg} ${plan.highlight ? 'ring-2 ring-violet-400/30 dark:ring-violet-500/30' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {loading && selectedPlan?.id === plan.id ? (
                          <Loader2 className="w-7 h-7 text-white animate-spin" />
                        ) : (
                          <Icon className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">{plan.label}</span>
                          {plan.badge && (
                            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-full">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                        <ul className="mt-2 space-y-0.5">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(plan.price)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-primary-600 dark:text-primary-400">
                          <span className="text-sm font-medium">Chọn</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2">
                Sau khi thanh toán, vị trí đề xuất sẽ được admin thiết lập. Ưu tiên hiển thị có hiệu lực ngay.
              </p>
            </div>
          )}

          {/* STEP 2: QR Payment */}
          {step === 'qr' && paymentData && (
            <div className="space-y-5">
              {/* Status bar */}
              {pollTimeout ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                  <strong>Hệ thống chưa nhận xác nhận tự động.</strong> Nếu bạn đã chuyển khoản thành công, hãy tải lại trang sau vài phút. Hệ thống sẽ tự cập nhật.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>
                    Đang chờ xác nhận thanh toán...
                    {pollingCount > 0 && ` (đã kiểm tra ${pollingCount} lần)`}
                  </span>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-yellow-800 dark:text-yellow-300">
                Sau khi chuyển khoản thành công, trang sẽ tự động cập nhật. Không cần làm gì thêm.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {paymentData.qrUrl ? (
                      <img
                        src={paymentData.qrUrl}
                        alt="Mã QR thanh toán"
                        className="w-52 h-52 object-contain"
                      />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Quét bằng app ngân hàng bất kỳ</p>
                </div>

                {/* Transfer Info */}
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Thông tin chuyển khoản</h3>
                  {[
                    { label: 'Ngân hàng', value: paymentData.bankInfo?.bankName || 'BIDV' },
                    { label: 'Số tài khoản', value: paymentData.bankInfo?.accountNumber, copy: true },
                    { label: 'Chủ tài khoản', value: paymentData.bankInfo?.accountName },
                    { label: 'Số tiền', value: formatPrice(selectedPlan?.price), highlight: true },
                    { label: 'Nội dung CK', value: paymentData.transactionId, copy: true, mono: true },
                  ].map(({ label, value, copy, highlight, mono }) => (
                    <div key={label} className="flex justify-between items-center gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`text-sm font-medium truncate ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'} ${mono ? 'font-mono text-xs' : ''}`}>
                          {value || '-'}
                        </span>
                        {copy && value && (
                          <button
                            onClick={() => copyToClipboard(value)}
                            className="p-1 flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setStep('select'); setSelectedPlan(null); setPaymentData(null); stopPolling(); }}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ← Chọn gói khác
              </button>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Thanh toán thành công! 🎉
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Bạn đã thanh toán thành công gói đề xuất <strong>{selectedPlan?.label}</strong>.
                Vị trí đề xuất đang chờ admin thiết lập. Ưu tiên hiển thị đã có hiệu lực!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                <span>Admin sẽ thiết lập vị trí sớm nhất</span>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
