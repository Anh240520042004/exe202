import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/transactions/stats');
    return response.data.data;
  },
};
