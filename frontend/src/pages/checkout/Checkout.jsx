import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Loader2,
  ArrowLeft,
  FileText,
  AlertCircle,
  Mail,
  QrCode,
  Copy,
  Sparkles,
  Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { orderService, documentService, mentorService, rewardService } from '../../services/api';

export default function Checkout() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [sepayPaymentData, setSepayPaymentData] = useState(null);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [pointsQuote, setPointsQuote] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const selectedPaymentMethod = 'sepay';

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollTimeout, setPollTimeout] = useState(false);
  const pollingRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 60;

  useEffect(() => {
    fetchItemDetails();
    fetchRewardBalance();
  }, [type, id]);

  const fetchRewardBalance = async () => {
    try {
      const response = await rewardService.getBalance();
      setRewardInfo(response.data?.data || response.data);
    } catch {
      setRewardInfo(null);
    }
  };

  const handleSePaySuccess = () => {
    setPaymentConfirmed(true);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const params = new URLSearchParams({
      status: 'success',
      method: 'sepay',
      orderId: orderDetails?._id || '',
      amount: `${orderDetails?.totalAmount || itemDetails?.price || 0}`,
    });

    toast.success('Thanh toán thành công! Vui lòng chờ admin kích hoạt.');
    navigate(`/payment/result?${params.toString()}`, { replace: true });
  };

  useEffect(() => {
    if (
      !orderCreated ||
      !orderDetails ||
      paymentConfirmed ||
      pollTimeout ||
      selectedPaymentMethod !== 'sepay' ||
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
  }, [orderCreated, orderDetails, paymentConfirmed, pollTimeout, selectedPaymentMethod, sepayPaymentData]);

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

  const createOrder = async (paymentMethod = selectedPaymentMethod) => {
    if (!itemDetails) return null;
    if (orderDetails?._id) return orderDetails;

    const response = await orderService.create({
      documents: [{ documentId: itemDetails.id }],
      paymentMethod,
    });
    const order = response.data?.data || response.data;
    setOrderDetails(order);
    return order;
  };

  const handleCreateOrder = async () => {
    if (!itemDetails) return;
    setPaymentLoading(true);
    try {
      const order = await createOrder(selectedPaymentMethod);

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
        toast.success('Đã tạo mã QR. Vui lòng quét để chuyển khoản.');
      } else {
        toast.error(payData.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo yêu cầu thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRedeemWithPoints = async () => {
    if (!itemDetails) return;
    setRedeemLoading(true);
    try {
      const order = await createOrder('points');
      const quoteResponse = await rewardService.getPointsRequired(order._id);
      const quote = quoteResponse.data?.data || quoteResponse.data;
      setPointsQuote(quote);

      if (!quote?.canFullyRedeem) {
        toast.error(`Ban can ${formatPoints(quote?.maxPointsAllowed || 0)} diem de doi tai lieu nay.`);
        return;
      }

      const redeemResponse = await rewardService.redeem({
        orderId: order._id,
        pointsToUse: quote.maxPointsAllowed,
      });
      const redeemed = redeemResponse.data?.data || redeemResponse.data;

      toast.success(redeemed?.message || 'Doi diem thanh cong! Tai lieu da duoc them vao thu vien.');
      navigate(`/payment/result?${new URLSearchParams({
        status: 'success',
        method: 'points',
        orderId: order._id,
        amount: '0',
      }).toString()}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the doi diem cho tai lieu nay');
    } finally {
      setRedeemLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy sản phẩm</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary-400/70 text-white rounded-xl">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
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
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Thông tin sản phẩm</h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 glass-subtle rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
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

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
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

            {!orderCreated && (
              <div className="glass-card rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRedeemWithPoints}
                    disabled={redeemLoading || paymentLoading}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-2xl border-amber-300 bg-amber-50/70 dark:bg-amber-400/10 text-left disabled:opacity-50 hover:border-amber-400 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      {redeemLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Coins className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Doi diem mua tai lieu</p>
                      <p className="text-sm text-gray-500">
                        Hien co {formatPoints(rewardInfo?.currentBalance || 0)} diem
                        {pointsQuote?.maxPointsAllowed ? ` - Can ${formatPoints(pointsQuote.maxPointsAllowed)} diem` : ''}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-4 p-4 border-2 rounded-2xl border-primary-500 bg-primary-200/25 dark:bg-primary-400/10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Chuyển khoản (SePay/VietQR)</p>
                      <p className="text-sm text-gray-500">Quét mã QR · Tự động xác nhận</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>
            )}

            {orderCreated && sepayPaymentData && selectedPaymentMethod === 'sepay' && (
              <div className="glass-card rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quét mã QR để thanh toán</h2>

                {pollTimeout ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5 text-sm text-red-700 dark:text-red-300">
                    Hệ thống chưa nhận được xác nhận tự động sau nhiều lần kiểm tra. Nếu bạn đã chuyển khoản thành công, hãy kiểm tra lại webhook SePay rồi tải lại trang.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang chờ xác nhận thanh toán... ({pollingCount > 0 ? `đã kiểm tra ${pollingCount} lần` : 'đang kiểm tra'})</span>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-5 text-sm text-yellow-700 dark:text-yellow-300">
                      Sau khi chuyển khoản thành công, trang sẽ tự động chuyển sang màn hình xác nhận. Không cần làm gì thêm.
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-300">
                      {sepayPaymentData.qrUrl ? (
                        <img src={sepayPaymentData.qrUrl} alt="Mã QR thanh toán" className="w-52 h-52 object-contain" />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center glass-subtle rounded-ios">
                          <QrCode className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Quét bằng app ngân hàng bất kỳ</p>
                  </div>

                  <div className="glass-subtle rounded-2xl p-4 space-y-3">
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

          </div>

          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tóm tắt đơn hàng</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tài liệu</span><span>1</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí dịch vụ</span><span>0đ</span>
                </div>
              </div>

              <div className="border-t glass-divider border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(itemDetails.price)}</span>
                </div>
              </div>

              {!orderCreated ? (
                <button
                  onClick={handleCreateOrder}
                  disabled={paymentLoading}
                  className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 bg-primary-400/70 text-white hover:bg-primary-500/75"
                >
                  {paymentLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Đang xử lý...</>
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

              <div className="mt-6 pt-4 border-t glass-divider border flex items-start gap-3">
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
