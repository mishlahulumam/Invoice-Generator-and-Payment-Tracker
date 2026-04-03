import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
}

// Clients
export const clientsApi = {
  list: () => api.get('/clients'),
  create: (data) => api.post('/clients', data),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
}

// Invoices
export const invoicesApi = {
  list: (status) => api.get('/invoices', { params: status ? { status } : {} }),
  create: (data) => api.post('/invoices', data),
  get: (id) => api.get(`/invoices/${id}`),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  send: (id) => api.post(`/invoices/${id}/send`),
  pay: (id, data) => api.post(`/invoices/${id}/pay`, data),
  getPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  getQr: (id) => api.get(`/invoices/${id}/qr`),
  duplicate: (id) => api.post(`/invoices/${id}/duplicate`),
}

// Dashboard
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  revenueChart: () => api.get('/dashboard/revenue-chart'),
  invoiceStats: () => api.get('/dashboard/invoice-stats'),
}

// Templates
export const templatesApi = {
  list: () => api.get('/templates'),
  create: (data) => api.post('/templates', data),
  get: (id) => api.get(`/templates/${id}`),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
}

// Recurring
export const recurringApi = {
  list: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  get: (id) => api.get(`/recurring/${id}`),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  togglePause: (id) => api.post(`/recurring/${id}/pause`),
  delete: (id) => api.delete(`/recurring/${id}`),
}
