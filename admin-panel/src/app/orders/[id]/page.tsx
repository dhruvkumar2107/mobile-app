'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
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
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

const mockOrder = {
  _id: '1',
  orderNumber: 'ORD-28491',
  customer: {
    firstName: 'Arjun',
    lastName: 'Mehta',
    email: 'arjun.mehta@email.com',
    phone: '+91 98765 43210',
  },
  items: [
    { name: 'Royal Chronograph Watch', image: '', price: 89500, quantity: 1, total: 89500 },
    { name: 'Leather Watch Strap', image: '', price: 4500, quantity: 2, total: 9000 },
    { name: 'Watch Box - Premium', image: '', price: 2500, quantity: 1, total: 2500 },
  ],
  subtotal: 101000,
  discount: 5000,
  shipping: 0,
  tax: 18180,
  total: 114180,
  currency: 'INR',
  status: 'shipped',
  paymentStatus: 'paid',
  paymentMethod: 'Credit Card (**** 4242)',
  shippingAddress: {
    street: '42 MG Road, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560034',
    country: 'India',
  },
  trackingNumber: 'DTDC1234567890',
  notes: 'Gift wrap requested',
  couponCode: 'LUXE5000',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
  timeline: [
    { status: 'Order Placed', time: new Date(Date.now() - 86400000 * 2).toISOString(), done: true },
    { status: 'Payment Confirmed', time: new Date(Date.now() - 86400000 * 2 + 300000).toISOString(), done: true },
    { status: 'Processing', time: new Date(Date.now() - 86400000).toISOString(), done: true },
    { status: 'Shipped', time: new Date(Date.now() - 3600000).toISOString(), done: true },
    { status: 'Delivered', time: null, done: false },
  ],
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gold'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'gold',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrderDetailPage() {
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

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
                <h1 className="text-2xl font-bold text-navy">{mockOrder.orderNumber}</h1>
                <Badge variant={statusColors[mockOrder.status]} dot size="md">
                  {mockOrder.status.charAt(0).toUpperCase() + mockOrder.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">Placed on {formatDateTime(mockOrder.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(true)}>
              Update Status
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowRefundModal(true)}>
              <RotateCcw size={15} /> Refund
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
                Order Items ({mockOrder.items.length})
              </h3>
              <div className="space-y-3">
                {mockOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-text-muted" />
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
                  <span className="text-navy">{formatCurrency(mockOrder.subtotal)}</span>
                </div>
                {mockOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Discount ({mockOrder.couponCode})</span>
                    <span className="text-success">-{formatCurrency(mockOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax (GST 18%)</span>
                  <span className="text-navy">{formatCurrency(mockOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                  <span className="text-navy">Total</span>
                  <span className="text-gold-dark">{formatCurrency(mockOrder.total)}</span>
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
                {mockOrder.timeline.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 relative pb-4 last:pb-0">
                    {index < mockOrder.timeline.length - 1 && (
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
                  {mockOrder.customer.firstName.charAt(0)}{mockOrder.customer.lastName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{mockOrder.customer.firstName} {mockOrder.customer.lastName}</p>
                  <p className="text-xs text-text-muted">{mockOrder.customer.email}</p>
                </div>
              </div>
              <p className="text-xs text-text-muted">{mockOrder.customer.phone}</p>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-text-muted" />
                Shipping Address
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {mockOrder.shippingAddress.street}<br />
                {mockOrder.shippingAddress.city}, {mockOrder.shippingAddress.state}<br />
                {mockOrder.shippingAddress.zipCode}<br />
                {mockOrder.shippingAddress.country}
              </p>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <CreditCard size={14} className="text-text-muted" />
                Payment
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Method</span>
                  <span className="text-navy">{mockOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant="success" dot>{mockOrder.paymentStatus}</Badge>
                </div>
                {mockOrder.trackingNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Tracking</span>
                    <span className="text-accent text-xs font-mono">{mockOrder.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {mockOrder.notes && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-text-muted" />
                  Notes
                </h3>
                <p className="text-sm text-text-secondary">{mockOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Update Status Modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Order Status">
          <div className="space-y-4">
            <Select
              label="New Status"
              value={mockOrder.status}
              onChange={() => {}}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
              ]}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
              <Button variant="primary">Update Status</Button>
            </div>
          </div>
        </Modal>

        {/* Refund Modal */}
        <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title="Process Refund">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Refund amount: <span className="font-semibold text-navy">{formatCurrency(mockOrder.total)}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Reason</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                rows={3}
                placeholder="Enter refund reason..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              <Button variant="danger">Process Refund</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
