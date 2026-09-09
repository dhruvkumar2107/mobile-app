'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { customersAPI } from '@/lib/api';
import { Customer } from '@/types';
import { Download, RefreshCw, MoreVertical } from 'lucide-react';

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  blocked: 'error',
};

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await customersAPI.getAll(params);
      const d = res.data;
      const data = d.data || d.customers || d;
      if (Array.isArray(data)) {
        setCustomers(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / PAGE_SIZE));
        setTotal(d.total || data.length);
      }
    } catch {
      setCustomers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [statusFilter, search]);

  const getCustomerName = (c: Customer) => {
    if (c.firstName || c.lastName) return `${c.firstName || ''} ${c.lastName || ''}`.trim();
    return c.name || 'Unknown';
  };

  const getOrderCount = (c: Customer) => c.orders ?? c.orderCount ?? 0;

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (item) => {
        const c = item as unknown as Customer;
        const name = getCustomerName(c);
        const initials = name.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy text-xs font-bold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-navy">{name}</p>
              <p className="text-xs text-text-muted">{c.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (item) => <span className="font-medium text-navy">{getOrderCount(item as unknown as Customer)}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (item) => <span className="font-semibold text-navy">{formatCurrency((item as unknown as Customer).totalSpent ?? 0)}</span>,
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      render: (item) => <span className="text-text-secondary text-xs">{formatDate((item as unknown as Customer).lastActive || '')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const status = (item as unknown as Customer).status || 'active';
        return (
          <Badge variant={statusColors[status] || 'default'} dot>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: () => (
        <button className="p-1 text-text-muted hover:text-navy rounded transition-colors">
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              Customers
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({total.toLocaleString('en-IN')} total)
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage your customer base</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={15} />} onClick={fetchCustomers}>
              Refresh
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={15} />}>Export</Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="w-80" />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
            className="w-36"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg animate-fade-in">
            <span className="text-sm text-accent font-medium">{selectedIds.length} customer(s) selected</span>
            <Button variant="secondary" size="sm">Send Email</Button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={customers as unknown as Record<string, unknown>[]}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onRowClick={(item) => window.location.href = `/customers/${item._id}`}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No customers found"
        />
      </div>
    </AdminLayout>
  );
}
