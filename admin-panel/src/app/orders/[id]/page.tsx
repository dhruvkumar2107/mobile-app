'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { ordersAPI } from '@/lib/api';
import { Order, Customer } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gold'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'gold',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  returned: 'error',
  refunded: 'error',
  packed: 'info',
  out_for_delivery: 'info',
  return_requested: 'warning',
};

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

function buildTimeline(order: Order) {
  const statusIndex = statusFlow.indexOf(order.status as typeof statusFlow[number]);
  const timeline: { status: string; time: string | null; done: boolean }[] = statusFlow.map((s, i) => ({
    status: s.charAt(0).toUpperCase() + s.slice(1),
    time: i <= statusIndex && order.updatedAt ? order.updatedAt : null,
    done: i <= statusIndex,
  }));
  if (order.status === 'cancelled') {
    timeline.forEach((step, i) => {
      if (i <= 2) { step.done = true; step.time = order.createdAt; }
      else { step.done = false; step.time = null; }
    });
    timeline.push({ status: 'Cancelled', time: order.updatedAt || null, done: true });
  }
  return timeline;
}

function getCustomerName(customer: Order['customer']): string {
  if (!customer) return 'N/A';
  if (typeof customer === 'string') return customer;
  const c = customer as Customer;
  if (c.firstName || c.lastName) return `${c.firstName || ''} ${c.lastName || ''}`.trim();
  if (c.name) return c.name;
  return c.email || 'N/A';
}

function getCustomerEmail(customer: Order['customer']): string {
  if (!customer || typeof customer === 'string') return '';
  return (customer as Customer).email || '';
}

function getCustomerPhone(customer: Order['customer']): string {
  if (!customer || typeof customer === 'string') return '';
  return (customer as Customer).phone || '';
}

function getInitials(customer: Order['customer']): string {
  if (!customer || typeof customer === 'string') return '?';
  const c = customer as Customer;
  if (c.firstName || c.lastName) return `${(c.firstName || '')[0] || ''}${(c.lastName || '')[0] || ''}`.toUpperCase();
  if (c.name) return c.name.charAt(0).toUpperCase();
  return c.email?.charAt(0)?.toUpperCase() || '?';
}

const allStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned', label: 'Returned' },
  { value: 'refunded', label: 'Refunded' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    ordersAPI
      .getById(orderId)
      .then((res) => {
        const data = res.data?.data || res.data;
        setOrder(data);
        setNewStatus(data.status || 'pending');
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load order');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.status) return;
    setUpdatingStatus(true);
    try {
      const res = await ordersAPI.updateStatus(order._id, newStatus);
      const data = res.data?.data || res.data;
      setOrder((prev) => (prev ? { ...prev, ...data } : data));
      setShowStatusModal(false);
    } catch {
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <XCircle size={48} className="text-red-400" />
          <p className="text-lg font-medium text-navy">{error || 'Order not found'}</p>
          <Link href="/orders">
            <Button variant="secondary">Back to Orders</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const timeline = buildTimeline(order);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-navy">{order.orderNumber || order._id}</h1>
                <Badge variant={statusColors[order.status]} dot size="md">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">Placed on {formatDateTime(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(true)}>
              Update Status
            </Button>
            <Button variant="danger" size="sm">Cancel Order</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
                <Package size={16} className="text-text-muted" />
                Order Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy">{item.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                    </div>
                    <p className="text-sm font-semibold text-navy">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-navy">{formatCurrency(order.subtotal)}</span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span className="text-success">-{formatCurrency(order.discount!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-navy">{(order.shipping ?? 0) > 0 ? formatCurrency(order.shipping!) : 'Free'}</span>
                </div>
                {(order.tax ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-navy">{formatCurrency(order.tax!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span className="text-navy">Total</span>
                  <span className="text-gold-dark">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock size={16} className="text-text-muted" />
                Order Timeline
              </h3>
              <div className="space-y-0">
                {timeline.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 relative pb-4 last:pb-0">
                    {index < timeline.length - 1 && (
                      <div className={`absolute left-[11px] top-6 w-0.5 h-full ${step.done ? 'bg-success' : 'bg-gray-200'}`} />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.done ? 'bg-success text-white' : 'bg-gray-200 text-text-muted'
                    }`}>
                      {step.done ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${step.done ? 'text-navy' : 'text-text-muted'}`}>{step.status}</p>
                      {step.time && <p className="text-xs text-text-muted mt-0.5">{formatDateTime(step.time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-3">Customer</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(order.customer)}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{getCustomerName(order.customer)}</p>
                  <p className="text-xs text-text-muted">{getCustomerEmail(order.customer)}</p>
                </div>
              </div>
              {getCustomerPhone(order.customer) && (
                <p className="text-xs text-text-muted">{getCustomerPhone(order.customer)}</p>
              )}
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-text-muted" />
                  Shipping Address
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.zipCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <CreditCard size={14} className="text-text-muted" />
                Payment
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Method</span>
                  <span className="text-navy">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant="success" dot>{order.paymentStatus}</Badge>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tracking</span>
                    <span className="text-accent text-xs font-mono">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(order.notes || order.note) && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-text-muted" />
                  Notes
                </h3>
                <p className="text-sm text-text-secondary">{order.notes || order.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Update Status Modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Order Status">
          <div className="space-y-4">
            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={allStatuses}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdateStatus} disabled={updatingStatus || newStatus === order.status}>
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
