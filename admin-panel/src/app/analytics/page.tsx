'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { ChartCard, RevenueLineChart, CategoryPieChart, CustomerGrowthChart, ConversionFunnelChart } from '@/components/Charts';
import StatsCard from '@/components/StatsCard';
import { formatCurrency } from '@/lib/utils';
import { analyticsAPI } from '@/lib/api';
import { TrendingUp, Calendar, Download } from 'lucide-react';
import Button from '@/components/Button';

const fallbackRevenueData = [
  { date: 'Jan', revenue: 1200000 },
  { date: 'Feb', revenue: 1350000 },
  { date: 'Mar', revenue: 1500000 },
  { date: 'Apr', revenue: 1420000 },
  { date: 'May', revenue: 1680000 },
  { date: 'Jun', revenue: 1850000 },
  { date: 'Jul', revenue: 1750000 },
  { date: 'Aug', revenue: 1920000 },
  { date: 'Sep', revenue: 2100000 },
  { date: 'Oct', revenue: 2250000 },
  { date: 'Nov', revenue: 2400000 },
  { date: 'Dec', revenue: 2485420 },
];

const fallbackCategoryData = [
  { name: 'Watches', value: 35 },
  { name: 'Jewelry', value: 25 },
  { name: 'Bags', value: 20 },
  { name: 'Apparel', value: 12 },
  { name: 'Accessories', value: 8 },
];

const fallbackCustomerGrowthData = [
  { month: 'Jan', customers: 2800 },
  { month: 'Feb', customers: 3200 },
  { month: 'Mar', customers: 3800 },
  { month: 'Apr', customers: 4100 },
  { month: 'May', customers: 4600 },
  { month: 'Jun', customers: 5200 },
  { month: 'Jul', customers: 5800 },
  { month: 'Aug', customers: 6400 },
  { month: 'Sep', customers: 7100 },
  { month: 'Oct', customers: 7800 },
  { month: 'Nov', customers: 8400 },
  { month: 'Dec', customers: 9200 },
];

const fallbackFunnelData = [
  { stage: 'Visitors', value: 100000, fill: '#0F172A' },
  { stage: 'Product Views', value: 65000, fill: '#1E293B' },
  { stage: 'Add to Cart', value: 25000, fill: '#334155' },
  { stage: 'Checkout', value: 12000, fill: '#C9A961' },
  { stage: 'Purchase', value: 4820, fill: '#10B981' },
];

const fallbackTopProducts = [
  { name: 'Royal Chronograph Watch', sales: 342, revenue: 30619000 },
  { name: 'Diamond Pendant Set', sales: 289, revenue: 28900000 },
  { name: 'Italian Leather Bag', sales: 256, revenue: 25600000 },
  { name: 'Cashmere Blend Coat', sales: 198, revenue: 19800000 },
  { name: 'Pearl Earrings', sales: 176, revenue: 8800000 },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('year');
  const [revenueData, setRevenueData] = useState(fallbackRevenueData);
  const [categoryData, setCategoryData] = useState(fallbackCategoryData);
  const [customerGrowthData, setCustomerGrowthData] = useState(fallbackCustomerGrowthData);
  const [funnelData, setFunnelData] = useState(fallbackFunnelData);
  const [topProducts, setTopProducts] = useState(fallbackTopProducts);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [revenueRes, salesRes, customersRes, productsRes] = await Promise.allSettled([
        analyticsAPI.getRevenue({ period: dateRange }),
        analyticsAPI.getSales({ period: dateRange }),
        analyticsAPI.getCustomers({ period: dateRange }),
        analyticsAPI.getProducts({ period: dateRange }),
      ]);

      if (revenueRes.status === 'fulfilled') {
        const d = revenueRes.value.data;
        const data = d.data || d;
        if (Array.isArray(data) && data.length > 0) setRevenueData(data);
      }
      if (salesRes.status === 'fulfilled') {
        const d = salesRes.value.data;
        const data = d.data || d;
        if (Array.isArray(data) && data.length > 0) setCategoryData(data);
      }
      if (customersRes.status === 'fulfilled') {
        const d = customersRes.value.data;
        const data = d.data || d;
        if (Array.isArray(data) && data.length > 0) setCustomerGrowthData(data);
      }
      if (productsRes.status === 'fulfilled') {
        const d = productsRes.value.data;
        const data = d.data || d;
        if (Array.isArray(data) && data.length > 0) setTopProducts(data);
      }
    } catch {
      // Use fallback data
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">Analytics</h1>
            <p className="text-sm text-text-secondary mt-0.5">Business intelligence and performance insights</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              {['week', 'month', 'quarter', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === range ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" icon={<Download size={15} />}>Export</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Revenue" value="₹24,85,420" change={12.5} icon={<TrendingUp size={20} />} gold />
          <StatsCard title="Revenue Growth" value="+18.3%" change={3.2} icon={<TrendingUp size={20} />} />
          <StatsCard title="Avg Session" value="4m 32s" change={-1.8} icon={<Calendar size={20} />} />
          <StatsCard title="Conversion Rate" value="4.82%" change={0.5} icon={<TrendingUp size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Over Time">
            <RevenueLineChart data={revenueData} />
          </ChartCard>
          <ChartCard title="Sales by Category">
            <CategoryPieChart data={categoryData} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Customer Growth">
            <CustomerGrowthChart data={customerGrowthData} />
          </ChartCard>
          <ChartCard title="Conversion Funnel">
            <ConversionFunnelChart data={funnelData} />
          </ChartCard>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-navy text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{product.name}</p>
                  <p className="text-xs text-text-muted">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gold-dark">{formatCurrency(product.revenue)}</p>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${(product.sales / 342) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
