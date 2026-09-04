'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import StatsCard from '@/components/StatsCard';
import { formatCurrency } from '@/lib/utils';
import { inventoryAPI } from '@/lib/api';
import { Warehouse, AlertTriangle, Package, TrendingDown, Edit, Save, X } from 'lucide-react';

const mockInventory = Array.from({ length: 30 }, (_, i) => ({
  _id: String(i + 1),
  product: {
    _id: String(i + 1),
    name: ['Royal Chronograph Watch', 'Diamond Pendant Set', 'Italian Leather Bag', 'Cashmere Blend Coat', 'Pearl Earrings', 'Gold Cufflinks'][i % 6],
    sku: `LX-${String(i + 1).padStart(5, '0')}`,
  },
  sku: `LX-${String(i + 1).padStart(5, '0')}`,
  stock: Math.floor(Math.random() * 100),
  reserved: Math.floor(Math.random() * 10),
  available: 0,
  warehouse: ['Mumbai Central', 'Delhi Hub', 'Bangalore DC', 'Chennai Store'][i % 4],
  status: '' as string,
  lastRestocked: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
}));

mockInventory.forEach((item) => {
  item.available = item.stock - item.reserved;
  item.status = item.stock === 0 ? 'out_of_stock' : item.stock < 10 ? 'low_stock' : 'in_stock';
});

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
};

const statusLabels: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      const res = await inventoryAPI.getAll(params);
      const d = res.data;
      const data = d.data || d.inventory || d;
      if (Array.isArray(data)) {
        setInventory(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / pageSize));
      } else {
        setInventory(mockInventory);
        setTotalPages(3);
      }
    } catch {
      setInventory(mockInventory);
      setTotalPages(3);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSave = async (id: string) => {
    try {
      await inventoryAPI.updateStock(id, editValue);
      setEditingId(null);
      fetchInventory();
    } catch {
      setEditingId(null);
    }
  };

  const displayInventory = inventory.length > 0 ? inventory : mockInventory;
  const filteredInventory = displayInventory.filter((item) => {
    const productName = (item.product as Record<string, unknown>)?.name as string || '';
    const matchSearch = search === '' ||
      productName.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku as string)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalStock = filteredInventory.reduce((sum, i) => sum + (i.stock as number), 0);
  const lowStockCount = filteredInventory.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = filteredInventory.filter((i) => i.status === 'out_of_stock').length;
  const reservedTotal = filteredInventory.reduce((sum, i) => sum + (i.reserved as number), 0);

  const displayTotalPages = inventory.length > 0 ? totalPages : Math.ceil(filteredInventory.length / pageSize);
  const paginatedInventory = inventory.length > 0 ? filteredInventory : filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'product',
      label: 'Product',
      render: (item) => {
        const p = item.product as Record<string, unknown>;
        return (
          <div>
            <p className="text-sm font-medium text-navy">{(p?.name as string) || 'Unknown'}</p>
            <p className="text-xs text-text-muted">{item.sku as string}</p>
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (item) => {
        const id = item._id as string;
        const stock = item.stock as number;
        if (editingId === id) {
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                autoFocus
              />
              <button onClick={() => handleSave(id)} className="p-1 text-success hover:bg-success-bg rounded">
                <Save size={14} />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 text-error hover:bg-error-bg rounded">
                <X size={14} />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${stock < 10 ? 'text-error' : 'text-navy'}`}>{stock}</span>
            <button
              onClick={() => { setEditingId(id); setEditValue(stock); }}
              className="p-1 text-text-muted hover:text-accent hover:bg-info-bg rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit size={12} />
            </button>
          </div>
        );
      },
    },
    {
      key: 'reserved',
      label: 'Reserved',
      render: (item) => <span className="text-text-secondary">{item.reserved as number}</span>,
    },
    {
      key: 'available',
      label: 'Available',
      render: (item) => <span className="font-medium text-navy">{item.available as number}</span>,
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (item) => <span className="text-text-secondary">{item.warehouse as string}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={statusColors[item.status as string] || 'success'} dot>
          {statusLabels[item.status as string] || 'In Stock'}
        </Badge>
      ),
    },
  ];

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
        <div>
          <h1 className="text-2xl font-bold text-navy">Inventory</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track and manage stock levels across warehouses</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Stock" value={totalStock.toLocaleString()} icon={<Package size={20} />} />
          <StatsCard title="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle size={20} />} change={-5} />
          <StatsCard title="Out of Stock" value={String(outOfStockCount)} icon={<TrendingDown size={20} />} />
          <StatsCard title="Reserved" value={reservedTotal.toLocaleString()} icon={<Warehouse size={20} />} />
        </div>

        {lowStockCount > 0 && (
          <div className="p-4 bg-warning-bg border border-warning/20 rounded-xl flex items-center gap-3">
            <AlertTriangle size={18} className="text-warning shrink-0" />
            <p className="text-sm text-warning">
              <span className="font-semibold">{lowStockCount} products</span> are running low on stock and need restocking.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by product or SKU..." className="w-80" />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'in_stock', label: 'In Stock' },
              { value: 'low_stock', label: 'Low Stock' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ]}
            className="w-40"
          />
        </div>

        <DataTable
          columns={columns}
          data={paginatedInventory}
          currentPage={currentPage}
          totalPages={displayTotalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No inventory items found"
        />
      </div>
    </AdminLayout>
  );
}
