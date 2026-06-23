import api from './api';

export const transactionService = {
  // Original: get user's own transactions (all categories)
  getAll: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  // Admin: get ALL transactions with user info
  getAllAdmin: async (params = {}) => {
    const response = await api.get('/transactions/admin/all', { params });
    return response.data;
  },

  // Admin: bulk delete transactions by IDs
  bulkDelete: async (ids) => {
    const response = await api.delete('/transactions/admin/bulk', { data: { ids } });
    return response.data;
  },

  // User/Mentor: get own payment history (purchases, donations, etc.)
  getMyPayments: async (params = {}) => {
    const response = await api.get('/transactions/my-payments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await api.post('/transactions', data);
    return response.data.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/transactions/stats', { params });
    return response.data.data || response.data || {};
  },
};
