'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Tabs from '@/components/Tabs';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import StatsCard from '@/components/StatsCard';
import api from '@/lib/api';
import { FileText, Download, ChevronDown, ChevronUp, Filter, Calendar } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy: { _id: string; name: string; email: string } | string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const mockAuditLogs: AuditLog[] = Array.from({ length: 50 }, (_, i) => ({
  _id: String(i + 1),
  action: ['create', 'update', 'delete', 'login', 'export', 'bulk_update'][i % 6],
  entityType: ['product', 'order', 'customer', 'inventory', 'coupon', 'settings', 'campaign'][i % 7],
  entityId: String(Math.floor(Math.random() * 999) + 1),
  entityName: ['Royal Chronograph Watch', 'Order #1042', 'John Smith', 'SKU-00123', 'WELCOME20', 'Site Settings', 'Summer Sale'][i % 7],
  performedBy: { _id: '1', name: ['Admin User', 'Manager', 'Support Agent'][i % 3], email: ['admin@luxe.com', 'manager@luxe.com', 'support@luxe.com'][i % 3] },
  changes: i % 4 === 0 ? {
    name: { old: 'Old Product Name', new: 'New Product Name' },
    price: { old: 1999, new: 2499 },
    stock: { old: 45, new: 30 },
  } : undefined,
  details: i % 6 === 0 ? 'Bulk inventory update across 12 SKUs' : i % 5 === 0 ? 'Failed login attempt from unknown IP' : undefined,
  ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  userAgent: 'Mozilla/5.0',
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
}));

const actionColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gold' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  login: 'gold',
  export: 'default',
  bulk_update: 'warning',
};

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  login: 'Login',
  export: 'Exported',
  bulk_update: 'Bulk Update',
};

const entityTypeLabels: Record<string, string> = {
  product: 'Product',
  order: 'Order',
  customer: 'Customer',
  inventory: 'Inventory',
  coupon: 'Coupon',
  settings: 'Settings',
  campaign: 'Campaign',
};

