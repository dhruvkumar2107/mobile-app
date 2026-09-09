require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { seed } = require('./data/seed');
const { errorHandler } = require('./middleware/errorHandler');
const { requestId, sanitizeBody, requestLogger, RATE_LIMITS } = require('./middleware/security');
const { auth } = require('./middleware/auth');
const { adminAuth } = require('./middleware/adminAuth');
const { initWebSocket } = require('./websocket');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const inventoryRoutes = require('./routes/inventory');
const analyticsRoutes = require('./routes/analytics');
const variantRoutes = require('./routes/variants');
const { cmsRoutes, bannerAdminRoutes } = require('./routes/cms');
const recentlyViewedRoutes = require('./routes/recentlyViewed');
const staffRoutes = require('./routes/staff');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:'],
      connectSrc: ["'self'"],
    },
  } : false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (isProduction) {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestId);
app.use(requestLogger);
app.use(sanitizeBody);

seed();
console.log('Database seeded successfully');

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', brand: 'LUXE', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin/banners', adminAuth, bannerAdminRoutes);
app.use('/api/admin/staff', adminAuth, staffRoutes);
app.use('/api/admin/orders', adminAuth, invoiceRoutes);
app.use('/api/orders', invoiceRoutes);
app.use('/api/recently-viewed', auth, recentlyViewedRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`LUXE API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

module.exports = app;
