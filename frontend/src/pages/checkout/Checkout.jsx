import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
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
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService, documentService, mentorService } from '../../services/api';

export default function Checkout() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [sepayPaymentData, setSepayPaymentData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('sepay');

  useEffect(() => {
    fetchItemDetails();
  }, [type, id]);

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
          pageCount: doc.pageCount
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
          expertise: mentor.mentorProfile?.expertise,
          mentorName: mentor.name
        });
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!itemDetails) return;

    setPaymentLoading(true);
    try {
      if (itemDetails.type === 'document') {
        // Create order first
        const response = await orderService.create({
          documents: [{ documentId: itemDetails.id }],
          paymentMethod: selectedPaymentMethod
        });
        const order = response.data?.data || response.data;
        setOrderDetails(order);
        setOrderCreated(true);

        // Create payment based on selected method
        const paymentResponse = await fetch(`http://localhost:5000/api/payments/create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: order._id,
            paymentMethod: selectedPaymentMethod
          })
        });

        const payData = await paymentResponse.json();

        if (payData.success) {
          setSepayPaymentData(payData.data);
          
          if (selectedPaymentMethod === 'vnpay') {
            // Redirect to VNPay gateway
            window.location.href = payData.data.paymentUrl;
          } else if (selectedPaymentMethod === 'sepay') {
            toast.success('Đã tạo yêu cầu thanh toán. Vui lòng quét mã QR để chuyển khoản.');
          }
        } else {
          toast.error(payData.message || 'Có lỗi xảy ra');
        }
      } else if (itemDetails.type === 'mentor') {
        toast.success('Tính năng đặt mentor đang được phát triển');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo yêu cầu thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  // QR will be loaded from backend sepay data

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
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Thanh toán
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Details & Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Thông tin sản phẩm
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {itemDetails.previewImage ? (
                    <img
                      src={itemDetails.previewImage}
                      alt={itemDetails.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {itemDetails.type === 'document' ? (
                        <FileText className="w-10 h-10 text-gray-400" />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {itemDetails.title}
                      </h3>
                      {itemDetails.type === 'document' && (
                        <p className="text-sm text-gray-500 mt-1">
                          {itemDetails.documentType === 'pdf' ? 'PDF' : 
                           itemDetails.documentType === 'slide' ? 'Slide' : 
                           itemDetails.documentType}
                          {itemDetails.pageCount > 0 && ` - ${itemDetails.pageCount} trang`}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(itemDetails.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!orderCreated ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  {/* SePay Option */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'sepay' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sepay"
                      checked={selectedPaymentMethod === 'sepay'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Chuyển khoản ngân hàng (SePay/VietQR)
                      </p>
                      <p className="text-sm text-gray-500">Quét mã QR, tự động xác nhận</p>
                    </div>
                    {selectedPaymentMethod === 'sepay' && (
                      <CheckCircle className="w-6 h-6 text-primary-600" />
                    )}
                  </label>

                  {/* VNPay Option */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'vnpay' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={selectedPaymentMethod === 'vnpay'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-white">V</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Thanh toán qua VNPay
                      </p>
                      <p className="text-sm text-gray-500">Thanh toán trực tiếp qua cổng VNPay</p>
                    </div>
                    {selectedPaymentMethod === 'vnpay' && (
                      <CheckCircle className="w-6 h-6 text-primary-600" />
                    )}
                  </label>
                </div>
              </div>
            ) : null}

            {/* VietQR Payment */}
            {orderCreated && sepayPaymentData && selectedPaymentMethod === 'sepay' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Quét mã QR để thanh toán
                </h2>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Thanh toán qua SePay/VietQR
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Quét mã QR bằng ứng dụng ngân hàng. Hệ thống sẽ tự động xác nhận sau khi bạn chuyển khoản.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300">
                      <img
                        src={sepayPaymentData.qrUrl}
                        alt="QR Code thanh toán BIDV"
                        className="w-56 h-56 object-contain"
                        onError={(e) => {
                          // Fallback: use VietQR.io generate API
                          e.target.src = `https://api.vietqr.io/v2/generate?accountNumber=${sepayPaymentData.bankInfo?.accountNumber}&accountName=${encodeURIComponent(sepayPaymentData.bankInfo?.accountName)}&amount=${orderDetails?.totalAmount}&add=${encodeURIComponent(sepayPaymentData.transactionId)}&bankCode=${sepayPaymentData.bankInfo?.bankBin}`;
                          e.target.onerror = () => {
                            // Final fallback: use qrserver.com with raw data
                            e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sepayPaymentData.qrRaw || '')}`;
                          };
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">Quét mã QR bằng ứng dụng ngân hàng (BIDV)</p>
                  </div>

                  {/* Bank Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Thông tin chuyển khoản
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Ngân hàng:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sepayPaymentData.bankInfo?.bankName || 'BIDV - CN BA DINH'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono">{sepayPaymentData.bankInfo?.accountNumber || '1261101647'}</span>
                          <button 
                            onClick={() => copyToClipboard(sepayPaymentData.bankInfo?.accountNumber || '1261101647')}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tên TK:</span>
                        <span className="font-medium">{sepayPaymentData.bankInfo?.accountName || 'LE DUC ANH'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-bold text-primary-600 text-lg">
                          {formatPrice(orderDetails?.totalAmount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Nội dung:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono">
                            {sepayPaymentData.transactionId || `FPTAIEZ${orderDetails?._id?.slice(-8) || Date.now()}`}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(sepayPaymentData.transactionId || `FPTAIEZ${orderDetails?._id?.slice(-8) || Date.now()}`)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {sepayPaymentData.instructions && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500">
                          <strong>Hướng dẫn:</strong>
                        </p>
                        <ul className="text-xs text-gray-500 mt-1 space-y-1">
                          {sepayPaymentData.instructions.slice(0, 4).map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Đơn hàng đang chờ xác nhận
                      </p>
                      <p className="text-sm text-gray-500">
                        Mã đơn: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{orderDetails?._id?.slice(-8).toUpperCase()}</code>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Hệ thống sẽ tự động xác nhận trong vài phút sau khi bạn chuyển khoản
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => navigate('/transactions')}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Xem lịch sử giao dịch
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Quay về trang chủ
                  </button>
                </div>
              </div>
            )}

            {/* VNPay Redirect Message */}
            {orderCreated && selectedPaymentMethod === 'vnpay' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-red-600">V</span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Đang chuyển hướng đến VNPay...
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Vui lòng chờ trong giây lát hoặc click nút bên dưới nếu không được chuyển hướng tự động.
                  </p>
                  <a
                    href={sepayPaymentData?.paymentUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    <span>Mở cổng thanh toán VNPay</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Tóm tắt đơn hàng
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tài liệu</span>
                  <span>1</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Phí dịch vụ</span>
                  <span>0đ</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    Tổng cộng
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(itemDetails.price)}
                  </span>
                </div>

                {!orderCreated ? (
                  <button
                    onClick={handleCreateOrder}
                    disabled={paymentLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        Tạo mã QR thanh toán
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600 text-sm">
                      <Clock className="w-5 h-5" />
                      Đang chờ xác nhận
                    </div>
                    <p className="text-xs text-gray-500">
                      Mã đơn: {orderDetails?._id?.slice(-8).toUpperCase() || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {/* Email Notification */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Thông báo qua email
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Bạn sẽ nhận được email khi thanh toán được xác nhận.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Thanh toán an toàn
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Giao dịch được xử lý qua cổng thanh toán VietQR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
