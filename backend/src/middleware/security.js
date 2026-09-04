const { v4: uuidv4 } = require('uuid');

const rateLimitStore = {};

function cleanupRateLimits() {
  const now = Date.now();
  for (const key in rateLimitStore) {
    rateLimitStore[key] = rateLimitStore[key].filter((timestamp) => now - timestamp < 60000);
    if (rateLimitStore[key].length === 0) delete rateLimitStore[key];
  }
}

setInterval(cleanupRateLimits, 60000);

function rateLimit(maxRequests, windowMs = 60000) {
  return (req, res, next) => {
    const key = `${req.ip}-${req.route?.path || req.originalUrl}`;
    const now = Date.now();
    if (!rateLimitStore[key]) rateLimitStore[key] = [];
    rateLimitStore[key] = rateLimitStore[key].filter((timestamp) => now - timestamp < windowMs);
    if (rateLimitStore[key].length >= maxRequests) {
      const retryAfter = Math.ceil((rateLimitStore[key][0] + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }
    rateLimitStore[key].push(now);
    next();
  };
}

function requestId(req, res, next) {
  req.id = uuidv4();
  res.set('X-Request-Id', req.id);
  next();
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, (char) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return entities[char] || char;
  }).trim();
}

function sanitizeInput(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeInput(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  next();
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id,
    };
    if (process.env.NODE_ENV === 'development') {
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\x1b[0m`);
    }
  });
  next();
}

const RATE_LIMITS = {
  login: rateLimit(5, 60000),
  register: rateLimit(3, 60000),
  orderCreate: rateLimit(10, 60000),
  payment: rateLimit(10, 60000),
  review: rateLimit(5, 60000),
  general: rateLimit(100, 60000),
};

module.exports = {
  rateLimit,
  requestId,
  sanitizeInput,
  sanitizeBody,
  requestLogger,
  RATE_LIMITS,
};
