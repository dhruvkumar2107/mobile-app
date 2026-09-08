export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  mrp?: number;
  sku: string;
  barcode?: string;
  brand: string;
  category: string;
  subcategory?: string;
  images: string[];
  stock: number;
  reserved?: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  tags: string[];
  status?: 'active' | 'draft' | 'archived';
  isActive?: boolean;
  featured?: boolean;
  rating: number;
  reviewCount: number;
  salesCount?: number;
  seller?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  _id: string;
  id?: string;
  orderNumber?: string;
  userId?: string;
  customer?: Customer | string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  currency?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'packed' | 'out_for_delivery' | 'return_requested';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'completed' | 'cancelled';
  paymentMethod?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  note?: string;
  notes?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  product: Product | string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Customer {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  orders?: number;
  orderCount?: number;
  totalSpent?: number;
  lastActive?: string;
  status?: 'active' | 'inactive' | 'blocked';
  isActive?: boolean;
  tier?: string;
  notes?: string;
  address?: Address;
  addresses?: Address[];
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Coupon {
  _id: string;
  id?: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minOrderAmount?: number;
  minOrder?: number;
  maxDiscount?: number;
  maxUses?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'expired' | 'disabled';
  isActive?: boolean;
  applicableProducts?: string[];
  applicableTo?: string;
  createdAt?: string;
}

export interface Review {
  _id: string;
  id?: string;
  userId?: string;
  customer?: Customer | string;
  product?: Product | string;
  productId?: string;
  rating: number;
  title?: string;
  comment?: string;
  body?: string;
  status?: 'pending' | 'approved' | 'hidden' | 'rejected';
  verified?: boolean;
  hidden?: boolean;
  featured?: boolean;
  helpful?: number;
  images?: string[];
  userName?: string;
  productName?: string;
  createdAt: string;
}

export interface Campaign {
  _id: string;
  id?: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience?: string;
  discount?: number;
  products?: string[];
  categories?: string[];
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  revenue?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface ReturnRequest {
  _id: string;
  id?: string;
  orderId?: string;
  order?: Order | string;
  userId?: string;
  customer?: Customer | string;
  customerName?: string;
  items?: { productId?: string; product?: string; name: string; quantity: number; reason: string }[];
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  refundAmount?: number;
  reason?: string;
  notes?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
  conversionRate: number;
  conversionChange: number;
  averageOrderValue: number;
  aovChange: number;
}

export interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  orders?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'product' | 'review' | 'system';
  message: string;
  time: string;
  user?: string;
}

export interface InventoryItem {
  _id: string;
  id?: string;
  productId?: string;
  product?: Product;
  productName?: string;
  productSku?: string;
  sku: string;
  stock: number;
  reserved?: number;
  available?: number;
  warehouse?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked?: string;
  lastUpdated?: string;
}

export interface VariantAttribute {
  id: string;
  productId: string;
  name: string;
  type: 'text' | 'color' | 'size';
  values: { name: string; hex?: string; image?: string }[];
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>;
  priceDelta: number;
  priceOverride?: number | null;
  effectivePrice?: number;
  originalPrice?: number;
  stock: number;
  reserved?: number;
  images: string[];
  specifications: Record<string, string>;
  availability: 'in_stock' | 'out_of_stock' | 'coming_soon' | 'discontinued';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceRule {
  id: string;
  productId: string;
  variantId?: string;
  type: 'percentage' | 'fixed' | 'flash';
  value: number;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  createdAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  variantId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  createdAt: string;
}
