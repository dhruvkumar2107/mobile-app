'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { couponsAPI } from '@/lib/api';
import { Plus, Tag, Copy, Trash2, Edit } from 'lucide-react';

const mockCoupons = Array.from({ length: 15 }, (_, i) => ({
  _id: String(i + 1),
  code: ['LUXE20', 'PREMIUM10', 'FREESHIP', 'DIAMOND15', 'GOLD25', 'VIP50', 'WELCOME100', 'SAVE500'][i % 8],
  type: ['percentage', 'fixed', 'free_shipping'][i % 3] as string,
  value: i % 3 === 0 ? 100 : i % 3 === 1 ? [500, 1000, 2000][i % 3] : 0,
  minOrderAmount: [1000, 5000, 10000, 25000][i % 4],
  maxUses: [100, 500, 1000, 5000][i % 4],
  usedCount: Math.floor(Math.random() * 200),
  startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 30 * (i % 2 === 0 ? 1 : -1)).toISOString(),
  status: i % 3 === 2 ? 'expired' as const : i % 4 === 3 ? 'disabled' as const : 'active' as const,
  createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
}));

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  expired: 'warning',
  disabled: 'default',
};

export default function CouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [newCoupon, setNewCoupon] = useState<{ code: string; type: 'percentage' | 'fixed' | 'free_shipping'; value: number; minOrderAmount: number; maxUses: number; endDate: string }>({ code: '', type: 'percentage', value: 0, minOrderAmount: 0, maxUses: 100, endDate: '' });
  const [creating, setCreating] = useState(false);
  const pageSize = 10;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponsAPI.getAll();
      const d = res.data;
      const data = d.data || d.coupons || d;
      if (Array.isArray(data)) {
        setCoupons(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / pageSize));
      } else {
        setCoupons(mockCoupons);
        setTotalPages(2);
      }
    } catch {
      setCoupons(mockCoupons);
      setTotalPages(2);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await couponsAPI.create(newCoupon);
      setShowCreateModal(false);
      setNewCoupon({ code: '', type: 'percentage', value: 0, minOrderAmount: 0, maxUses: 100, endDate: '' });
      fetchCoupons();
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  };

  const displayCoupons = coupons.length > 0 ? coupons : mockCoupons;
  const filteredCoupons = displayCoupons.filter((c) => {
    const matchSearch = search === '' || (c.code as string)?.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'all' || c.status === activeTab;
    return matchSearch && matchTab;
  });

  const displayTotalPages = coupons.length > 0 ? totalPages : Math.ceil(filteredCoupons.length / pageSize);
  const paginatedCoupons = coupons.length > 0 ? filteredCoupons : filteredCoupons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-1 rounded">{item.code as string}</span>
          <button className="p-1 text-text-muted hover:text-accent rounded transition-colors">
            <Copy size={12} />
          </button>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item) => (
        <span className="text-text-secondary capitalize">
          {item.type === 'percentage' ? `${item.value}% off` : item.type === 'fixed' ? `${formatCurrency(item.value as number)} off` : 'Free Shipping'}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      label: 'Min Order',
      render: (item) => <span className="text-text-secondary">{formatCurrency(item.minOrderAmount as number)}</span>,
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (item) => (
        <span className="text-text-secondary">
          {item.usedCount as number}/{item.maxUses as number}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'Expires',
      render: (item) => <span className="text-text-secondary text-xs">{formatDate(item.endDate as string)}</span>,
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
      className: 'w-20',
      render: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-text-muted hover:text-accent hover:bg-info-bg rounded transition-colors">
            <Edit size={14} />
          </button>
          <button className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg rounded transition-colors">
            <Trash2 size={14} />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">Coupons</h1>
            <p className="text-sm text-text-secondary mt-0.5">Create and manage discount codes</p>
          </div>
          <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>
            Create Coupon
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search coupons..." className="w-72" />
          <div className="flex gap-2 ml-auto">
            {['all', 'active', 'expired', 'disabled'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === tab ? 'bg-navy text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginatedCoupons}
          currentPage={currentPage}
          totalPages={displayTotalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No coupons found"
        />

        {/* Create Coupon Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Coupon" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Coupon Code</label>
                <input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 text-sm border border-border rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="LUXE20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Type</label>
                <select value={newCoupon.type} onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'percentage' | 'fixed' | 'free_shipping' })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Value</label>
                <input type="number" value={newCoupon.value || ''} onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Min Order Amount</label>
                <input type="number" value={newCoupon.minOrderAmount || ''} onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Max Uses</label>
                <input type="number" value={newCoupon.maxUses || ''} onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Expiry Date</label>
                <input type="date" value={newCoupon.endDate} onChange={(e) => setNewCoupon({ ...newCoupon, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="gold" loading={creating} onClick={handleCreate}>Create Coupon</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
