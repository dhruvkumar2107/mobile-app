'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

const mockCustomer = {
  _id: '1',
  firstName: 'Arjun',
  lastName: 'Mehta',
  email: 'arjun.mehta@email.com',
  phone: '+91 98765 43210',
  avatar: '',
  orders: 12,
  totalSpent: 485000,
  lastActive: new Date(Date.now() - 3600000).toISOString(),
  status: 'active' as const,
  address: { street: '42 MG Road, Koramangala', city: 'Bangalore', state: 'Karnataka', zipCode: '560034', country: 'India' },
  createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
};

const mockOrderHistory = Array.from({ length: 5 }, (_, i) => ({
  _id: String(i + 1),
  orderNumber: `ORD-${28400 + i}`,
  items: [{ quantity: i + 1 }],
  total: Math.floor(Math.random() * 100000) + 10000,
  status: ['delivered', 'delivered', 'shipped', 'delivered', 'processing'][i],
  createdAt: new Date(Date.now() - i * 86400000 * 15).toISOString(),
}));

export default function CustomerDetailPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  const orderColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'orderNumber',
      label: 'Order',
      render: (item) => <span className="font-semibold text-accent">{item.orderNumber as string}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      render: (item) => <span className="font-semibold text-navy">{formatCurrency(item.total as number)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'delivered' ? 'success' : item.status === 'shipped' ? 'info' : 'warning'} dot>
          {(item.status as string).charAt(0).toUpperCase() + (item.status as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item) => <span className="text-text-secondary text-xs">{formatDate(item.createdAt as string)}</span>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">{mockCustomer.firstName} {mockCustomer.lastName}</h1>
            <p className="text-sm text-text-secondary mt-0.5">Customer since {formatDate(mockCustomer.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy text-2xl font-bold mx-auto">
                {mockCustomer.firstName.charAt(0)}{mockCustomer.lastName.charAt(0)}
              </div>
              <h2 className="text-lg font-bold text-navy mt-3">{mockCustomer.firstName} {mockCustomer.lastName}</h2>
              <Badge variant={mockCustomer.status === 'active' ? 'success' : 'warning'} dot size="md">
                {mockCustomer.status.charAt(0).toUpperCase() + mockCustomer.status.slice(1)}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={15} className="text-text-muted" />
                <span className="text-text-secondary">{mockCustomer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-text-muted" />
                <span className="text-text-secondary">{mockCustomer.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={15} className="text-text-muted mt-0.5" />
                <span className="text-text-secondary">
                  {mockCustomer.address.street}<br />
                  {mockCustomer.address.city}, {mockCustomer.address.state}
                </span>
              </div>
            </div>
          </div>

          {/* Stats & Orders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={16} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-navy">{mockCustomer.orders}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-gold-dark">{formatCurrency(mockCustomer.totalSpent)}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Last Active</span>
                </div>
                <p className="text-sm font-medium text-navy">{formatDateTime(mockCustomer.lastActive)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-navy">Order History</h3>
              </div>
              <DataTable
                columns={orderColumns}
                data={mockOrderHistory}
                onRowClick={(item) => window.location.href = `/orders/${item._id}`}
                emptyMessage="No orders found"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
