import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  FileText,
  User,
  AlertCircle,
  Mail,
  QrCode,
  Clock,
  Copy,
  ArrowRight,
  Coins,
  Gift,
  Sparkles,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { orderService, documentService, mentorService, rewardService } from '../../services/api';

export default function Checkout() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [sepayPaymentData, setSepayPaymentData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('sepay');

  // Reward points state
  const [pointBalance, setPointBalance] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(null);
  const [redeemingWithPoints, setRedeemingWithPoints] = useState(false);
  const [showPointsSuccess, setShowPointsSuccess] = useState(false);

  // Payment confirmation state
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollTimeout, setPollTimeout] = useState(false);
  const pollingRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 60;

  useEffect(() => {
    fetchItemDetails();
  }, [type, id]);

  useEffect(() => {
    if (itemDetails && user) fetchPointBalance();
  }, [itemDetails, user]);

  useEffect(() => {
    if (selectedPaymentMethod === 'points' && orderDetails) {
      fetchPointsRequired(orderDetails._id);
    }
  }, [selectedPaymentMethod, orderDetails]);

  const handleSePaySuccess = () => {
    setPaymentConfirmed(true);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    toast.success('🎉 Thanh toán thành công! Tài liệu đã được thêm vào thư viện.');
  };

  // ─── Polling kiểm tra thanh toán ────────────────────────────────────────────
  useEffect(() => {
    if (
      !orderCreated ||
      !orderDetails ||
      paymentConfirmed ||
      pollTimeout ||
      selectedPaymentMethod !== 'sepay' ||
      showPointsSuccess ||
      !sepayPaymentData?.transactionId
    ) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingAttemptsRef.current = 0;
    setPollingCount(0);
    setPollTimeout(false);

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const registerAttempt = () => {
      pollingAttemptsRef.current += 1;
      setPollingCount(pollingAttemptsRef.current);

      if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPollTimeout(true);
        stopPolling();
      }
    };

    const checkPaymentStatus = async () => {
      if (pollingAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setPollTimeout(true);
        stopPolling();
        return;
      }

      let paymentSettled = false;

      try {
        const txCode = sepayPaymentData.transactionId;
        const response = await api.get(`/payments/check/${txCode}`);
        const payload = response.data?.data;

        const isPaid = response.data?.success &&
          (payload?.paymentStatus === 'paid' || payload?.status === 'completed');

        if (isPaid) {
          paymentSettled = true;
          handleSePaySuccess();
          return;
        }

        const orderRes = await orderService.getById(orderDetails._id);
        const order = orderRes.data?.data || orderRes.data;
        if (order?.paymentStatus === 'paid' || order?.status === 'completed') {
          paymentSettled = true;
          handleSePaySuccess();
          return;
        }
      } catch (error) {
        // Silently ignore network or auth issues while polling
      }

      if (!paymentSettled) {
        registerAttempt();
      }
    };

    checkPaymentStatus();
    pollingRef.current = setInterval(checkPaymentStatus, 3000);

    return () => {
      stopPolling();
    };
  }, [orderCreated, orderDetails, paymentConfirmed, pollTimeout, selectedPaymentMethod, showPointsSuccess, sepayPaymentData]);

  const fetchPointBalance = async () => {
    try {
      const response = await rewardService.getBalance();
      const data = response.data?.data || response.data;
      setPointBalance(data?.currentBalance || 0);
    } catch {
      setPointBalance(0);
    }
  };

  const fetchPointsRequired = async (orderId) => {
    if (!orderId) return;
    try {
      const response = await rewardService.getPointsRequired(orderId);
      const data = response.data?.data || response.data;
      setPointsRequired(data);
    } catch {
      setPointsRequired(null);
    }
  };

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      if (type === 'document') {
        const response = await documentService.getById(id);
        const doc = response.data?.data || response.data;
        setItemDetails({
          type: 'document',
          id: doc._id,
          title: doc.title,
          price: doc.price,
          previewImage: doc.previewImages?.[0],
          description: doc.description,
          documentType: doc.documentType,
          pageCount: doc.pageCount,
        });
      } else if (type === 'mentor') {
        const response = await mentorService.getById(id);
        const mentor = response.data?.data || response.data;
        setItemDetails({
          type: 'mentor',
          id: mentor._id,
          title: `Mentor: ${mentor.name}`,
          price: mentor.mentorProfile?.pricePerHour || 0,
          previewImage: mentor.avatar,
          description: mentor.mentorProfile?.bio,
        });
      }
    } catch {
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!itemDetails) return;
    setPaymentLoading(true);
    try {
      // Tạo order
      const response = await orderService.create({
        documents: [{ documentId: itemDetails.id }],
        paymentMethod: selectedPaymentMethod,
      });
      const order = response.data?.data || response.data;
      setOrderDetails(order);

      // Đổi điểm
      if (selectedPaymentMethod === 'points') {
        setRedeemingWithPoints(true);
        const pointsToUse = pointsRequired?.canFullyRedeem
          ? pointsRequired.pointsNeeded
          : Math.min(pointBalance, pointsRequired?.maxPointsAllowed || 0);

        const redeemResponse = await rewardService.redeem({ orderId: order._id, pointsToUse });
        if (redeemResponse.data?.success) {
          setShowPointsSuccess(true);
          setOrderCreated(true);
          toast.success('Đổi điểm thành công! Tài liệu đã được thêm vào thư viện.');
        } else {
          toast.error('Không thể đổi điểm. Vui lòng thử lại.');
          setRedeemingWithPoints(false);
        }
        setPaymentLoading(false);
        return;
      }

      setOrderCreated(true);
      setPollTimeout(false);
      pollingAttemptsRef.current = 0;
      setPollingCount(0);

      const paymentResponse = await api.post('/payments/create', {
        orderId: order._id,
        paymentMethod: selectedPaymentMethod,
      });

      const payData = paymentResponse.data;

      if (payData.success) {
        setSepayPaymentData(payData.data);
        if (selectedPaymentMethod === 'vnpay') {
          window.location.href = payData.data.paymentUrl;
        } else {
          toast.success('Đã tạo mã QR. Vui lòng quét để chuyển khoản.');
        }
      } else {
        toast.error(payData.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo yêu cầu thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';

  const formatPoints = (points) =>
    new Intl.NumberFormat('vi-VN').format(points);

  const estimatedPointsEarned = Math.floor((itemDetails?.price || 0) * 0.01);

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ─── Payment confirmed screen ─────────────────────────────────────────────────
  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            Tài liệu đã được thêm vào thư viện của bạn.
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Email xác nhận đã được gửi đến hộp thư của bạn.
          </p>

          {/* Order info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Tài liệu</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{itemDetails.title}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Số tiền</span>
              <span className="text-sm font-bold text-green-600">{formatPrice(orderDetails?.totalAmount || itemDetails.price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Mã đơn</span>
              <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                {orderDetails?._id?.slice(-8).toUpperCase()}
              </code>
            </div>
          </div>

          {/* Points earned */}
          {estimatedPointsEarned > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Bạn vừa nhận được <strong>{formatPoints(estimatedPointsEarned)} điểm</strong> thưởng!
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/library')}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Tải tài liệu ngay
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Points success screen ────────────────────────────────────────────────────
  if (showPointsSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Gift className="w-14 h-14 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Đổi điểm thành công!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Bạn đã dùng <strong className="text-amber-600">{formatPoints(pointsRequired?.pointsNeeded || 0)} điểm</strong> để nhận tài liệu miễn phí.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/library')}
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Tải tài liệu ngay
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main checkout UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Thông tin sản phẩm</h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {itemDetails.previewImage ? (
                    <img src={itemDetails.previewImage} alt={itemDetails.title} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{itemDetails.title}</h3>
                    {itemDetails.documentType && (
                      <p className="text-sm text-gray-500 mt-1">
                        {itemDetails.documentType === 'pdf' ? 'PDF' : itemDetails.documentType}
                        {itemDetails.pageCount > 0 && ` · ${itemDetails.pageCount} trang`}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(itemDetails.price)}</span>
                </div>
              </div>
            </div>

            {/* Points earned info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                  Mua tài liệu này nhận ngay <strong>{formatPoints(estimatedPointsEarned)} điểm</strong> thưởng
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  1 VNĐ = 0.01 điểm · Dùng điểm đổi tài liệu miễn phí
                </p>
              </div>
            </div>

            {/* Payment method selection */}
            {!orderCreated && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {/* Points */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'points' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="paymentMethod" value="points" checked={selectedPaymentMethod === 'points'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="sr-only" />
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Đổi điểm thưởng</p>
                      <p className="text-sm text-gray-500">Bạn có {formatPoints(pointBalance)} điểm</p>
                    </div>
                    {selectedPaymentMethod === 'points' && <CheckCircle className="w-6 h-6 text-amber-600" />}
                  </label>

                  {/* SePay */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'sepay' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="paymentMethod" value="sepay" checked={selectedPaymentMethod === 'sepay'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="sr-only" />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Chuyển khoản (SePay/VietQR)</p>
                      <p className="text-sm text-gray-500">Quét mã QR · Tự động xác nhận</p>
                    </div>
                    {selectedPaymentMethod === 'sepay' && <CheckCircle className="w-6 h-6 text-primary-600" />}
                  </label>

                  {/* VNPay */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPaymentMethod === 'vnpay' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="paymentMethod" value="vnpay" checked={selectedPaymentMethod === 'vnpay'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="sr-only" />
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">V</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Thanh toán VNPay</p>
                      <p className="text-sm text-gray-500">Cổng thanh toán VNPay</p>
                    </div>
                    {selectedPaymentMethod === 'vnpay' && <CheckCircle className="w-6 h-6 text-primary-600" />}
                  </label>
                </div>
              </div>
            )}

            {/* QR Payment UI */}
            {orderCreated && sepayPaymentData && selectedPaymentMethod === 'sepay' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quét mã QR để thanh toán</h2>

                {pollTimeout ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-5 text-sm text-red-700 dark:text-red-300">
                    Hệ thống chưa nhận được xác nhận tự động sau nhiều lần kiểm tra. Nếu bạn đã chuyển khoản thành công, hãy kiểm tra lại webhook SePay rồi tải lại trang.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang chờ xác nhận thanh toán... ({pollingCount > 0 ? `đã kiểm tra ${pollingCount} lần` : 'đang kiểm tra'})</span>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-5 text-sm text-yellow-700 dark:text-yellow-300">
                      Sau khi chuyển khoản thành công, trang sẽ tự động chuyển sang màn hình xác nhận. Không cần làm gì thêm.
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-xl border-2 border-dashed border-gray-300">
                      {sepayPaymentData.qrUrl ? (
                        <img src={sepayPaymentData.qrUrl} alt="Mã QR thanh toán" className="w-52 h-52 object-contain" />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center bg-gray-50 rounded-lg">
                          <QrCode className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Quét bằng app ngân hàng bất kỳ</p>
                  </div>

                  {/* Bank info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Thông tin chuyển khoản</h3>
                    {[
                      { label: 'Ngân hàng', value: sepayPaymentData.bankInfo?.bankName || 'BIDV' },
                      { label: 'Số tài khoản', value: sepayPaymentData.bankInfo?.accountNumber, copy: true },
                      { label: 'Chủ tài khoản', value: sepayPaymentData.bankInfo?.accountName },
                      { label: 'Số tiền', value: formatPrice(orderDetails?.totalAmount), highlight: true },
                      { label: 'Nội dung CK', value: sepayPaymentData.transactionId, copy: true, mono: true },
                    ].map(({ label, value, copy, highlight, mono }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{label}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium ${highlight ? 'text-primary-600' : 'text-gray-900 dark:text-white'} ${mono ? 'font-mono' : ''}`}>
                            {value}
                          </span>
                          {copy && (
                            <button onClick={() => copyToClipboard(value)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VNPay redirect */}
            {orderCreated && selectedPaymentMethod === 'vnpay' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Đang chuyển hướng đến VNPay...</p>
              </div>
            )}
          </div>

          {/* Right column - Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tóm tắt đơn hàng</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tài liệu</span><span>1</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí dịch vụ</span><span>0đ</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(itemDetails.price)}</span>
                </div>
                {selectedPaymentMethod === 'points' && pointsRequired?.canFullyRedeem && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">Thanh toán</span>
                    <span className="text-lg font-bold text-amber-600">MIỄN PHÍ</span>
                  </div>
                )}
              </div>

              {!orderCreated ? (
                <button
                  onClick={handleCreateOrder}
                  disabled={paymentLoading || redeemingWithPoints || (selectedPaymentMethod === 'points' && !pointsRequired?.canFullyRedeem)}
                  className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                    selectedPaymentMethod === 'points'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {paymentLoading || redeemingWithPoints ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />{selectedPaymentMethod === 'points' ? 'Đang đổi điểm...' : 'Đang xử lý...'}</>
                  ) : selectedPaymentMethod === 'points' ? (
                    <><Coins className="w-5 h-5" />Đổi điểm ngay</>
                  ) : (
                    <><QrCode className="w-5 h-5" />Tạo mã QR thanh toán</>
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-600 text-sm mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang chờ thanh toán...
                  </div>
                  <p className="text-xs text-gray-400">Mã đơn: {orderDetails?._id?.slice(-8).toUpperCase()}</p>
                </div>
              )}

              {/* Points info */}
              {selectedPaymentMethod === 'points' && !orderCreated && pointsRequired && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Điểm của bạn: {formatPoints(pointBalance)}</span>
                  </div>
                  {pointsRequired.canFullyRedeem ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Đủ điểm! Cần {formatPoints(pointsRequired.pointsNeeded)} điểm
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">
                      Thiếu {formatPoints(Math.max(0, pointsRequired.maxPointsAllowed - pointBalance))} điểm
                    </p>
                  )}
                </div>
              )}

              {/* Email notice */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-500">Email xác nhận sẽ được gửi sau khi thanh toán thành công.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