const actionTabs = [
  { id: '', label: 'All Actions' },
  { id: 'create', label: 'Created' },
  { id: 'update', label: 'Updated' },
  { id: 'delete', label: 'Deleted' },
  { id: 'login', label: 'Logins' },
  { id: 'bulk_update', label: 'Bulk Updates' },
];

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      const res = await api.get('/admin/audit-logs', { params });
      const d = res.data;
      const data = d.data || d.logs || d;
      if (Array.isArray(data)) {
        setLogs(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / pageSize));
      } else {
        setLogs(mockAuditLogs);
        setTotalPages(Math.ceil(mockAuditLogs.length / pageSize));
      }
    } catch {
      setLogs(mockAuditLogs);
      setTotalPages(Math.ceil(mockAuditLogs.length / pageSize));
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const displayLogs = logs.length > 0 ? logs : mockAuditLogs;
  const filteredLogs = displayLogs.filter((log) => {
    const entityName = log.entityName || '';
    const performedByName = typeof log.performedBy === 'object' ? log.performedBy?.name : log.performedBy;
    const matchSearch = search === '' ||
      entityName.toLowerCase().includes(search.toLowerCase()) ||
      performedByName?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === '' || log.action === actionFilter;
    const matchEntity = entityFilter === '' || log.entityType === entityFilter;
    let matchDate = true;
    if (dateFrom) {
      matchDate = matchDate && new Date(log.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchDate = matchDate && new Date(log.createdAt) <= new Date(dateTo + 'T23:59:59');
    }
    return matchSearch && matchAction && matchEntity && matchDate;
  });

  const totalActions = filteredLogs.length;
  const createCount = filteredLogs.filter((l) => l.action === 'create').length;
  const updateCount = filteredLogs.filter((l) => l.action === 'update').length;
  const deleteCount = filteredLogs.filter((l) => l.action === 'delete').length;

  const displayTotalPages = logs.length > 0 ? totalPages : Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = logs.length > 0 ? filteredLogs : filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatJsonDiff = (changes: Record<string, { old: unknown; new: unknown }>) => {
    return Object.entries(changes).map(([key, value]) => ({
      field: key,
      oldValue: value.old,
      newValue: value.new,
    }));
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Action', 'Entity Type', 'Entity', 'Performed By', 'Details'].join(','),
      ...filteredLogs.map((log) => [
        formatDate(log.createdAt),
        log.action,
        log.entityType,
        log.entityName,
        typeof log.performedBy === 'object' ? log.performedBy?.name : log.performedBy,
        log.details || '',
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      label: 'Action',
      render: (item) => (
        <Badge variant={actionColors[item.action] || 'default'} dot>
          {actionLabels[item.action] || item.action}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-navy">{entityTypeLabels[item.entityType] || item.entityType}</p>
          <p className="text-xs text-text-muted">ID: {item.entityId}</p>
        </div>
      ),
    },
    {
      key: 'entityName',
      label: 'Details',
      render: (item) => (
        <div>
          <p className="text-sm text-navy font-medium">{item.entityName || 'N/A'}</p>
          {item.details && (
            <p className="text-xs text-text-muted mt-0.5 max-w-[200px] truncate">{item.details}</p>
          )}
        </div>
      ),
    },
    {
      key: 'performedBy',
      label: 'Performed By',
      render: (item) => {
        const user = item.performedBy;
        const name = typeof user === 'object' ? user?.name : user;
        return <span className="text-sm text-text-secondary">{name || 'System'}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (item) => (
        <span className="text-sm text-text-secondary whitespace-nowrap">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (item) => {
        const logId = item._id;
        const hasChanges = item.changes && Object.keys(item.changes).length > 0;
        if (!hasChanges) return <span className="text-xs text-text-muted">-</span>;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedRow(expandedRow === logId ? null : logId);
            }}
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium"
          >
            {expandedRow === logId ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {Object.keys(item.changes!).length} field{Object.keys(item.changes!).length !== 1 ? 's' : ''}
          </button>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: (item) => <span className="text-xs text-text-muted font-mono">{item.ipAddress || '-'}</span>,
    },
  ];

  const openDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

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
            <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
            <p className="text-sm text-text-secondary mt-0.5">Track all admin actions and system changes</p>
          </div>
          <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Actions" value={String(totalActions)} icon={<FileText size={20} />} />
          <StatsCard title="Created" value={String(createCount)} icon={<FileText size={20} />} gold />
          <StatsCard title="Updated" value={String(updateCount)} icon={<FileText size={20} />} />
          <StatsCard title="Deleted" value={String(deleteCount)} icon={<FileText size={20} />} />
        </div>

        <Tabs
          tabs={actionTabs}
          activeTab={actionFilter}
          onChange={(id) => { setActionFilter(id); setCurrentPage(1); }}
        />

        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search logs by entity, user, action..."
            className="flex-1 max-w-md"
          />
          <Select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Entity Types' },
              { value: 'product', label: 'Products' },
              { value: 'order', label: 'Orders' },
              { value: 'customer', label: 'Customers' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'coupon', label: 'Coupons' },
              { value: 'settings', label: 'Settings' },
              { value: 'campaign', label: 'Campaigns' },
            ]}
            className="w-44"
          />
          <Button
            variant={showFilters ? 'primary' : 'ghost'}
            size="sm"
            icon={<Filter size={14} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Date Filter
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-border">
            <Calendar size={16} className="text-text-muted" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                className="text-xs text-accent hover:text-accent/80 font-medium"
              >
                Clear dates
              </button>
            )}
          </div>
        )}

        <div className="space-y-0">
          <DataTable
            columns={columns}
            data={paginatedLogs as unknown as AuditLog[]}
            currentPage={currentPage}
            totalPages={displayTotalPages}
            onPageChange={setCurrentPage}
            emptyMessage="No audit logs found"
            onRowClick={(item) => openDetail(item as unknown as AuditLog)}
          />
          {expandedRow && (
            <div className="bg-white rounded-xl border border-border border-t-0 -mt-px">
              <table className="w-full">
                <tbody>
                  {paginatedLogs
                    .filter((log) => log._id === expandedRow && log.changes)
                    .map((log) => {
                      const diffItems = formatJsonDiff(log.changes!);
                      return (
                        <tr key={`expanded-${log._id}`}>
                          <td className="px-6 py-4 bg-gray-50/50">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-navy uppercase tracking-wider">Changes for {log.entityType}: {log.entityName}</p>
                              <div className="bg-white rounded-lg border border-border p-4">
                                <div className="space-y-3">
                                  {diffItems.map((diff) => (
                                    <div key={diff.field} className="flex items-center gap-3 text-sm">
                                      <span className="font-mono font-medium text-navy min-w-[100px] bg-gray-50 px-2 py-1 rounded">{diff.field}</span>
                                      <span className="text-error bg-error-bg px-2 py-0.5 rounded text-xs font-mono line-through">
                                        {JSON.stringify(diff.oldValue)}
                                      </span>
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted shrink-0">
                                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <span className="text-success bg-success-bg px-2 py-0.5 rounded text-xs font-mono">
                                        {JSON.stringify(diff.newValue)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Audit Log Details" size="lg">
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Action</p>
                  <Badge variant={actionColors[selectedLog.action] || 'default'} size="md" dot>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Entity Type</p>
                  <p className="text-sm font-medium text-navy">{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Entity Name</p>
                  <p className="text-sm text-navy">{selectedLog.entityName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Entity ID</p>
                  <p className="text-sm text-text-secondary font-mono">{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Performed By</p>
                  <p className="text-sm text-navy">
                    {typeof selectedLog.performedBy === 'object' ? selectedLog.performedBy?.name : selectedLog.performedBy}
                  </p>
                  {typeof selectedLog.performedBy === 'object' && selectedLog.performedBy?.email && (
                    <p className="text-xs text-text-muted">{selectedLog.performedBy.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-sm text-text-secondary">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">IP Address</p>
                  <p className="text-sm text-text-secondary font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Details</p>
                  <p className="text-sm text-navy">{selectedLog.details}</p>
                </div>
              )}

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Changes</p>
                  <div className="bg-gray-50 rounded-lg border border-border p-4">
                    <div className="space-y-3">
                      {formatJsonDiff(selectedLog.changes).map((diff) => (
                        <div key={diff.field} className="flex items-center gap-3 text-sm">
                          <span className="font-mono font-medium text-navy min-w-[120px] bg-white px-2 py-1 rounded border border-border">{diff.field}</span>
                          <span className="text-error bg-error-bg px-2 py-0.5 rounded text-xs font-mono line-through">
                            {JSON.stringify(diff.oldValue)}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-muted shrink-0">
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-success bg-success-bg px-2 py-0.5 rounded text-xs font-mono">
                            {JSON.stringify(diff.newValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
