import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    const result = response.data.data;
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
    }
    return result;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const result = response.data.data;
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
    }
    return result;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data.data;
  },

  verifyEmail: async (data) => {
    const response = await api.post('/auth/verify-email', data);
    return response.data.data;
  },

  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data.data;
  },
};
