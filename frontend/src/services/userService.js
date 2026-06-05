import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    const data = response.data.data;
    return data?.user ? { ...data.user, stats: data.stats } : data;
  },

  getFollowers: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/followers`, { params });
    return response.data.data;
  },

  getFollowing: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/following`, { params });
    return response.data.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    const updated = response.data.data;
    return updated?.user ? { ...updated.user, stats: updated.stats } : updated;
  },

  changePassword: async (data) => {
    const response = await api.put('/users/change-password', data);
    return response.data.data;
  },

  getSettings: async () => {
    const response = await api.get('/users/settings');
    return response.data.data;
  },

  updateSettings: async (data) => {
    const response = await api.put('/users/settings', data);
    return response.data.data;
  },
};
