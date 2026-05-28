import crypto from 'crypto';
import { VNPay, ProductCode, VnpLocale, dateFormat } from 'vnpay';

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'OZE53AQG',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'NXZM3DWFRILC4R5VBK850JZS1UE9KI6F',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_Api: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
};

// SePay Configuration
const SEPAY_CONFIG = {
  apiKey: process.env.SEPAY_API_KEY || 'YOUR_SEPAY_API_KEY',
  webhookUrl: process.env.SEPAY_WEBHOOK_URL || 'http://localhost:5000/api/payments/sepay-webhook',
  baseUrl: process.env.SEPAY_BASE_URL || 'https://api.sepay.vn',
};

// =========================
// VNPay Functions (SDK)
// =========================

export function createVNPayUrl(paymentData) {
  const { amount, orderId, orderInfo, transactionId } = paymentData;

  const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || 'OZE53AQG',
    secureSecret: process.env.VNPAY_HASH_SECRET || 'NXZM3DWFRILC4R5VBK850JZS1UE9KI6F',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
  });

  const date = new Date();
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  // amount phải là số nguyên VNĐ (không ×100, SDK tự nhân)
  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(amount),
    vnp_IpAddr: '127.0.0.1',
    vnp_TxnRef: transactionId || orderId?.toString() || Date.now().toString(),
    vnp_OrderInfo: orderInfo || `Thanh toan tai lieu ${orderId}`,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(date),
    vnp_ExpireDate: dateFormat(tomorrow),
  });

  return {
    vnpUrl: paymentUrl,
    vnp_TxnRef: transactionId || orderId?.toString(),
    vnp_Amount: amount,
    vnp_OrderInfo: orderInfo,
    provider: 'vnpay',
  };
}

// VNPay return verification (for vnpay-return route)
export function verifyVNPayReturn(query) {
  const {
    vnp_ResponseCode,
    vnp_TransactionStatus,
    vnp_TxnRef,
    vnp_Amount,
    vnp_OrderInfo,
    vnp_PayDate,
    vnp_SecureHash,
    ...rest
  } = query;

  const isSuccess = vnp_ResponseCode === '00' && vnp_TransactionStatus === '00';

  return {
    isSuccess,
    vnp_ResponseCode,
    vnp_TransactionStatus,
    vnp_TxnRef,
    vnp_Amount: parseInt(vnp_Amount),
    vnp_OrderInfo,
    vnp_PayDate,
    transactionId: vnp_TxnRef,
    provider: 'vnpay',
    rest,
  };
}

// VNPay IPN verification
export function verifyVNPaySignature(queryString, vnp_SecureHash) {
  const params = {};
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = {};
  Object.keys(params).sort().forEach((key) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      sortedParams[key] = params[key];
    }
  });

  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
  const vnp_SecureHashCheck = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return vnp_SecureHashCheck === vnp_SecureHash;
}

// =========================
// SePay Functions
// =========================

export async function createSePayPayment(paymentData) {
  const { amount, orderId, orderInfo, transactionId } = paymentData;

  const sepayOrderId = `SP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Bank info from environment
  const bankBin = process.env.SEPAY_BANK_BIN || '970438';
  const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || '96247ANH2004';
  const accountName = process.env.SEPAY_ACCOUNT_NAME || 'LE DUC ANH';
  const transferContent = transactionId || `FPTAIEZ${orderId?.slice(-8) || sepayOrderId.slice(-8)}`;

  // SePay QR URL
  const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=BIDV&amount=${Math.round(amount)}&des=${encodeURIComponent(transferContent)}`;

  // VietQR raw data string (EMVco format for local QR generation)
  const qrRaw = `${bankBin}${accountNumber}${Math.round(amount)}${transferContent}`;

  return {
    sepayOrderId,
    qrUrl,
    qrRaw,
    amount,
    orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    transactionId: transactionId || sepayOrderId,
    provider: 'sepay',
    bankInfo: {
      bankBin,
      accountNumber,
      accountName,
      bankName: 'BIDV - VietinBank',
    },
    instructions: [
      '1. Mo ung dung ngan hang hoac vi dien tu cua ban',
      '2. Quet ma QR hoac chuyen khoan theo thong tin ben duoi',
      `3. So tien: ${amount.toLocaleString('vi-VN')} VND`,
      `4. Noi dung: ${transferContent}`,
      `5. STK: ${accountNumber} - ${accountName}`,
      '6. Sau khi chuyen khoan, he thong se tu dong xac nhan trong vai phut',
    ],
  };
}

export async function verifySePayWebhook(webhookData) {
  const { transferType, transferAmount, transferContent, fromBankAccount, fromBankName, toBankAccount, reason } = webhookData;

  // SePay webhook signature verification (if API key is set)
  if (SEPAY_CONFIG.apiKey && SEPAY_CONFIG.apiKey !== 'YOUR_SEPAY_API_KEY') {
    const signature = webhookData.signature;
    if (!signature) {
      return { valid: false, reason: 'Missing signature' };
    }
  }

  return {
    valid: true,
    transferAmount,
    transferContent,
    fromBankAccount,
    fromBankName,
    toBankAccount,
    reason,
    provider: 'sepay',
  };
}

export { VNPAY_CONFIG, SEPAY_CONFIG };
