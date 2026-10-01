import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getStats: () => api.get('/invoices/stats'),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  markPaid: (invoiceId, data) => api.put(`/payments/${invoiceId}`, data),
  markUnpaid: (invoiceId) => api.put(`/payments/${invoiceId}/unpaid`),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  updatePlan: (id, plan) => api.put(`/admin/users/${id}/plan`, { plan }),
};

export const stripeAPI = {
  getPlans: () => api.get('/stripe/plans'),
  createCheckout: (plan) => api.post('/stripe/checkout', { plan }),
  createPortal: () => api.post('/stripe/portal'),
};

export default api;
