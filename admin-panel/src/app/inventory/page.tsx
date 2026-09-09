'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import StatsCard from '@/components/StatsCard';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { inventoryAPI } from '@/lib/api';
import { Warehouse, AlertTriangle, Package, TrendingDown, Edit, Save, X, Layers, ChevronDown } from 'lucide-react';

interface ProductVariant {
  _id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  stock: number;
  reserved: number;
  available: number;
}

interface InventoryItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  sku: string;
  stock: number;
  reserved: number;
  available: number;
  warehouse: string;
  status: string;
  lastRestocked: string;
  variants?: ProductVariant[];
}

const mockInventory: InventoryItem[] = Array.from({ length: 30 }, (_, i) => {
  const baseStock = Math.floor(Math.random() * 100);
  const reserved = Math.floor(Math.random() * 10);
  return {
    _id: String(i + 1),
    product: {
      _id: String(i + 1),
      name: ['Royal Chronograph Watch', 'Diamond Pendant Set', 'Italian Leather Bag', 'Cashmere Blend Coat', 'Pearl Earrings', 'Gold Cufflinks'][i % 6],
      sku: `LX-${String(i + 1).padStart(5, '0')}`,
    },
    sku: `LX-${String(i + 1).padStart(5, '0')}`,
    stock: baseStock,
    reserved,
    available: baseStock - reserved,
    warehouse: ['Mumbai Central', 'Delhi Hub', 'Bangalore DC', 'Chennai Store'][i % 4],
    status: baseStock === 0 ? 'out_of_stock' : baseStock < 10 ? 'low_stock' : 'in_stock',
    lastRestocked: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    variants: i % 3 === 0 ? [
      { _id: `${i + 1}-v1`, name: 'Silver / 40mm', sku: `LX-${String(i + 1).padStart(5, '0')}-S40`, attributes: { color: 'Silver', size: '40mm' }, stock: Math.floor(Math.random() * 50), reserved: Math.floor(Math.random() * 5), available: 0 },
      { _id: `${i + 1}-v2`, name: 'Gold / 42mm', sku: `LX-${String(i + 1).padStart(5, '0')}-G42`, attributes: { color: 'Gold', size: '42mm' }, stock: Math.floor(Math.random() * 50), reserved: Math.floor(Math.random() * 5), available: 0 },
      { _id: `${i + 1}-v3`, name: 'Rose Gold / 38mm', sku: `LX-${String(i + 1).padStart(5, '0')}-RG38`, attributes: { color: 'Rose Gold', size: '38mm' }, stock: Math.floor(Math.random() * 50), reserved: Math.floor(Math.random() * 5), available: 0 },
    ] : undefined,
  };
});

