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
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
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
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
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
    const result = response.data.data;
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
    }
    return result;
  },

  resendVerification: async (email) => {
    const normalizedEmail = typeof email === 'string' ? email : email?.email;
    const response = await api.post('/auth/resend-verification', { email: normalizedEmail });
    return response.data.data;
  },
};
