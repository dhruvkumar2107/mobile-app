'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { returnsAPI } from '@/lib/api';
import { ReturnRequest, Order } from '@/types';
import { RotateCcw, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'error',
  completed: 'success',
  processing: 'info',
};

interface EnrichedReturn extends ReturnRequest {
  customerName?: string;
  order?: Order | string;
}

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<EnrichedReturn[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<EnrichedReturn | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageSize = 10;

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await returnsAPI.getAll(params);
      const data = res.data?.data;
      setReturns(data?.data || data || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch returns:', err);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await returnsAPI.updateStatus(id, 'approved');
      await fetchReturns();
    } catch (err) {
      console.error('Failed to approve return:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await returnsAPI.updateStatus(id, 'rejected');
      await fetchReturns();
    } catch (err) {
      console.error('Failed to reject return:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReturns = returns.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const orderId = typeof r.orderId === 'string' ? r.orderId : '';
    return (
      orderId.toLowerCase().includes(q) ||
      (r.customerName || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    );
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'orderId',
      label: 'Order',
      render: (item) => {
        const orderId = (item.orderId as string) || '';
        return <span className="font-semibold text-accent">#{orderId.slice(0, 8)}</span>;
      },
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (item) => <span className="text-navy">{(item.customerName as string) || 'Unknown'}</span>,
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (item) => <span className="text-text-secondary truncate max-w-[200px] block">{(item.reason as string) || 'No reason provided'}</span>,
    },
    {
      key: 'refundAmount',
      label: 'Refund',
      render: (item) => (
        <span className="font-semibold text-navy">
          {item.refundAmount != null ? formatCurrency(item.refundAmount as number) : '—'}
        </span>
      ),
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
      render: (item) => <span className="text-text-secondary text-xs">{formatDate(item.createdAt as string)}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (item) => {
        const ret = item as unknown as EnrichedReturn;
        const isProcessing = actionLoading === ret._id;
        return (
          <div className="flex items-center gap-1">
            {ret.status === 'pending' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleApprove(ret._id); }}
                  disabled={isProcessing}
                  className="p-1.5 text-text-muted hover:text-success hover:bg-success-bg rounded transition-colors disabled:opacity-50"
                  title="Approve"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReject(ret._id); }}
                  disabled={isProcessing}
                  className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg rounded transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReturn(ret);
                setShowDetailModal(true);
              }}
              className="p-1.5 text-text-muted hover:text-accent hover:bg-info-bg rounded transition-colors"
              title="View"
            >
              <Eye size={14} />
            </button>
          </div>
        );
      },
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
          data={filteredReturns as unknown as Record<string, unknown>[]}
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
                  <p className="text-sm font-semibold text-accent">#{(selectedReturn.orderId as string || '').slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Status</p>
                  <Badge variant={statusColors[selectedReturn.status]} dot>{selectedReturn.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Customer</p>
                  <p className="text-sm text-navy">{selectedReturn.customerName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Refund Amount</p>
                  <p className="text-sm font-semibold text-navy">
                    {selectedReturn.refundAmount != null ? formatCurrency(selectedReturn.refundAmount) : '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Reason</p>
                <p className="text-sm text-navy bg-gray-50 p-3 rounded-lg">{selectedReturn.reason || 'No reason provided'}</p>
              </div>
              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Items</p>
                  <div className="space-y-1">
                    {selectedReturn.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-navy">{item.name || 'Product'}</span>
                        <span className="text-text-secondary">Qty: {item.quantity} — {item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedReturn.adminNote && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Admin Note</p>
                  <p className="text-sm text-navy bg-gray-50 p-3 rounded-lg">{selectedReturn.adminNote}</p>
                </div>
              )}
              {selectedReturn.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle size={15} />}
                    onClick={() => { handleReject(selectedReturn._id); setShowDetailModal(false); }}
                    disabled={actionLoading === selectedReturn._id}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle size={15} />}
                    onClick={() => { handleApprove(selectedReturn._id); setShowDetailModal(false); }}
                    disabled={actionLoading === selectedReturn._id}
                  >
                    Approve Return
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
