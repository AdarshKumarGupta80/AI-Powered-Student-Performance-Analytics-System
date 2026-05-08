import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://noble-achievement-production.up.railway.app' || ' http://localhost:8000';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  registerStudent: (data) => api.post('/api/auth/register/student', data),
};

export const studentAPI = {
  getAll: () => api.get('/api/students'),
  getById: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
};

export const dashboardAPI = {
  get: (id) => api.get(`/api/dashboard/${id}`),
};

export const academicAPI = {
  addMark: (id, data) => api.post(`/api/academic/marks/${id}`, data),
  addAttendance: (id, data) => api.post(`/api/academic/attendance/${id}`, data),
  addAssignment: (id, data) => api.post(`/api/academic/assignments/${id}`, data),
  addStudySession: (id, data) => api.post(`/api/academic/study-sessions/${id}`, data),
  addEngagement: (id, data) => api.post(`/api/academic/engagement/${id}`, data),
};

export const analyticsAPI = {
  compute: (id) => api.post(`/api/analytics/compute/${id}`),
  getSummary: (id) => api.get(`/api/analytics/${id}`),
  predict: (id) => api.get(`/api/analytics/predict/${id}`),
};

export const recommendationAPI = {
  getAll: (id) => api.get(`/api/recommendations/${id}`),
  getUnread: (id) => api.get(`/api/recommendations/${id}/unread`),
  markAllRead: (id) => api.put(`/api/recommendations/${id}/mark-read`),
};

export const reportAPI = {
  generate: (studentId) => api.post(`/api/reports/generate/${studentId}`),
  getHistory: (studentId) => api.get(`/api/reports/student/${studentId}`),
  downloadPdf: (reportId) =>
    api.get(`/api/reports/${reportId}/pdf`, { responseType: 'blob' }),
  sendEmail: (studentId) => api.post(`/api/reports/email/${studentId}`),
};

export const aiFeedbackAPI = {
  generate: (studentId) => api.post(`/api/ai-feedback/generate/${studentId}`),
  getHistory: (studentId) => api.get(`/api/ai-feedback/student/${studentId}`),
  getDashboard: () => api.get('/api/ai-feedback/dashboard'),
};

export default api;
