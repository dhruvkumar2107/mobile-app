'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#0F172A', '#C9A961', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({ title, children, className, actions }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-border p-5 ${className || ''}`} role="figure" aria-label={title}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

interface RevenueLineChartProps {
  data: { date: string; revenue: number }[];
  height?: number;
}

export function RevenueLineChart({ data, height = 280 }: RevenueLineChartProps) {
  return (
    <div role="img" aria-label="Revenue line chart showing daily revenue trends">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A961" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A961" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            aria-label="Revenue tooltip"
          />
          <Area type="monotone" dataKey="revenue" stroke="#C9A961" strokeWidth={2.5} fill="url(#revenueGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface OrdersBarChartProps {
  data: { date: string; orders: number }[];
  height?: number;
}

export function OrdersBarChart({ data, height = 280 }: OrdersBarChartProps) {
  return (
    <div role="img" aria-label="Orders bar chart showing daily order counts">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            formatter={(value) => [Number(value), 'Orders']}
            aria-label="Orders tooltip"
          />
          <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CategoryPieChartProps {
  data: { name: string; value: number }[];
  height?: number;
}

export function CategoryPieChart({ data, height = 280 }: CategoryPieChartProps) {
  return (
    <div role="img" aria-label="Category pie chart showing sales distribution by category">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            formatter={(value) => [`${Number(value)}%`, 'Share']}
            aria-label="Category share tooltip"
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ConversionFunnelProps {
  data: { stage: string; value: number; fill: string }[];
  height?: number;
}

export function ConversionFunnelChart({ data, height = 300 }: ConversionFunnelProps) {
  return (
    <div role="img" aria-label="Conversion funnel chart showing conversion stages">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            aria-label="Funnel tooltip"
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CustomerGrowthChartProps {
  data: { month: string; customers: number }[];
  height?: number;
}

export function CustomerGrowthChart({ data, height = 280 }: CustomerGrowthChartProps) {
  return (
    <div role="img" aria-label="Customer growth chart showing monthly new customer registrations">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="customerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            formatter={(value) => [Number(value).toLocaleString(), 'Customers']}
            aria-label="Customer growth tooltip"
          />
          <Area type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2.5} fill="url(#customerGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
