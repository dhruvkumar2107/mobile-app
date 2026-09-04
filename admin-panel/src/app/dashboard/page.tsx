'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatsCard from '@/components/StatsCard';
import { ChartCard, RevenueLineChart, OrdersBarChart, CategoryPieChart } from '@/components/Charts';
import DataTable, { Column } from '@/components/DataTable';
import ActivityFeed from '@/components/ActivityFeed';
import Badge from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { dashboardAPI, ordersAPI } from '@/lib/api';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const mockRevenueData = [
  { date: '01', revenue: 45000 },
  { date: '02', revenue: 52000 },
  { date: '03', revenue: 48000 },
  { date: '04', revenue: 61000 },
  { date: '05', revenue: 55000 },
  { date: '06', revenue: 67000 },
  { date: '07', revenue: 72000 },
  { date: '08', revenue: 69000 },
  { date: '09', revenue: 78000 },
  { date: '10', revenue: 85000 },
  { date: '11', revenue: 82000 },
  { date: '12', revenue: 91000 },
  { date: '13', revenue: 88000 },
  { date: '14', revenue: 95000 },
  { date: '15', revenue: 92000 },
  { date: '16', revenue: 98000 },
  { date: '17', revenue: 105000 },
  { date: '18', revenue: 102000 },
  { date: '19', revenue: 110000 },
  { date: '20', revenue: 115000 },
  { date: '21', revenue: 108000 },
  { date: '22', revenue: 118000 },
  { date: '23', revenue: 125000 },
  { date: '24', revenue: 120000 },
  { date: '25', revenue: 132000 },
  { date: '26', revenue: 128000 },
  { date: '27', revenue: 135000 },
  { date: '28', revenue: 140000 },
  { date: '29', revenue: 138000 },
  { date: '30', revenue: 145000 },
];

const mockOrdersData = [
  { date: 'Mon', orders: 145 },
  { date: 'Tue', orders: 168 },
  { date: 'Wed', orders: 152 },
  { date: 'Thu', orders: 189 },
  { date: 'Fri', orders: 201 },
  { date: 'Sat', orders: 234 },
  { date: 'Sun', orders: 178 },
];

const mockCategoryData = [
  { name: 'Watches', value: 35 },
  { name: 'Jewelry', value: 25 },
  { name: 'Bags', value: 20 },
  { name: 'Apparel', value: 12 },
  { name: 'Accessories', value: 8 },
];

const mockRecentOrders = [
  { _id: '1', orderNumber: 'ORD-28491', customer: { firstName: 'Arjun', lastName: 'Mehta' } as Record<string, unknown>, items: [{ quantity: 2 } as Record<string, unknown>], total: 45999, status: 'delivered' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '2', orderNumber: 'ORD-28490', customer: { firstName: 'Priya', lastName: 'Sharma' } as Record<string, unknown>, items: [{ quantity: 1 } as Record<string, unknown>], total: 89500, status: 'shipped' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: '3', orderNumber: 'ORD-28489', customer: { firstName: 'Rahul', lastName: 'Gupta' } as Record<string, unknown>, items: [{ quantity: 3 } as Record<string, unknown>], total: 125000, status: 'processing' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { _id: '4', orderNumber: 'ORD-28488', customer: { firstName: 'Neha', lastName: 'Patel' } as Record<string, unknown>, items: [{ quantity: 1 } as Record<string, unknown>], total: 32500, status: 'pending' as const, paymentStatus: 'pending' as const, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { _id: '5', orderNumber: 'ORD-28487', customer: { firstName: 'Vikram', lastName: 'Singh' } as Record<string, unknown>, items: [{ quantity: 2 } as Record<string, unknown>], total: 67800, status: 'confirmed' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 18000000).toISOString() },
  { _id: '6', orderNumber: 'ORD-28486', customer: { firstName: 'Ananya', lastName: 'Reddy' } as Record<string, unknown>, items: [{ quantity: 1 } as Record<string, unknown>], total: 245000, status: 'delivered' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 21600000).toISOString() },
  { _id: '7', orderNumber: 'ORD-28485', customer: { firstName: 'Karan', lastName: 'Joshi' } as Record<string, unknown>, items: [{ quantity: 4 } as Record<string, unknown>], total: 18500, status: 'cancelled' as const, paymentStatus: 'refunded' as const, createdAt: new Date(Date.now() - 25200000).toISOString() },
  { _id: '8', orderNumber: 'ORD-28484', customer: { firstName: 'Meera', lastName: 'Nair' } as Record<string, unknown>, items: [{ quantity: 1 } as Record<string, unknown>], total: 56000, status: 'shipped' as const, paymentStatus: 'paid' as const, createdAt: new Date(Date.now() - 28800000).toISOString() },
];

