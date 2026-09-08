import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

export const ordersAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/orders', { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
};

export const productsAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/products', { params }),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: Partial<import('@/types').Product>) => api.post('/admin/products', data),
  update: (id: string, data: Partial<import('@/types').Product>) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

export const customersAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/customers', { params }),
  getById: (id: string) => api.get(`/admin/customers/${id}`),
};

export const inventoryAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/inventory', { params }),
  updateStock: (id: string, stock: number) => api.put(`/admin/inventory/${id}`, { stock }),
};

export const couponsAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/coupons', { params }),
  create: (data: Partial<import('@/types').Coupon>) => api.post('/admin/coupons', data),
};

export const reviewsAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/reviews', { params }),
  moderate: (id: string, action: string) => api.put(`/admin/reviews/${id}/moderate`, { action }),
};

export const campaignsAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/admin/campaigns', { params }),
  create: (data: Partial<import('@/types').Campaign>) => api.post('/admin/campaigns', data),
  update: (id: string, data: Partial<import('@/types').Campaign>) => api.put(`/admin/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/admin/campaigns/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: Record<string, unknown>) => api.put('/admin/settings', data),
};

export const analyticsAPI = {
  getRevenue: (params?: Record<string, string>) => api.get('/admin/analytics/revenue', { params }),
  getCategories: (params?: Record<string, string>) => api.get('/admin/analytics/categories', { params }),
  getTopProducts: (params?: Record<string, string>) => api.get('/admin/analytics/top-products', { params }),
  getCustomers: (params?: Record<string, string>) => api.get('/admin/analytics/customers', { params }),
  getFunnel: (params?: Record<string, string>) => api.get('/admin/analytics/funnel', { params }),
};

export const variantsAPI = {
  getByProduct: (productId: string) => api.get(`/variants/product/${productId}`),
  getGrid: (productId: string) => api.get(`/variants/product/${productId}/grid`),
  setAttributes: (productId: string, attributes: any[]) => api.post(`/variants/product/${productId}/attributes`, { attributes }),
  generateVariants: (productId: string, data?: any) => api.post(`/variants/product/${productId}/generate-variants`, data || {}),
  update: (id: string, data: any) => api.put(`/variants/${id}`, data),
  bulkUpdate: (variantIds: string[], updates: any) => api.put('/variants/bulk-update', { variantIds, updates }),
  compare: (ids: string[]) => api.get(`/variants/compare?ids=${ids.join(',')}`),
  priceHistory: (productId: string, variantId?: string) => api.get(`/variants/price-history/${productId}${variantId ? `?variantId=${variantId}` : ''}`),
  notifyWhenAvailable: (id: string) => api.post(`/variants/${id}/notify-when-available`),
};

export const auditAPI = {
  getLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};

export default api;
