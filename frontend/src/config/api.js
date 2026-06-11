const DEPLOYED_API_ORIGIN = 'https://exe202-x7o6.onrender.com';

const resolveApiOrigin = () => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/api\/?$/, '').replace(/\/$/, '');

  return import.meta.env.PROD ? DEPLOYED_API_ORIGIN : 'http://localhost:5000';
};

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE = `${API_ORIGIN}/api`;
