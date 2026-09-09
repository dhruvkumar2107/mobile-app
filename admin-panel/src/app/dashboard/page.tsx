'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import StatsCard from '@/components/StatsCard';
import { ChartCard, RevenueLineChart, OrdersBarChart, CategoryPieChart } from '@/components/Charts';
import DataTable, { Column } from '@/components/DataTable';
import ActivityFeed from '@/components/ActivityFeed';
import Badge from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { dashboardAPI, ordersAPI, analyticsAPI } from '@/lib/api';
import type { ActivityItem } from '@/types';
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
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [ordersData, setOrdersData] = useState<{ date: string; orders: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [dateRange, setDateRange] = useState('30d');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, revenueRes, salesRes, categoriesRes] = await Promise.allSettled([
        dashboardAPI.getStats(),
        ordersAPI.getAll({ limit: 8, page: 1 }),
        analyticsAPI.getRevenue({ period: dateRange }),
        analyticsAPI.getSales({ period: dateRange }),
        analyticsAPI.getCategories({ period: dateRange }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        const data = d.data || d;
        setStats({
          totalRevenue: data.totalRevenue ?? 0,
          totalOrders: data.totalOrders ?? 0,
          totalCustomers: data.totalCustomers ?? 0,
          totalProducts: data.totalProducts ?? 0,
          conversionRate: data.conversionRate ?? 0,
          averageOrderValue: data.averageOrderValue ?? 0,
          pendingOrders: data.pendingOrders ?? 0,
          lowStockCount: data.lowStockCount ?? 0,
        });
      }

      if (ordersRes.status === 'fulfilled') {
        const d = ordersRes.value.data;
        const orders = d.data || d.orders || d;
        if (Array.isArray(orders) && orders.length > 0) {
          setRecentOrders(orders);

          const feed: ActivityItem[] = orders.slice(0, 7).map((order: any, i: number) => {
            const name = order.customer?.firstName
              ? `${order.customer.firstName} ${order.customer.lastName || ''}`.trim()
              : 'Guest';
            return {
              id: order._id || String(i),
              type: 'order' as const,
              message: `Order #${order.orderNumber} - ${formatCurrency(order.total)} (${order.status})`,
              time: order.createdAt,
              user: name,
            };
          });
          setActivity(feed);
        }
      }

      if (revenueRes.status === 'fulfilled') {
        const d = revenueRes.value.data;
        const items = d.data || d.revenue || d;
        if (Array.isArray(items) && items.length > 0) {
          setRevenueData(items.map((r: any) => ({
            date: r.date || r._id || r.label,
            revenue: r.revenue ?? r.total ?? r.value ?? 0,
          })));
        }
      }

      if (salesRes.status === 'fulfilled') {
        const d = salesRes.value.data;
        const items = d.data || d.sales || d;
        if (Array.isArray(items) && items.length > 0) {
          setOrdersData(items.map((s: any) => ({
            date: s.date || s._id || s.label,
            orders: s.orders ?? s.count ?? s.value ?? 0,
          })));
        }
      }

      if (categoriesRes.status === 'fulfilled') {
        const d = categoriesRes.value.data;
        const items = d.data || d.categories || d;
        if (Array.isArray(items) && items.length > 0) {
          setCategoryData(items.map((c: any) => ({
            name: c.name || c._id || c.category || 'Unknown',
            value: c.value ?? c.count ?? c.percentage ?? 0,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const displayStats: DashboardStats = stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    lowStockCount: 0,
  };

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
            <CategoryPieChart data={categoryData} />
          </ChartCard>
        </div>

        {/* Orders Chart */}
        <ChartCard title="Orders This Week" actions={
          <select className="text-xs border border-border rounded-lg px-2 py-1 text-text-secondary bg-white" aria-label="Orders time period">
            <option>This Week</option>
            <option>Last Week</option>
          </select>
        }>
          <OrdersBarChart data={ordersData} />
        </ChartCard>

        {/* Recent Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-navy mb-3">Recent Orders</h2>
            <DataTable
              columns={orderColumns}
              data={recentOrders}
              onRowClick={(item) => window.location.href = `/orders/${item._id}`}
              emptyMessage="No recent orders"
            />
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-navy mb-4">Live Activity</h2>
            <ActivityFeed activities={activity} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