const mockLowStockProducts = [
  { _id: 'ls1', name: 'Royal Chronograph Watch', stock: 3, category: 'Watches' },
  { _id: 'ls2', name: 'Diamond Pendant Set', stock: 5, category: 'Jewelry' },
  { _id: 'ls3', name: 'Italian Leather Bag', stock: 7, category: 'Bags' },
  { _id: 'ls4', name: 'Pearl Earrings', stock: 2, category: 'Jewelry' },
];

const mockActivity = [
  { id: '1', type: 'order' as const, message: 'New order #ORD-28491 received from Arjun Mehta', time: new Date(Date.now() - 300000).toISOString(), user: 'Arjun Mehta' },
  { id: '2', type: 'customer' as const, message: 'New customer Sneha Iyer registered', time: new Date(Date.now() - 600000).toISOString(), user: 'Sneha Iyer' },
  { id: '3', type: 'order' as const, message: 'Order #ORD-28490 marked as shipped', time: new Date(Date.now() - 900000).toISOString(), user: 'System' },
  { id: '4', type: 'review' as const, message: 'New 5-star review on Royal Chronograph Watch', time: new Date(Date.now() - 1200000).toISOString(), user: 'Priya Sharma' },
  { id: '5', type: 'product' as const, message: 'Product "Diamond Pendant Set" stock updated', time: new Date(Date.now() - 1500000).toISOString(), user: 'System' },
  { id: '6', type: 'order' as const, message: 'Payment of ₹89,500 received for order #ORD-28490', time: new Date(Date.now() - 1800000).toISOString(), user: 'System' },
  { id: '7', type: 'system' as const, message: 'Daily backup completed successfully', time: new Date(Date.now() - 2100000).toISOString(), user: 'System' },
];

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gold' | 'default'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'gold',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
  returned: 'warning',
  refunded: 'default',
};

