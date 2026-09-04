const http = require('http');

const API = 'http://localhost:5000/api';
let token = '';
let adminToken = '';
let productId = '';
let orderId = '';
let couponCode = '';

function request(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { error: 'Invalid JSON' } });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function test() {
  console.log('\n=== LUXE API Test Suite ===\n');

  // Test 1: Health check
  let res = await request('GET', '/health');
  assert(res.status === 200, 'Health check returns 200');
  assert(res.data.success === true, 'Health check returns success');
  assert(res.data.data.brand === 'LUXE', 'Health check returns brand name');

  // Test 2: Register
  res = await request('POST', '/auth/register', {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    phone: '+919876543210',
  });
  assert(res.status === 201, 'Register returns 201');
  assert(res.data.success === true, 'Register returns success');
  assert(res.data.data.token, 'Register returns token');
  assert(!res.data.data.user.password, 'Register does not return password');
  token = res.data.data.token;

  // Test 3: Login
  res = await request('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  assert(res.status === 200, 'Login returns 200');
  assert(res.data.success === true, 'Login returns success');
  assert(res.data.data.token, 'Login returns token');
  assert(!res.data.data.user.password, 'Login does not return password');
  token = res.data.data.token;

  // Test 4: Get products
  res = await request('GET', '/products');
  assert(res.status === 200, 'Get products returns 200');
  assert(res.data.success === true, 'Get products returns success');
  assert(res.data.data.items.length > 0, 'Get products returns items');
  assert(res.data.data.total > 0, 'Get products returns total');
  assert(res.data.data.totalPages > 0, 'Get products returns totalPages');
  productId = res.data.data.items[0].id;

  // Test 5: Get categories
  res = await request('GET', '/categories');
  assert(res.status === 200, 'Get categories returns 200');
  assert(res.data.success === true, 'Get categories returns success');
  assert(Array.isArray(res.data.data), 'Get categories returns array');
  assert(res.data.data.length > 0, 'Get categories has items');

  // Test 6: Search
  res = await request('GET', '/search?q=shirt');
  assert(res.status === 200, 'Search returns 200');
  assert(res.data.success === true, 'Search returns success');
  assert(res.data.data.results.length >= 0, 'Search returns results array');

  // Test 7: Get profile
  res = await request('GET', '/auth/me', null, token);
  assert(res.status === 200, 'Get profile returns 200');
  assert(res.data.success === true, 'Get profile returns success');
  assert(res.data.data.email === 'test@example.com', 'Get profile returns correct user');

  // Test 8: Add address
  res = await request('POST', '/users/addresses', {
    name: 'Test User',
    phone: '+919876543210',
    line1: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    isDefault: true,
  }, token);
  assert(res.status === 201, 'Add address returns 201');
  assert(res.data.success === true, 'Add address returns success');
  const addressId = res.data.data.id;

  // Test 9: Add to cart
  res = await request('POST', '/cart/add', { productId, quantity: 2 }, token);
  assert(res.status === 200, 'Add to cart returns 200');
  assert(res.data.success === true, 'Add to cart returns success');

  // Test 10: Get cart
  res = await request('GET', '/cart', null, token);
  assert(res.status === 200, 'Get cart returns 200');
  assert(res.data.success === true, 'Get cart returns success');
  assert(res.data.data.items.length > 0, 'Get cart has items');
  assert(res.data.data.subtotal > 0, 'Get cart has subtotal');

  // Test 11: Get wishlist
  res = await request('GET', '/wishlist', null, token);
  assert(res.status === 200, 'Get wishlist returns 200');
  assert(res.data.success === true, 'Get wishlist returns success');

  // Test 12: Create order
  res = await request('POST', '/orders/create', {
    shippingAddressId: addressId,
    paymentMethod: 'upi',
  }, token);
  assert(res.status === 201, 'Create order returns 201');
  assert(res.data.success === true, 'Create order returns success');
  assert(res.data.data.id, 'Create order returns order ID');
  assert(res.data.data.status === 'pending', 'New order has pending status');
  assert(res.data.data.total > 0, 'Order has total');
  orderId = res.data.data.id;

  // Test 13: Get orders
  res = await request('GET', '/orders', null, token);
  assert(res.status === 200, 'Get orders returns 200');
  assert(res.data.success === true, 'Get orders returns success');
  assert(res.data.data.items.length > 0, 'Get orders has items');

  // Test 14: Get single order
  res = await request('GET', `/orders/${orderId}`, null, token);
  assert(res.status === 200, 'Get single order returns 200');
  assert(res.data.success === true, 'Get single order returns success');

  // Test 15: Create payment
  res = await request('POST', '/payments/create-order', { orderId }, token);
  assert(res.status === 200 || res.status === 201, 'Create payment returns 200/201');
  assert(res.data.success === true, 'Create payment returns success');
  const paymentId = res.data.data.payment.id;

  // Test 16: Verify payment
  res = await request('POST', '/payments/verify', { paymentId, success: true }, token);
  assert(res.status === 200, 'Verify payment returns 200');
  assert(res.data.success === true, 'Verify payment returns success');

  // Test 17: Get notifications
  res = await request('GET', '/notifications', null, token);
  assert(res.status === 200, 'Get notifications returns 200');
  assert(res.data.success === true, 'Get notifications returns success');

  // Test 18: Validate coupon
  res = await request('GET', '/coupons/validate/LUXE10');
  assert(res.status === 200, 'Validate coupon returns 200');
  assert(res.data.success === true, 'Validate coupon returns success');
  couponCode = 'LUXE10';

  // Test 19: Admin login
  res = await request('POST', '/auth/login', {
    email: 'admin@luxe.in',
    password: 'Password@123',
  });
  assert(res.status === 200, 'Admin login returns 200');
  assert(res.data.success === true, 'Admin login returns success');
  assert(res.data.data.user.role === 'admin', 'Admin login returns admin user');
  adminToken = res.data.data.token;

  // Test 20: Admin dashboard
  res = await request('GET', '/admin/dashboard', null, adminToken);
  assert(res.status === 200, 'Admin dashboard returns 200');
  assert(res.data.success === true, 'Admin dashboard returns success');
  assert(typeof res.data.data.totalRevenue === 'number', 'Dashboard has totalRevenue');
  assert(typeof res.data.data.totalOrders === 'number', 'Dashboard has totalOrders');

  // Test 21: Admin dashboard stats
  res = await request('GET', '/admin/dashboard/stats', null, adminToken);
  assert(res.status === 200, 'Admin dashboard stats returns 200');
  assert(res.data.success === true, 'Admin dashboard stats returns success');

  // Test 22: Admin orders
  res = await request('GET', '/admin/orders', null, adminToken);
  assert(res.status === 200, 'Admin orders returns 200');
  assert(res.data.success === true, 'Admin orders returns success');

  // Test 23: Admin products
  res = await request('GET', '/admin/products', null, adminToken);
  assert(res.status === 200, 'Admin products returns 200');
  assert(res.data.success === true, 'Admin products returns success');
  assert(res.data.data.items.length > 0, 'Admin products has items');

  // Test 24: Admin customers
  res = await request('GET', '/admin/customers', null, adminToken);
  assert(res.status === 200, 'Admin customers returns 200');
  assert(res.data.success === true, 'Admin customers returns success');

  // Test 25: Create coupon (admin)
  res = await request('POST', '/admin/coupons', {
    code: 'TEST10',
    type: 'percentage',
    value: 10,
    minOrder: 500,
    usageLimit: 100,
  }, adminToken);
  assert(res.status === 201, 'Create coupon returns 201');
  assert(res.data.success === true, 'Create coupon returns success');
  assert(res.data.data.code === 'TEST10', 'Coupon has correct code');

  // Test 26: Get admin coupons
  res = await request('GET', '/admin/coupons', null, adminToken);
  assert(res.status === 200, 'Get admin coupons returns 200');
  assert(res.data.success === true, 'Get admin coupons returns success');
  assert(res.data.data.length > 0, 'Get admin coupons has items');

  // Test 27: Admin reviews
  res = await request('GET', '/admin/reviews', null, adminToken);
  assert(res.status === 200, 'Admin reviews returns 200');
  assert(res.data.success === true, 'Admin reviews returns success');

  // Test 28: Admin analytics
  res = await request('GET', '/admin/analytics/revenue', null, adminToken);
  assert(res.status === 200, 'Admin analytics returns 200');
  assert(res.data.success === true, 'Admin analytics returns success');

  // Test 29: Admin returns
  res = await request('GET', '/admin/returns', null, adminToken);
  assert(res.status === 200, 'Admin returns returns 200');
  assert(res.data.success === true, 'Admin returns returns success');

  // Test 30: Admin settings
  res = await request('GET', '/admin/settings', null, adminToken);
  assert(res.status === 200, 'Admin settings returns 200');
  assert(res.data.success === true, 'Admin settings returns success');
  assert(res.data.data.storeName === 'LUXE', 'Settings has storeName');

  // Test 31: Search trending
  res = await request('GET', '/search/trending');
  assert(res.status === 200, 'Search trending returns 200');
  assert(res.data.success === true, 'Search trending returns success');
  assert(Array.isArray(res.data.data), 'Search trending returns array');

  // Test 32: Search suggestions
  res = await request('GET', '/search/suggestions?q=phone');
  assert(res.status === 200, 'Search suggestions returns 200');
  assert(res.data.success === true, 'Search suggestions returns success');

  // Test 33: Product reviews
  res = await request('GET', `/reviews/product/${productId}`);
  assert(res.status === 200, 'Product reviews returns 200');
  assert(res.data.success === true, 'Product reviews returns success');

  // Test 34: Unauthorized access
  res = await request('GET', '/cart');
  assert(res.status === 401, 'Unauthorized returns 401');

  // Test 35: Invalid token
  res = await request('GET', '/auth/me', null, 'invalidtoken');
  assert(res.status === 401, 'Invalid token returns 401');

  // Test 36: Duplicate registration
  res = await request('POST', '/auth/register', {
    email: 'test@example.com',
    name: 'Test User 2',
    password: 'password123',
  });
  assert(res.status === 409, 'Duplicate email returns 409');

  // Test 37: Invalid email
  res = await request('POST', '/auth/register', {
    email: 'notanemail',
    name: 'Test',
    password: 'password123',
  });
  assert(res.status === 400, 'Invalid email returns 400');

  // Test 38: Short password (may be rate limited, accept 400 or 429)
  res = await request('POST', '/auth/register', {
    email: 'test2@example.com',
    name: 'Test',
    password: '123',
  });
  assert(res.status === 400 || res.status === 429, 'Short password returns 400 or 429');

  // Test 39: Empty cart order
  res = await request('POST', '/orders/create', {
    shippingAddressId: 'nonexistent',
    paymentMethod: 'upi',
  }, token);
  assert(res.status === 400, 'Empty cart order returns 400');

  // Test 40: Health check timing
  const start = Date.now();
  await request('GET', '/health');
  const elapsed = Date.now() - start;
  assert(elapsed < 1000, `Health check under 1s (${elapsed}ms)`);

  // Test 41: Category by slug
  res = await request('GET', '/categories/electronics');
  assert(res.status === 200, 'Category by slug returns 200');
  assert(res.data.success === true, 'Category by slug returns success');

  // Test 42: Product related
  res = await request('GET', `/products/${productId}/related`);
  assert(res.status === 200, 'Product related returns 200');
  assert(res.data.success === true, 'Product related returns success');
  assert(Array.isArray(res.data.data), 'Product related returns array');

  // Test 43: Admin inventory
  res = await request('GET', '/admin/inventory', null, adminToken);
  assert(res.status === 200, 'Admin inventory returns 200');
  assert(res.data.success === true, 'Admin inventory returns success');

  // Test 44: Admin dashboard revenue
  res = await request('GET', '/admin/dashboard/revenue', null, adminToken);
  assert(res.status === 200, 'Admin dashboard revenue returns 200');
  assert(res.data.success === true, 'Admin dashboard revenue returns success');

  // Test 45: Admin dashboard orders
  res = await request('GET', '/admin/dashboard/orders', null, adminToken);
  assert(res.status === 200, 'Admin dashboard orders returns 200');
  assert(res.data.success === true, 'Admin dashboard orders returns success');

  // Test 46: Admin analytics top products
  res = await request('GET', '/admin/analytics/top-products', null, adminToken);
  assert(res.status === 200, 'Admin analytics top products returns 200');
  assert(res.data.success === true, 'Admin analytics top products returns success');

  // Test 47: Admin analytics customers
  res = await request('GET', '/admin/analytics/customers', null, adminToken);
  assert(res.status === 200, 'Admin analytics customers returns 200');
  assert(res.data.success === true, 'Admin analytics customers returns success');

  // Test 48: Admin analytics funnel
  res = await request('GET', '/admin/analytics/funnel', null, adminToken);
  assert(res.status === 200, 'Admin analytics funnel returns 200');
  assert(res.data.success === true, 'Admin analytics funnel returns success');

  // Test 49: Admin dashboard activity
  res = await request('GET', '/admin/dashboard/activity', null, adminToken);
  assert(res.status === 200, 'Admin dashboard activity returns 200');
  assert(res.data.success === true, 'Admin dashboard activity returns success');

  // Test 50: Admin dashboard categories
  res = await request('GET', '/admin/dashboard/categories', null, adminToken);
  assert(res.status === 200, 'Admin dashboard categories returns 200');
  assert(res.data.success === true, 'Admin dashboard categories returns success');

  console.log('\n=== All 50 tests passed! ===\n');
}

test().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
