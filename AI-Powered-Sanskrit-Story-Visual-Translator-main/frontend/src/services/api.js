import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login/json', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/me', data),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  logout: () => api.post('/api/auth/logout'),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/uploads/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadText: (text) => api.post('/api/uploads/text', { original_text: text, file_type: 'text' }),
  getUploads: (page = 1, pageSize = 10) =>
    api.get('/api/uploads/', { params: { page, page_size: pageSize } }),
  getUpload: (id) => api.get(`/api/uploads/${id}`),
  deleteUpload: (id) => api.delete(`/api/uploads/${id}`),
  extractText: (id) => api.post(`/api/uploads/${id}/extract`),
};

// Translation API
export const translationAPI = {
  createTranslation: (uploadId, targetLanguage, sourceText = null) =>
    api.post('/api/translations/', {
      upload_id: uploadId,
      target_language: targetLanguage,
      source_text: sourceText,
    }),
  translateDirect: (sourceText, targetLanguage = 'telugu') =>
    api.post('/api/translations/direct', {
      source_text: sourceText,
      target_language: targetLanguage,
    }),
  getTranslations: (page = 1, pageSize = 10, targetLanguage = null) =>
    api.get('/api/translations/', {
      params: { page, page_size: pageSize, target_language: targetLanguage },
    }),
  getTranslation: (id) => api.get(`/api/translations/${id}`),
  getTranslationResult: (id) => api.get(`/api/translations/${id}/result`),
  getHistory: (limit = 20) =>
    api.get('/api/translations/history', { params: { limit } }),
  deleteTranslation: (id) => api.delete(`/api/translations/${id}`),
  getSupportedLanguages: () => api.get('/api/translations/languages/supported'),
};

export default api;
