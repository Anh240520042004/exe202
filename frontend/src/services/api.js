import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  getFavorites: () => api.get('/documents/favorites'),
  getDownloadHistory: (params) => api.get('/documents/download-history', { params }),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  addToFavorites: (documentId) => api.post('/documents/favorites', { documentId }),
  addReview: (id, data) => api.post(`/documents/${id}/reviews`, data),
  likeReview: (id, reviewId, type) => api.put(`/documents/${id}/reviews/${reviewId}/like`, { type }),
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

export const mentorService = {
  getAll: (params) => api.get('/mentors', { params }),
  getById: (id) => api.get(`/mentors/${id}`),
  getTop: (params) => api.get('/mentors/top', { params }),
  updateProfile: (id, data) => api.put(`/mentors/${id}/profile`, data),
  createBooking: (data) => api.post('/mentors', data),
  getBookings: (params) => api.get('/mentors/bookings/list', { params }),
  updateBookingStatus: (id, data) => api.put(`/mentors/bookings/${id}/status`, data),
  addReview: (id, data) => api.post(`/mentors/${id}/review`, data),
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

export const dashboardService = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

export default api;
