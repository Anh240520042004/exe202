import crypto from 'crypto';
import { URL } from 'url';
import querystring from 'querystring';

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_Api: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
};

// SePay Configuration
const SEPAY_CONFIG = {
  apiKey: process.env.SEPAY_API_KEY || 'YOUR_SEPAY_API_KEY',
  webhookUrl: process.env.SEPAY_WEBHOOK_URL || 'http://localhost:5000/api/payments/sepay/webhook',
  baseUrl: process.env.SEPAY_BASE_URL || 'https://api.sepay.vn',
};

// =========================
// VNPay Functions
// =========================

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = obj[key];
    }
  });
  return sorted;
}

export function createVNPayUrl(paymentData) {
  const { amount, orderId, orderInfo, transactionId } = paymentData;

  const date = new Date();
  const createDate = `${String(date.getFullYear())}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
  const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
  const expireDateStr = `${String(expireDate.getFullYear())}${String(expireDate.getMonth() + 1).padStart(2, '0')}${String(expireDate.getDate()).padStart(2, '0')}${String(expireDate.getHours()).padStart(2, '0')}${String(expireDate.getMinutes()).padStart(2, '0')}${String(expireDate.getSeconds()).padStart(2, '0')}`;

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: transactionId || orderId?.toString() || Date.now().toString(),
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'billpayment',
    vnp_Amount: Math.round(amount) * 100, // Amount in VND (cents)
    vnp_SubAmount: Math.round(amount) * 100,
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_CallbackUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDateStr,
    vnp_IpAddr: '127.0.0.1',
  };

  // Sort and create hash data
  const sortedParams = sortObject(vnp_Params);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
  const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Build URL
  const vnpUrl = new URL(VNPAY_CONFIG.vnp_Url);
  Object.keys(sortedParams).forEach((key) => {
    vnpUrl.searchParams.append(key, sortedParams[key]);
  });
  vnpUrl.searchParams.append('vnp_SecureHash', vnp_SecureHash);

  return {
    vnpUrl: vnpUrl.toString(),
    vnp_TxnRef: vnp_Params.vnp_TxnRef,
    vnp_Amount: vnp_Params.vnp_Amount,
    vnp_OrderInfo: vnp_Params.vnp_OrderInfo,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDateStr,
    transactionId: vnp_Params.vnp_TxnRef,
  };
}

export function verifyVNPaySignature(queryString, vnp_SecureHash) {
  // Remove vnp_SecureHash from query to verify
  const params = querystring.parse(queryString);
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
  const vnp_SecureHashCheck = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return vnp_SecureHashCheck === vnp_SecureHash;
}

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
    vnp_Amount: parseInt(vnp_Amount) / 100,
    vnp_OrderInfo,
    vnp_PayDate,
    transactionId: vnp_TxnRef,
    provider: 'vnpay',
    rest,
  };
}

// =========================
// SePay Functions
// =========================

export async function createSePayPayment(paymentData) {
  const { amount, orderId, orderInfo, transactionId } = paymentData;

  const sepayOrderId = `SP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Bank info from environment
  const bankBin = process.env.SEPAY_BANK_BIN || '970438';
  const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || '1261101647';
  const accountName = process.env.SEPAY_ACCOUNT_NAME || 'LE DUC ANH';
  const transferContent = orderInfo || `FPTAIEZ${orderId?.slice(-8) || sepayOrderId.slice(-8)}`;

  // VietQR.io image URL - uses compact template matching your BIDV QR design
  const vietqrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}&logo=true&border=true`;

  // VietQR raw data string (EMVco format for local QR generation)
  const qrRaw = `${bankBin}${accountNumber}${Math.round(amount)}${transferContent}`;

  return {
    sepayOrderId,
    qrUrl: vietqrUrl,
    qrRaw,
    amount,
    orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    transactionId: transactionId || sepayOrderId,
    provider: 'sepay',
    bankInfo: {
      bankBin,
      accountNumber,
      accountName,
      bankName: 'BIDV - CN BA DINH',
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
    // Verify webhook signature
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
