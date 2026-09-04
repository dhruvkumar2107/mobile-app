'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RotateCcw, CheckCircle, XCircle, Eye } from 'lucide-react';

const mockReturns = Array.from({ length: 15 }, (_, i) => ({
  _id: String(i + 1),
  orderNumber: `ORD-${28400 + i}`,
  customer: {
    firstName: ['Arjun', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Ananya'][i % 6],
    lastName: ['Mehta', 'Sharma', 'Gupta', 'Patel', 'Singh', 'Reddy'][i % 6],
  },
  items: [
    { product: 'Royal Chronograph Watch', quantity: 1, reason: 'Defective product' },
  ],
  status: ['pending', 'approved', 'rejected', 'completed'][i % 4] as string,
  refundAmount: Math.floor(Math.random() * 50000) + 5000,
  reason: ['Defective product', 'Wrong size', 'Not as described', 'Changed mind', 'Damaged in transit'][i % 5],
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  completed: 'success',
};

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<typeof mockReturns[0] | null>(null);
  const pageSize = 10;

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  const filteredReturns = mockReturns.filter((r) => {
    const matchSearch = search === '' ||
      r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      `${r.customer.firstName} ${r.customer.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredReturns.length / pageSize);
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'orderNumber',
      label: 'Order',
      render: (item) => <span className="font-semibold text-accent">{item.orderNumber as string}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (item) => {
        const c = item.customer as Record<string, unknown>;
        return <span className="text-navy">{c.firstName as string} {c.lastName as string}</span>;
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (item) => <span className="text-text-secondary truncate max-w-[200px] block">{item.reason as string}</span>,
    },
    {
      key: 'refundAmount',
      label: 'Refund',
      render: (item) => <span className="font-semibold text-navy">{formatCurrency(item.refundAmount as number)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={statusColors[item.status as string]} dot>
          {(item.status as string).charAt(0).toUpperCase() + (item.status as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item) => <span className="text-text-secondary text-xs">{formatDate(item.createdAt as string)}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (item) => (
        <div className="flex items-center gap-1">
          {(item.status as string) === 'pending' && (
            <>
              <button className="p-1.5 text-text-muted hover:text-success hover:bg-success-bg rounded transition-colors" title="Approve">
                <CheckCircle size={14} />
              </button>
              <button className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg rounded transition-colors" title="Reject">
                <XCircle size={14} />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReturn(item as unknown as typeof mockReturns[0]);
              setShowDetailModal(true);
            }}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-info-bg rounded transition-colors"
            title="View"
          >
            <Eye size={14} />
          </button>
        </div>
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
        <div>
          <h1 className="text-2xl font-bold text-navy">Returns</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage return and refund requests</p>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search returns..." className="w-80" />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'completed', label: 'Completed' },
            ]}
            className="w-36"
          />
        </div>

        <DataTable
          columns={columns}
          data={paginatedReturns}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No return requests found"
        />

        {/* Detail Modal */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Return Details" size="md">
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted">Order</p>
                  <p className="text-sm font-semibold text-navy">{selectedReturn.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Status</p>
                  <Badge variant={statusColors[selectedReturn.status]} dot>{selectedReturn.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Customer</p>
                  <p className="text-sm text-navy">{selectedReturn.customer.firstName} {selectedReturn.customer.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Refund Amount</p>
                  <p className="text-sm font-semibold text-navy">{formatCurrency(selectedReturn.refundAmount)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Reason</p>
                <p className="text-sm text-navy bg-gray-50 p-3 rounded-lg">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="danger" size="sm" icon={<XCircle size={15} />}>Reject</Button>
                  <Button variant="primary" size="sm" icon={<CheckCircle size={15} />}>Approve Return</Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