mockInventory.forEach((item) => {
  if (item.variants) {
    item.variants.forEach((v) => { v.available = v.stock - v.reserved; });
    item.stock = item.variants.reduce((sum, v) => sum + v.stock, 0);
    item.reserved = item.variants.reduce((sum, v) => sum + v.reserved, 0);
    item.available = item.stock - item.reserved;
  }
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

interface BulkUpdateItem {
  itemId: string;
  variantId?: string;
  variantName?: string;
  productName: string;
  currentStock: number;
  newStock: number;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkUpdateItem[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const pageSize = 10;

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      const res = await inventoryAPI.getAll(params);
      const d = res.data;
      const raw = d.data || d.inventory || d;
      const items = Array.isArray(raw) ? raw : (raw?.items || []);
      if (items.length > 0) {
        const mapped = items.map((inv: Record<string, unknown>) => ({ ...inv, _id: inv.id || inv._id }));
        setInventory(mapped);
        setTotalPages(d.totalPages || raw?.totalPages || Math.ceil((d.total || raw?.total || items.length) / pageSize));
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

  const handleSave = async (id: string, variantId?: string) => {
    try {
      const targetId = variantId || id;
      await inventoryAPI.updateStock(targetId, editValue);
      setEditingId(null);
      fetchInventory();
    } catch {
      setEditingId(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openBulkModal = () => {
    const items: BulkUpdateItem[] = [];
    const displayData = inventory.length > 0 ? inventory : mockInventory;
    displayData.forEach((item) => {
      if (item.variants && item.variants.length > 0) {
        item.variants.forEach((v) => {
          items.push({
            itemId: item._id,
            variantId: v._id,
            variantName: v.name,
            productName: item.product.name,
            currentStock: v.stock,
            newStock: v.stock,
          });
        });
      } else {
        items.push({
          itemId: item._id,
          productName: item.product.name,
          currentStock: item.stock,
          newStock: item.stock,
        });
      }
    });
    setBulkItems(items);
    setShowBulkModal(true);
  };

  const updateBulkItem = (index: number, value: number) => {
    setBulkItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], newStock: value };
      return next;
    });
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      for (const item of bulkItems) {
        if (item.newStock !== item.currentStock) {
          const targetId = item.variantId || item.itemId;
          await inventoryAPI.updateStock(targetId, item.newStock);
        }
      }
      setShowBulkModal(false);
      fetchInventory();
    } catch {
      // silently fail individual items
    } finally {
      setBulkSaving(false);
    }
  };

  const displayInventory = inventory.length > 0 ? inventory : mockInventory;
  const filteredInventory = displayInventory.filter((item) => {
    const productName = item.product?.name || '';
    const matchSearch = search === '' ||
      productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalStock = filteredInventory.reduce((sum, i) => sum + (i.stock as number), 0);
  const lowStockCount = filteredInventory.filter((i) => i.status === 'low_stock').length;
  const outOfStockCount = filteredInventory.filter((i) => i.status === 'out_of_stock').length;
  const reservedTotal = filteredInventory.reduce((sum, i) => sum + (i.reserved as number), 0);

  const displayTotalPages = inventory.length > 0 ? totalPages : Math.ceil(filteredInventory.length / pageSize);
  const paginatedInventory = inventory.length > 0 ? filteredInventory : filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const variantAttributeBadges = (attrs: Record<string, string>) => {
    return Object.entries(attrs).map(([key, val]) => (
      <Badge key={key} variant="default" size="sm">{key}: {val}</Badge>
    ));
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'product',
      label: 'Product',
      render: (item) => {
        const p = item.product as Record<string, unknown>;
        const logItem = item as unknown as InventoryItem;
        const hasVariants = logItem.variants && logItem.variants.length > 0;
        return (
          <div className="flex items-center gap-2">
            {hasVariants && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleRow(item._id as string); }}
                className="p-1 text-text-muted hover:text-accent hover:bg-info-bg rounded transition-colors shrink-0"
                aria-label={expandedRows.has(item._id as string) ? 'Collapse variants' : 'Expand variants'}
              >
                <ChevronDown size={14} className={`transition-transform ${expandedRows.has(item._id as string) ? 'rotate-180' : ''}`} />
              </button>
            )}
            <div>
              <p className="text-sm font-medium text-navy">{(p?.name as string) || 'Unknown'}</p>
              <p className="text-xs text-text-muted">{item.sku as string}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'variant',
      label: 'Variant',
      render: (item) => {
        const logItem = item as unknown as InventoryItem;
        if (logItem.variants && logItem.variants.length > 0) {
          return (
            <div className="flex items-center gap-1.5">
              <Layers size={12} className="text-text-muted" />
              <span className="text-xs text-text-secondary">{logItem.variants.length} variants</span>
            </div>
          );
        }
        return <span className="text-xs text-text-muted">-</span>;
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

  const expandedRowContent = (item: Record<string, unknown>) => {
    const logItem = item as unknown as InventoryItem;
    if (!expandedRows.has(logItem._id) || !logItem.variants || logItem.variants.length === 0) return null;
    return (
      <tr key={`expanded-${logItem._id}`}>
        <td colSpan={columns.length} className="px-4 py-3 bg-gray-50/50">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-navy uppercase tracking-wider">Product Variants</p>
            <div className="grid grid-cols-1 gap-2">
              {logItem.variants.map((variant) => (
                <div key={variant._id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-border">
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <span className="text-sm font-medium text-navy">{variant.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {variantAttributeBadges(variant.attributes)}
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-text-muted">Stock</p>
                      {editingId === `variant-${variant._id}` ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 text-sm border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                            autoFocus
                          />
                          <button onClick={() => handleSave(logItem._id, variant._id)} className="p-0.5 text-success hover:bg-success-bg rounded">
                            <Save size={12} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-0.5 text-error hover:bg-error-bg rounded">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-semibold ${variant.stock < 10 ? 'text-error' : 'text-navy'}`}>{variant.stock}</span>
                          <button
                            onClick={() => { setEditingId(`variant-${variant._id}`); setEditValue(variant.stock); }}
                            className="p-0.5 text-text-muted hover:text-accent rounded"
                          >
                            <Edit size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-muted">Reserved</p>
                      <span className="text-sm text-text-secondary">{variant.reserved}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-muted">Available</p>
                      <span className="text-sm font-medium text-navy">{variant.available}</span>
                    </div>
                    <div className="text-center min-w-[70px]">
                      <p className="text-xs text-text-muted">Status</p>
                      <Badge variant={statusColors[variant.stock === 0 ? 'out_of_stock' : variant.stock < 10 ? 'low_stock' : 'in_stock'] || 'success'} size="sm">
                        {variant.stock === 0 ? 'Out of Stock' : variant.stock < 10 ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
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
          <div className="ml-auto">
            <Button variant="primary" icon={<Layers size={16} />} onClick={openBulkModal}>
              Bulk Stock Update
            </Button>
          </div>
        </div>

        <div>
          <DataTable
            columns={columns}
            data={paginatedInventory as unknown as Record<string, unknown>[]}
            currentPage={currentPage}
            totalPages={displayTotalPages}
            onPageChange={setCurrentPage}
            emptyMessage="No inventory items found"
          />
          {expandedRows.size > 0 && (
            <div className="bg-white rounded-xl border border-border border-t-0 -mt-px">
              <table className="w-full">
                <tbody>
                  {paginatedInventory
                    .filter((item) => expandedRows.has(item._id) && item.variants && item.variants.length > 0)
                    .map((logItem) => (
                      <tr key={`expanded-${logItem._id}`}>
                        <td colSpan={columns.length} className="px-6 py-4 bg-gray-50/50">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-navy uppercase tracking-wider">Product Variants</p>
                            <div className="grid grid-cols-1 gap-2">
                              {logItem.variants!.map((variant) => (
                                <div key={variant._id} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-border">
                                  <div className="flex items-center gap-2 min-w-[160px]">
                                    <span className="text-sm font-medium text-navy">{variant.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {variantAttributeBadges(variant.attributes)}
                                  </div>
                                  <div className="ml-auto flex items-center gap-4">
                                    <div className="text-center">
                                      <p className="text-xs text-text-muted">Stock</p>
                                      {editingId === `variant-${variant._id}` ? (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                            className="w-16 px-1.5 py-0.5 text-sm border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                                            autoFocus
                                          />
                                          <button onClick={() => handleSave(logItem._id, variant._id)} className="p-0.5 text-success hover:bg-success-bg rounded">
                                            <Save size={12} />
                                          </button>
                                          <button onClick={() => setEditingId(null)} className="p-0.5 text-error hover:bg-error-bg rounded">
                                            <X size={12} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <span className={`text-sm font-semibold ${variant.stock < 10 ? 'text-error' : 'text-navy'}`}>{variant.stock}</span>
                                          <button
                                            onClick={() => { setEditingId(`variant-${variant._id}`); setEditValue(variant.stock); }}
                                            className="p-0.5 text-text-muted hover:text-accent rounded"
                                          >
                                            <Edit size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-text-muted">Reserved</p>
                                      <span className="text-sm text-text-secondary">{variant.reserved}</span>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-text-muted">Available</p>
                                      <span className="text-sm font-medium text-navy">{variant.available}</span>
                                    </div>
                                    <div className="text-center min-w-[70px]">
                                      <p className="text-xs text-text-muted">Status</p>
                                      <Badge variant={statusColors[variant.stock === 0 ? 'out_of_stock' : variant.stock < 10 ? 'low_stock' : 'in_stock'] || 'success'} size="sm">
                                        {variant.stock === 0 ? 'Out of Stock' : variant.stock < 10 ? 'Low Stock' : 'In Stock'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Stock Update" size="xl">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Update stock quantities for multiple items at once. Items with unchanged stock will be skipped.
            </p>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Product</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Variant</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Current Stock</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-text-secondary uppercase">New Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bulkItems.map((item, index) => (
                    <tr key={`${item.itemId}-${item.variantId || 'main'}`} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-sm text-navy font-medium">{item.productName}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">
                        {item.variantName || <span className="text-text-muted italic">Main</span>}
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-text-secondary">{item.currentStock}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          value={item.newStock}
                          onChange={(e) => updateBulkItem(index, parseInt(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 text-sm text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                            item.newStock !== item.currentStock
                              ? 'border-accent bg-accent/5'
                              : 'border-border'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setShowBulkModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={bulkSaving}
                onClick={handleBulkSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
