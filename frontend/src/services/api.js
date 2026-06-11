import axios from 'axios';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

let isRefreshing = false;
let refreshSubscribers = [];

// Hàm đợi refresh token hoàn thành
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Hàm thông báo cho tất cả các request đang đợi khi refresh xong
const onTokenRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((callback) => callback(newAccessToken));
  refreshSubscribers = [];
};

// Hàm refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = response.data.data;

  localStorage.setItem('accessToken', accessToken);
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }

  return accessToken;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đợi refresh hoàn thành rồi thử lại request
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const documentService = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  getBySubject: (subjectCode, params) => api.get(`/documents/subject/${subjectCode}`, { params }),
  getFeatured: () => api.get('/documents/featured'),
  getPopular: (params) => api.get('/documents/popular', { params }),
  getTopRated: (params) => api.get('/documents/top-rated', { params }),
  getMentorDocuments: (mentorId, params) => api.get(`/documents/mentor/${mentorId}`, { params }),
  getFavorites: () => api.get('/documents/favorites'),
  getDownloadHistory: (params) => api.get('/documents/download-history', { params }),
  create: (data) => api.post('/documents', data),
  createMarketplace: (formData) => api.post('/documents/marketplace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createMentorProfile: (formData) => api.post('/documents/mentor-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  addToFavorites: (documentId) => api.post('/documents/favorites', { documentId }),
  addReview: (id, data) => api.post(`/reviews/documents/${id}/reviews`, data),
  likeReview: (id, reviewId, type) => api.put(`/documents/${id}/reviews/${reviewId}/like?type=${type}`),
  download: (id) => api.get(`/documents/${id}/download`),
};

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getByCode: (code) => api.get(`/courses/${code}`),
  getPopular: () => api.get('/courses/popular'),
  getMyCourses: (params) => api.get('/courses/mentor/my-courses', { params }),
  create: (data) => api.post('/courses', data),
  update: (code, data) => api.put(`/courses/${code}`, data),
  delete: (code) => api.delete(`/courses/${code}`),
  addDocument: (code, formData) => api.post(`/courses/${code}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateDocument: (code, docId, formData) => api.put(`/courses/${code}/documents/${docId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeDocument: (code, docId) => api.delete(`/courses/${code}/documents/${docId}`),
};

export const orderService = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getMyDocuments: (params) => api.get('/orders/my-documents', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  initiatePayment: (orderId, paymentMethod) => api.post(`/orders/${orderId}/payment`, { paymentMethod }),
  confirmPayment: (paymentId, transactionId) => api.post('/orders/confirm-payment', { paymentId, transactionId }),
  downloadDocument: (orderId, documentId) => api.get(`/orders/${orderId}/documents/${documentId}/download`),
};

export const downloadOrderDocument = async (orderId, documentId) => {
  const response = await orderService.downloadDocument(orderId, documentId);
  const downloadData = response.data?.data || {};

  if (!downloadData.downloadUrl) {
    return response;
  }

  const fullUrl = downloadData.downloadUrl.startsWith('http')
    ? downloadData.downloadUrl
    : `${API_URL.replace('/api', '')}${downloadData.downloadUrl}`;

  if (downloadData.sourceType === 'google_drive' || downloadData.sourceType === 'external_link') {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    return response;
  }

  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = downloadData.fileName || 'document';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return response;
};

export const mentorService = {
  getAll: (params) => api.get('/mentors', { params }),
  getById: (id) => api.get(`/mentors/${id}`),
  getTop: (params) => api.get('/mentors/top', { params }),
  getSuggestions: () => api.get('/mentors/suggestions'),
  getReviews: (id, params) => api.get(`/mentors/${id}/reviews`, { params }),
  updateProfile: (id, data) => api.put(`/mentors/${id}/profile`, data),
  activatePromotion: (data) => api.post('/mentors/me/promotion', data),
  createBooking: (data) => api.post('/mentors', data),
  getBookings: (params) => api.get('/mentors/bookings/list', { params }),
  updateBookingStatus: (id, data) => api.put(`/mentors/bookings/${id}/status`, data),
  addReview: (id, data) => api.post(`/mentors/${id}/reviews`, data),
  addBookingReview: (id, data) => api.post(`/mentors/bookings/${id}/review`, data),
};

export const aiService = {
  getChats: () => api.get('/ai'),
  getById: (id) => api.get(`/ai/${id}`),
  createChat: (data) => api.post('/ai', data),
  sendMessage: (id, data) => api.post(`/ai/${id}/message`, data),
  deleteChat: (id) => api.delete(`/ai/${id}`),
  summarizePdf: (data) => api.post('/ai/summarize', data),
  generateFlashcards: (data) => api.post('/ai/flashcards', data),
  generateQuiz: (data) => api.post('/ai/quiz', data),
  explainCode: (data) => api.post('/ai/explain-code', data),
  generateRoadmap: (data) => api.post('/ai/roadmap', data),
  getPrompts: (subject) => api.get('/ai/prompts', { params: { subject } }),
};

export const gamificationService = {
  getStats: () => api.get('/gamification/stats'),
  getLeaderboard: (params) => api.get('/gamification/leaderboard', { params }),
  getBadges: () => api.get('/gamification/badges'),
  getBadgeByCode: (code) => api.get(`/gamification/badges/${code}`),
};

export const rewardService = {
  getBalance: () => api.get('/rewards/balance'),
  getHistory: (params) => api.get('/rewards/history', { params }),
  getLeaderboard: (params) => api.get('/rewards/leaderboard', { params }),
  getPointsRequired: (orderId) => api.get('/rewards/required', { params: { orderId } }),
  redeem: (data) => api.post('/rewards/redeem', data),
};

export const dashboardService = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

export default api;
