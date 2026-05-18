import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data.data;
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
