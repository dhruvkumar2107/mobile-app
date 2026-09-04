# LUXE - Premium E-Commerce Backend

A full-featured REST API for a premium e-commerce platform built with Node.js and Express.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: In-memory data store (development)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS, Rate Limiting

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`

### Health Check

```bash
curl http://localhost:5000/api/health
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@luxe.in | Password@123 |

## API Overview

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/products/:id` - Product details
- `GET /api/categories` - List categories
- `GET /api/search` - Search products
- `GET /api/reviews/product/:id` - Product reviews
- `GET /api/coupons/validate/:code` - Validate coupon

### Auth Endpoints
- `POST /api/auth/register` - Register (3/min rate limit)
- `POST /api/auth/login` - Login (5/min rate limit)
- `GET /api/auth/me` - Current user
- `GET /api/auth/profile` - Full profile

### User Endpoints (Authenticated)
- `GET/POST/DELETE /api/cart` - Cart management
- `GET/POST/DELETE /api/wishlist` - Wishlist management
- `POST /api/orders/create` - Create order (10/min)
- `GET /api/orders` - List orders
- `POST /api/payments/*` - Payment operations (10/min)
- `GET/POST/DELETE /api/users/addresses` - Addresses
- `GET /api/notifications` - Notifications

### Admin Endpoints (Admin Auth)
- `GET /api/admin/dashboard` - Dashboard
- CRUD for products, orders, customers, coupons, reviews
- Analytics and reporting endpoints

For full API documentation, see [API_ROUTES.md](./API_ROUTES.md).

## Architecture

```
backend/
├── src/
│   ├── index.js           # Express app setup and server
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication
│   │   ├── adminAuth.js   # Admin role verification
│   │   ├── security.js    # Rate limiting, sanitization, request ID
│   │   ├── errorHandler.js # Global error handler
│   │   └── validate.js    # Express-validator middleware
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── products.js    # Product routes
│   │   ├── categories.js  # Category routes
│   │   ├── cart.js        # Shopping cart
│   │   ├── wishlist.js    # Wishlist
│   │   ├── orders.js      # Order management
│   │   ├── payments.js    # Payment processing
│   │   ├── reviews.js     # Product reviews
│   │   ├── coupons.js     # Coupon validation
│   │   ├── users.js       # User address management
│   │   ├── search.js      # Search functionality
│   │   ├── notifications.js # Notifications
│   │   ├── inventory.js   # Inventory
│   │   ├── analytics.js   # Analytics
│   │   └── admin.js       # Admin panel routes
│   ├── models/
│   │   └── schema.js      # In-memory data store
│   ├── data/
│   │   └── seed.js        # Database seeding
│   └── test.js            # API test suite
├── .env                   # Environment config
├── .env.example           # Environment template
├── API_ROUTES.md          # API documentation
├── README.md              # This file
└── package.json
```

## Security Features

- **Rate Limiting**: Per-endpoint rate limits (3-100 req/min)
- **Input Sanitization**: XSS prevention, string trimming
- **JWT Authentication**: Token-based auth with expiration
- **Password Hashing**: bcrypt with 12 rounds
- **CORS**: Configurable origin whitelist
- **Security Headers**: Helmet.js (HSTS, CSP, X-Frame-Options, etc.)
- **Error Handling**: No stack traces in production
- **Request ID**: Unique ID per request for tracing
- **Request Logging**: Method, path, status, duration

## Order State Machine

```
pending → confirmed → processing → packed → shipped → out_for_delivery → delivered
    ↓           ↓           ↓          ↓
cancelled   cancelled   cancelled  cancelled
                                              ↓
                                        return_requested → returned
```

## Testing

```bash
# Start server first, then run tests
node src/test.js
```

Tests cover: auth, products, cart, orders, payments, admin, search, error handling, and rate limiting.