const dateRanges = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '3m', label: '3 Months' },
  { id: '1y', label: '1 Year' },
];

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  conversionRate: number;
  averageOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Record<string, unknown>[]>([]);
  const [revenueData, setRevenueData] = useState(mockRevenueData);
  const [dateRange, setDateRange] = useState('30d');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        ordersAPI.getAll({ limit: 8, page: 1 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        const data = d.data || d;
        setStats({
          totalRevenue: data.totalRevenue || data.totalRevenue === 0 ? data.totalRevenue : 2485420,
          totalOrders: data.totalOrders || data.totalOrders === 0 ? data.totalOrders : 12482,
          totalCustomers: data.totalCustomers || data.totalCustomers === 0 ? data.totalCustomers : 48291,
          totalProducts: data.totalProducts || data.totalProducts === 0 ? data.totalProducts : 18420,
          conversionRate: data.conversionRate || 4.82,
          averageOrderValue: data.averageOrderValue || 1984,
          pendingOrders: 23,
          lowStockCount: 4,
        });
      }

      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value.data;
        const orders = d.data || d.orders || d;
        if (Array.isArray(orders) && orders.length > 0) {
          setRecentOrders(orders);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const displayStats = stats || {
    totalRevenue: 2485420,
    totalOrders: 12482,
    totalCustomers: 48291,
    totalProducts: 18420,
    conversionRate: 4.82,
    averageOrderValue: 1984,
    pendingOrders: 23,
    lowStockCount: 4,
  };

  const displayOrders = recentOrders.length > 0 ? recentOrders : mockRecentOrders;

  const orderColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'orderNumber',
      label: 'Order',
      render: (item) => <span className="font-semibold text-navy">{item.orderNumber as string}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (item) => {
        const c = item.customer as Record<string, unknown>;
        if (c && c.firstName) {
          return <span className="text-navy">{c.firstName as string} {c.lastName as string}</span>;
        }
        return <span className="text-navy">Guest</span>;
      },
    },
    {
      key: 'items',
      label: 'Items',
      render: (item) => {
        const items = item.items as Record<string, unknown>[];
        return <span className="text-text-secondary">{items?.length || 0} item(s)</span>;
      },
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
        <Badge variant={statusColors[item.status as string] || 'default'} dot>
          {(item.status as string).charAt(0).toUpperCase() + (item.status as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item) => <span className="text-text-secondary">{formatDate(item.createdAt as string)}</span>,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-0.5">Welcome back. Here&apos;s your business overview.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Range Selector */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden" role="group" aria-label="Date range">
              {dateRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === range.id
                      ? 'bg-navy text-white'
                      : 'bg-white text-text-secondary hover:bg-gray-50'
                  }`}
                  aria-pressed={dateRange === range.id}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatsCard title="Total Revenue" value={formatCurrency(displayStats.totalRevenue)} change={12.5} icon={<DollarSign size={20} />} gold />
          <StatsCard title="Orders" value={displayStats.totalOrders.toLocaleString('en-IN')} change={8.3} icon={<ShoppingCart size={20} />} />
          <StatsCard title="Customers" value={displayStats.totalCustomers.toLocaleString('en-IN')} change={15.2} icon={<Users size={20} />} />
          <StatsCard title="Products" value={displayStats.totalProducts.toLocaleString('en-IN')} change={3.1} icon={<Package size={20} />} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Conversion" value={`${displayStats.conversionRate}%`} change={0.5} icon={<TrendingUp size={20} />} />
          <StatsCard title="Avg Order Value" value={formatCurrency(displayStats.averageOrderValue)} change={-2.1} icon={<ArrowUpRight size={20} />} />
          <StatsCard title="Pending Orders" value={String(displayStats.pendingOrders)} icon={<Clock size={20} />} subtitle="Awaiting processing" />
          <StatsCard title="Low Stock Alert" value={String(displayStats.lowStockCount)} icon={<AlertTriangle size={20} />} subtitle="Items below threshold" className="border-warning/20" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Revenue Overview" className="lg:col-span-2" actions={
            <select className="text-xs border border-border rounded-lg px-2 py-1 text-text-secondary bg-white" aria-label="Revenue time period">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          }>
            <RevenueLineChart data={revenueData} />
          </ChartCard>
          <ChartCard title="Category Performance">
            <CategoryPieChart data={mockCategoryData} />
          </ChartCard>
        </div>

        {/* Orders Chart */}
        <ChartCard title="Orders This Week" actions={
          <select className="text-xs border border-border rounded-lg px-2 py-1 text-text-secondary bg-white" aria-label="Orders time period">
            <option>This Week</option>
            <option>Last Week</option>
          </select>
        }>
          <OrdersBarChart data={mockOrdersData} />
        </ChartCard>

        {/* Recent Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-navy mb-3">Recent Orders</h2>
            <DataTable
              columns={orderColumns}
              data={displayOrders}
              onRowClick={(item) => window.location.href = `/orders/${item._id}`}
              emptyMessage="No recent orders"
            />
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-navy mb-4">Live Activity</h2>
            <ActivityFeed activities={mockActivity} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
