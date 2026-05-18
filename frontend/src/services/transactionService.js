import api from './api';

export const transactionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    // Return full response for the component to handle
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
