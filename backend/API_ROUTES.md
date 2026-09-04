# LUXE API Routes

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| POST | /api/auth/logout | No | Logout user |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/auth/profile | Yes | Get profile with stats |

### Register Body
```json
{ "email": "string", "name": "string", "password": "string (min 6)", "phone": "string (optional)" }
```

### Login Body
```json
{ "email": "string", "password": "string" }
```

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/products | No | List products (paginated, filterable) |
| GET | /api/products/:id | No | Get product by ID/slug |
| GET | /api/products/:id/related | No | Get related products |
| POST | /api/products/:id/review | Yes | Add review (5/min rate limit) |

### Query Params (GET /products)
`category`, `brand`, `minPrice`, `maxPrice`, `minRating`, `sort`, `search`, `tag`, `page`, `limit`

### Review Body
```json
{ "rating": "1-5", "title": "string", "body": "string" }
```

## Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/categories | No | List all categories with subcategories |
| GET | /api/categories/:slug | No | Get category by slug/id |

## Cart

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/cart | Yes | Get user cart |
| POST | /api/cart/add | Yes | Add item to cart |
| PUT | /api/cart/update | Yes | Update cart item quantity |
| DELETE | /api/cart/:productId | Yes | Remove item from cart |

### Add/Update Body
```json
{ "productId": "string", "quantity": "number (1-100)" }
```

## Wishlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/wishlist | Yes | Get wishlist |
| POST | /api/wishlist/add | Yes | Add to wishlist |
| DELETE | /api/wishlist/:productId | Yes | Remove from wishlist |

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/orders/create | Yes | Create order (10/min rate limit) |
| GET | /api/orders | Yes | List user orders |
| GET | /api/orders/:id | Yes | Get order details |
| GET | /api/orders/:id/track | Yes | Track order |
| POST | /api/orders/:id/cancel | Yes | Cancel order |
| POST | /api/orders/:id/return | Yes | Request return |
| GET | /api/orders/:id/returns | Yes | Get order returns |

### Create Order Body
```json
{ "shippingAddressId": "string", "paymentMethod": "upi|card|netbanking|cod|wallet", "couponCode": "string (optional)" }
```

### Return Body
```json
{ "reason": "string (min 5 chars)", "items": [{"productId": "string", "quantity": "number"}] }
```

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/payments/create-order | Yes | Create payment order (10/min) |
| POST | /api/payments/verify | Yes | Verify payment (10/min) |
| POST | /api/payments/process | Yes | Process payment (10/min) |
| GET | /api/payments/:id/status | Yes | Get payment status |

### Create Payment Body
```json
{ "orderId": "string" }
```

### Verify Payment Body
```json
{ "paymentId": "string", "success": "boolean" }
```

## Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/reviews/product/:productId | No | Get product reviews |

### Query Params
`page`, `limit`, `sort` (newest|highest|lowest|helpful)

## Coupons

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/coupons/validate/:code | No | Validate coupon code |
| POST | /api/coupons/apply | Yes | Apply coupon |

### Apply Body
```json
{ "code": "string", "subtotal": "number" }
```

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/users/addresses | Yes | Get addresses |
| POST | /api/users/addresses | Yes | Add address |
| DELETE | /api/users/addresses/:id | Yes | Delete address |

### Address Body
```json
{ "name": "string", "phone": "string", "line1": "string", "city": "string", "state": "string", "pincode": "string", "isDefault": "boolean" }
```

## Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/search | No | Search products |
| GET | /api/search/trending | No | Get trending searches |
| GET | /api/search/suggestions | No | Get search suggestions |

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/notifications | Yes | Get notifications |
| PUT | /api/notifications/:id/read | Yes | Mark as read |

## Inventory (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/inventory | No | Get inventory |

## Analytics (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/analytics/revenue | No | Revenue analytics |
| GET | /api/analytics/sales | No | Sales analytics |
| GET | /api/analytics/customers | No | Customer analytics |
| GET | /api/analytics/products | No | Product analytics |

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/dashboard | Admin | Dashboard summary |
| GET | /api/admin/dashboard/stats | Admin | Detailed stats |
| GET | /api/admin/dashboard/revenue | Admin | Revenue data |
| GET | /api/admin/dashboard/orders | Admin | Orders data |
| GET | /api/admin/dashboard/categories | Admin | Category stats |
| GET | /api/admin/dashboard/recent-orders | Admin | Recent orders |
| GET | /api/admin/dashboard/activity | Admin | Activity feed |
| GET | /api/admin/orders | Admin | All orders |
| GET | /api/admin/orders/:id | Admin | Order details |
| PUT | /api/admin/orders/:id/status | Admin | Update order status |
| GET | /api/admin/customers | Admin | List customers |
| GET | /api/admin/customers/:id | Admin | Customer details |
| PUT | /api/admin/customers/:id/status | Admin | Update customer |
| GET | /api/admin/products | Admin | All products |
| GET | /api/admin/products/:id | Admin | Product details |
| POST | /api/admin/products | Admin | Create product |
| PUT | /api/admin/products/:id | Admin | Update product |
| DELETE | /api/admin/products/:id | Admin | Deactivate product |
| GET | /api/admin/inventory | Admin | Inventory list |
| PUT | /api/admin/inventory/:id | Admin | Update inventory |
| GET | /api/admin/coupons | Admin | List coupons |
| POST | /api/admin/coupons | Admin | Create coupon |
| GET | /api/admin/reviews | Admin | All reviews |
| PUT | /api/admin/reviews/:id/moderate | Admin | Moderate review |
| POST | /api/admin/reviews/:id/feature | Admin | Feature review |
| GET | /api/admin/analytics/revenue | Admin | Revenue analytics |
| GET | /api/admin/analytics/categories | Admin | Category analytics |
| GET | /api/admin/analytics/top-products | Admin | Top products |
| GET | /api/admin/analytics/customers | Admin | Customer analytics |
| GET | /api/admin/analytics/funnel | Admin | Funnel analytics |
| GET | /api/admin/returns | Admin | List returns |
| PUT | /api/admin/returns/:id/status | Admin | Update return status |
| GET | /api/admin/notifications | Admin | All notifications |
| POST | /api/admin/notifications/send | Admin | Send notification |
| PUT | /api/admin/notifications/:id/read | Admin | Mark notification read |
| GET | /api/admin/settings | Admin | Get settings |
| PUT | /api/admin/settings | Admin | Update settings |
| GET | /api/admin/campaigns | Admin | List campaigns |
| POST | /api/admin/campaigns | Admin | Create campaign |

## Order Status Transitions

```
pending -> confirmed, cancelled
confirmed -> processing, cancelled
processing -> packed, shipped, cancelled
packed -> shipped, cancelled
shipped -> out_for_delivery, delivered
out_for_delivery -> delivered
delivered -> return_requested
return_requested -> returned, delivered
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5/min |
| POST /auth/register | 3/min |
| POST /orders/create | 10/min |
| POST /payments/* | 10/min |
| POST /products/:id/review | 5/min |
| General API | 100/min |
