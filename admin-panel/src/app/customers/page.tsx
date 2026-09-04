'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, MoreVertical } from 'lucide-react';

const mockCustomers = Array.from({ length: 60 }, (_, i) => ({
  _id: String(i + 1),
  firstName: ['Arjun', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Ananya', 'Karan', 'Meera', 'Sanjay', 'Divya', 'Amit', 'Pooja'][i % 12],
  lastName: ['Mehta', 'Sharma', 'Gupta', 'Patel', 'Singh', 'Reddy', 'Joshi', 'Nair', 'Kumar', 'Verma', 'Rao', 'Desai'][i % 12],
  email: `customer${i + 1}@email.com`,
  phone: `+91 ${Math.floor(7000000000 + Math.random() * 3000000000)}`,
  orders: Math.floor(Math.random() * 25) + 1,
  totalSpent: Math.floor(Math.random() * 500000) + 5000,
  lastActive: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  status: ['active', 'active', 'active', 'inactive', 'blocked'][i % 5] as string,
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 365).toISOString(),
}));

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  blocked: 'error',
};

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pageSize = 10;

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filteredCustomers = mockCustomers.filter((c) => {
    const matchSearch = search === '' ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (item) => {
        const firstName = item.firstName as string;
        const lastName = item.lastName as string;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy text-xs font-bold">
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-navy">{firstName} {lastName}</p>
              <p className="text-xs text-text-muted">{item.email as string}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (item) => <span className="font-medium text-navy">{item.orders as number}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (item) => <span className="font-semibold text-navy">{formatCurrency(item.totalSpent as number)}</span>,
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      render: (item) => <span className="text-text-secondary text-xs">{formatDate(item.lastActive as string)}</span>,
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
            <h1 className="text-2xl font-bold text-navy">Customers</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage your customer base</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={15} />}>Export</Button>
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
            <Button variant="danger" size="sm">Block Selected</Button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={paginatedCustomers}
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
