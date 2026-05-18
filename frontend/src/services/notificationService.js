import api from './api';

export const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return response.data.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data.data;
  },
};
