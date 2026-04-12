import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const generateAPI = {
  create: (data) => api.post('/generate', data),
};

export const historyAPI = {
  list: (page = 1, limit = 10) => api.get(`/generations?page=${page}&limit=${limit}`),
  get: (id) => api.get(`/generations/${id}`),
};

export const modelsAPI = {
  list: () => api.get('/models'),
};

export const billingAPI = {
  plans: () => api.get('/billing/plans'),
  checkout: (plan) => api.post('/billing/checkout', { plan }),
  portal: () => api.post('/billing/portal'),
};
