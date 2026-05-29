import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    const data = response.data.data;
    return data?.user ? { ...data.user, stats: data.stats } : data;
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
