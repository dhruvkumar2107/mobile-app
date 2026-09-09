'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import DataTable, { Column } from '@/components/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { customersAPI } from '@/lib/api';
import { Customer } from '@/types';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  blocked: 'error',
};

const orderStatusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  delivered: 'success',
  shipped: 'info',
  processing: 'warning',
  pending: 'warning',
  cancelled: 'error',
};

interface CustomerDetail extends Customer {
  recentOrders?: {
    _id: string;
    orderNumber?: string;
    items: { quantity: number }[];
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  const fetchCustomer = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await customersAPI.getById(id);
      const d = res.data;
      const data = d.data || d.customer || d;
      setCustomer(data);
    } catch {
      setError('Failed to load customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

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

  if (error || !customer) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Link href="/customers" className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-navy">Customer Not Found</h1>
          </div>
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <p className="text-text-secondary mb-4">{error || 'Customer not found.'}</p>
            <Button variant="secondary" onClick={fetchCustomer} icon={<RefreshCw size={15} />}>Retry</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const firstName = customer.firstName || '';
  const lastName = customer.lastName || '';
  const fullName = customer.name || `${firstName} ${lastName}`.trim() || 'Unknown';
  const initials = fullName.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
  const status = customer.status || 'active';
  const orderCount = customer.orders ?? customer.orderCount ?? 0;
  const recentOrders = customer.recentOrders || [];

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
        <Badge variant={orderStatusColors[item.status as string] || 'default'} dot>
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
            <h1 className="text-2xl font-bold text-navy">{fullName}</h1>
            <p className="text-sm text-text-secondary mt-0.5">Customer since {formatDate(customer.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy text-2xl font-bold mx-auto">
                {initials}
              </div>
              <h2 className="text-lg font-bold text-navy mt-3">{fullName}</h2>
              <Badge variant={statusColors[status] || 'default'} dot size="md">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              {customer.tier && (
                <p className="text-xs text-text-muted mt-1.5">Tier: {customer.tier}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={15} className="text-text-muted" />
                <span className="text-text-secondary">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={15} className="text-text-muted" />
                  <span className="text-text-secondary">{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={15} className="text-text-muted mt-0.5" />
                  <span className="text-text-secondary">
                    {customer.address.street}<br />
                    {customer.address.city}, {customer.address.state}
                  </span>
                </div>
              )}
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
                <p className="text-2xl font-bold text-navy">{orderCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Total Spent</span>
                </div>
                <p className="text-2xl font-bold text-gold-dark">{formatCurrency(customer.totalSpent ?? 0)}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Last Active</span>
                </div>
                <p className="text-sm font-medium text-navy">{customer.lastActive ? formatDateTime(customer.lastActive) : 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-navy">Order History</h3>
              </div>
              <DataTable
                columns={orderColumns}
                data={recentOrders as unknown as Record<string, unknown>[]}
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
