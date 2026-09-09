import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        if (logoutHandler) {
          logoutHandler();
        } else {
          AsyncStorage.removeItem('authToken');
          AsyncStorage.removeItem('user');
        }
      }
      return Promise.reject(data || { message: 'Something went wrong' });
    }
    if (error.request) {
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  getRelated: (id) => apiClient.get(`/products/${id}/related`),
  review: (id, data) => apiClient.post(`/products/${id}/review`, data),
};

export const categoriesAPI = {
  getAll: () => apiClient.get('/categories'),
};

export const searchAPI = {
  search: (params) => apiClient.get('/search', { params }),
  trending: () => apiClient.get('/search/trending'),
  suggestions: (q) => apiClient.get('/search/suggestions', { params: { q } }),
};

export const reviewsAPI = {
  getProductReviews: (productId) => apiClient.get(`/reviews/product/${productId}`),
};

export const cartAPI = {
  get: () => apiClient.get('/cart'),
  add: (data) => apiClient.post('/cart/add', data),
  update: (data) => apiClient.put('/cart/update', data),
  remove: (productId) => apiClient.delete(`/cart/${productId}`),
};

export const wishlistAPI = {
  get: () => apiClient.get('/wishlist'),
  add: (productId) => apiClient.post('/wishlist/add', { productId }),
  remove: (productId) => apiClient.delete(`/wishlist/${productId}`),
};

export const ordersAPI = {
  create: (data) => apiClient.post('/orders/create', data),
  getAll: (params) => apiClient.get('/orders', { params }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  track: (id) => apiClient.get(`/orders/${id}/track`),
  cancel: (id) => apiClient.post(`/orders/${id}/cancel`),
  requestReturn: (id, data) => apiClient.post(`/orders/${id}/return`, data),
};

export const addressesAPI = {
  get: () => apiClient.get('/users/addresses'),
  create: (data) => apiClient.post('/users/addresses', data),
  update: (id, data) => apiClient.put(`/users/addresses/${id}`, data),
  delete: (id) => apiClient.delete(`/users/addresses/${id}`),
};

export const couponsAPI = {
  validate: (code) => apiClient.get(`/coupons/validate/${code}`),
  apply: (data) => apiClient.post('/coupons/apply', data),
};

export const notificationsAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  read: (id) => apiClient.put(`/notifications/${id}/read`),
  readAll: () => apiClient.put('/notifications/read-all'),
};

export const cmsAPI = {
  getBanners: () => apiClient.get('/cms/banners'),
  getHomepage: () => apiClient.get('/cms/homepage'),
};

export const recentlyViewedAPI = {
  track: (productId) => apiClient.post('/recently-viewed', { productId }),
  get: () => apiClient.get('/recently-viewed'),
};

export const variantsAPI = {
  getByProduct: (productId) => apiClient.get(`/variants/product/${productId}`),
  compare: (ids) => apiClient.get(`/variants/compare?ids=${ids.join(',')}`),
  priceHistory: (productId, variantId) => apiClient.get(`/variants/price-history/${productId}${variantId ? `?variantId=${variantId}` : ''}`),
  notifyWhenAvailable: (id) => apiClient.post(`/variants/${id}/notify-when-available`),
};

export default apiClient;
