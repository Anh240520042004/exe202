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
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { orderService, documentService, mentorService } from '../../services/api';

export default function Checkout() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [sepayPaymentData, setSepayPaymentData] = useState(null);
  const selectedPaymentMethod = 'sepay';

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

    toast.success('Thanh toán thành công! Tài liệu đã được thêm vào thư viện.');
    navigate(`/payment/result?${params.toString()}`, { replace: true });
  };

  // â”€â”€â”€ Polling kiá»ƒm tra thanh toÃ¡n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      toast.error('KhÃ´ng thá»ƒ táº£i thÃ´ng tin sáº£n pháº©m');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!itemDetails) return;
    setPaymentLoading(true);
    try {
      // Táº¡o order
      const response = await orderService.create({
        documents: [{ documentId: itemDetails.id }],
        paymentMethod: selectedPaymentMethod,
      });
      const order = response.data?.data || response.data;
      setOrderDetails(order);


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
        toast.success('ÄÃ£ táº¡o mÃ£ QR. Vui lÃ²ng quÃ©t Ä‘á»ƒ chuyá»ƒn khoáº£n.');
      } else {
        toast.error(payData.message || 'CÃ³ lá»—i xáº£y ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'KhÃ´ng thá»ƒ táº¡o yÃªu cáº§u thanh toÃ¡n');
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('ÄÃ£ sao chÃ©p!');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN').format(price) + ' VNÄ';

  const formatPoints = (points) =>
    new Intl.NumberFormat('vi-VN').format(points);

  const estimatedPointsEarned = Math.floor((itemDetails?.price || 0) * 0.01);

  // â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Äang táº£i thÃ´ng tin...</p>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary-400/70 text-white rounded-xl">
            Quay láº¡i
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ Main checkout UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay láº¡i
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Thanh toÃ¡n</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product info */}
            <div className="glass-card rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ThÃ´ng tin sáº£n pháº©m</h2>
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
                        {itemDetails.pageCount > 0 && ` Â· ${itemDetails.pageCount} trang`}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(itemDetails.price)}</span>
                </div>
              </div>
            </div>

            {/* Points earned info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                  Mua tÃ i liá»‡u nÃ y nháº­n ngay <strong>{formatPoints(estimatedPointsEarned)} Ä‘iá»ƒm</strong> thÆ°á»Ÿng
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  1 VNÄ = 0.01 Ä‘iá»ƒm Â· DÃ¹ng Ä‘iá»ƒm Ä‘á»•i tÃ i liá»‡u miá»…n phÃ­
                </p>
              </div>
            </div>

            {/* Payment method selection */}
            {!orderCreated && (
              <div className="glass-card rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">PhÆ°Æ¡ng thá»©c thanh toÃ¡n</h2>
                <div className="space-y-3">
                  {/* SePay */}
                  <div className="flex items-center gap-4 p-4 border-2 rounded-2xl border-primary-500 bg-primary-200/25 dark:bg-primary-400/10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Chuyá»ƒn khoáº£n (SePay/VietQR)</p>
                      <p className="text-sm text-gray-500">QuÃ©t mÃ£ QR Â· Tá»± Ä‘á»™ng xÃ¡c nháº­n</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>
            )}

            {/* QR Payment UI */}
            {orderCreated && sepayPaymentData && selectedPaymentMethod === 'sepay' && (
              <div className="glass-card rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">QuÃ©t mÃ£ QR Ä‘á»ƒ thanh toÃ¡n</h2>

                {pollTimeout ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5 text-sm text-red-700 dark:text-red-300">
                    Há»‡ thá»‘ng chÆ°a nháº­n Ä‘Æ°á»£c xÃ¡c nháº­n tá»± Ä‘á»™ng sau nhiá»u láº§n kiá»ƒm tra. Náº¿u báº¡n Ä‘Ã£ chuyá»ƒn khoáº£n thÃ nh cÃ´ng, hÃ£y kiá»ƒm tra láº¡i webhook SePay rá»“i táº£i láº¡i trang.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Äang chá» xÃ¡c nháº­n thanh toÃ¡n... ({pollingCount > 0 ? `Ä‘Ã£ kiá»ƒm tra ${pollingCount} láº§n` : 'Ä‘ang kiá»ƒm tra'})</span>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-5 text-sm text-yellow-700 dark:text-yellow-300">
                      Sau khi chuyá»ƒn khoáº£n thÃ nh cÃ´ng, trang sáº½ tá»± Ä‘á»™ng chuyá»ƒn sang mÃ n hÃ¬nh xÃ¡c nháº­n. KhÃ´ng cáº§n lÃ m gÃ¬ thÃªm.
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-300">
                      {sepayPaymentData.qrUrl ? (
                        <img src={sepayPaymentData.qrUrl} alt="MÃ£ QR thanh toÃ¡n" className="w-52 h-52 object-contain" />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center glass-subtle rounded-ios">
                          <QrCode className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">QuÃ©t báº±ng app ngÃ¢n hÃ ng báº¥t ká»³</p>
                  </div>

                  {/* Bank info */}
                  <div className="glass-subtle rounded-2xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">ThÃ´ng tin chuyá»ƒn khoáº£n</h3>
                    {[
                      { label: 'NgÃ¢n hÃ ng', value: sepayPaymentData.bankInfo?.bankName || 'BIDV' },
                      { label: 'Sá»‘ tÃ i khoáº£n', value: sepayPaymentData.bankInfo?.accountNumber, copy: true },
                      { label: 'Chá»§ tÃ i khoáº£n', value: sepayPaymentData.bankInfo?.accountName },
                      { label: 'Sá»‘ tiá»n', value: formatPrice(orderDetails?.totalAmount), highlight: true },
                      { label: 'Ná»™i dung CK', value: sepayPaymentData.transactionId, copy: true, mono: true },
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

          {/* Right column - Order summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">TÃ³m táº¯t Ä‘Æ¡n hÃ ng</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>TÃ i liá»‡u</span><span>1</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>PhÃ­ dá»‹ch vá»¥</span><span>0Ä‘</span>
                </div>
              </div>

              <div className="border-t glass-divider border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">Tá»•ng cá»™ng</span>
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
                    <><Loader2 className="w-5 h-5 animate-spin" />Äang xá»­ lÃ½...</>
                  ) : (
                    <><QrCode className="w-5 h-5" />Táº¡o mÃ£ QR thanh toÃ¡n</>
                  )}
                </button>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-600 text-sm mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Äang chá» thanh toÃ¡n...
                  </div>
                  <p className="text-xs text-gray-400">MÃ£ Ä‘Æ¡n: {orderDetails?._id?.slice(-8).toUpperCase()}</p>
                </div>
              )}

              {/* Email notice */}
              <div className="mt-6 pt-4 border-t glass-divider border flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-500">Email xÃ¡c nháº­n sáº½ Ä‘Æ°á»£c gá»­i sau khi thanh toÃ¡n thÃ nh cÃ´ng.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
