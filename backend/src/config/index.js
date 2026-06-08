import 'dotenv/config';

const normalizeOrigin = (origin) => {
  if (!origin) return null;

  const trimmedOrigin = origin.trim().replace(/\/+$/, '');
  if (!trimmedOrigin) return null;
  if (/^https?:\/\//i.test(trimmedOrigin)) return trimmedOrigin;

  return `https://${trimmedOrigin}`;
};

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/+$/, '');
  if (clientUrls.includes(normalizedOrigin)) return true;
  if (normalizedOrigin === 'http://localhost:5173' || normalizedOrigin === 'http://127.0.0.1:5173') return true;

  try {
    const { protocol, hostname } = new URL(normalizedOrigin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  clientUrl: clientUrls[0] || 'http://localhost:5173',
  clientUrls,
  isAllowedOrigin,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  },
};
