import { COLORS } from './theme';

export const formatPrice = (price) => {
  if (price === undefined || price === null) return '₹0';
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

export const getDiscountPercent = (mrp, price) => {
  if (!mrp || !price || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

export const getStatusColor = (status) => {
  const statusMap = {
    pending: COLORS.warning,
    processing: COLORS.primary,
    shipped: '#3B82F6',
    'out for delivery': '#8B5CF6',
    delivered: COLORS.success,
    cancelled: COLORS.error,
    returned: COLORS.error,
    refunded: COLORS.success,
  };
  return statusMap[status?.toLowerCase()] || COLORS.gray500;
};

export const generateStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push('full');
    else if (i === fullStars && hasHalf) stars.push('half');
    else stars.push('empty');
  }
  return stars;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};

export const validatePassword = (password) => password && password.length >= 6;

export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/300x400?text=LUXE';
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${imagePath}`;
};
