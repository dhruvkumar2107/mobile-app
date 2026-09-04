'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { formatCurrency } from '@/lib/utils';
import { productsAPI } from '@/lib/api';
import { Grid, List, Plus, Download, MoreVertical, Eye } from 'lucide-react';

const mockProducts = Array.from({ length: 40 }, (_, i) => ({
  _id: String(i + 1),
  name: [
    'Royal Chronograph Watch', 'Diamond Pendant Set', 'Italian Leather Bag', 'Cashmere Blend Coat',
    'Pearl Earrings', 'Gold Cufflinks', 'Silk Pocket Square', 'Titanium Bracelet',
    'Sapphire Ring', 'Merino Wool Scarf', 'Ceramic Watch', 'Embossed Belt',
  ][i % 12],
  brand: ['LUXE', 'Maison Luxe', 'Artisan', 'Heritage'][i % 4],
  category: ['Watches', 'Jewelry', 'Bags', 'Apparel'][i % 4],
  price: Math.floor(Math.random() * 200000) + 5000,
  stock: Math.floor(Math.random() * 100),
  status: ['active', 'active', 'active', 'draft', 'archived'][i % 5] as string,
  rating: (Math.random() * 2 + 3).toFixed(1),
  salesCount: Math.floor(Math.random() * 500),
  images: [] as string[],
  sku: `LX-${String(i + 1).padStart(5, '0')}`,
}));

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  draft: 'warning',
  archived: 'default',
};

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', brand: '', category: 'Watches', price: 0, stock: 0, description: '' });
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const pageSize = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      if (search) params.search = search;
      const res = await productsAPI.getAll(params);
      const d = res.data;
      const data = d.data || d.products || d;
      if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / pageSize));
      } else {
        setProducts(mockProducts);
        setTotalPages(4);
      }
    } catch {
      setProducts(mockProducts);
      setTotalPages(4);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handleCreate = async () => {
    if (!newProduct.name.trim()) {
      setNameError('Product name is required');
      return;
    }
    setNameError('');
    setCreating(true);
    try {
      await productsAPI.create(newProduct);
      setShowAddModal(false);
      setNewProduct({ name: '', sku: '', brand: '', category: 'Watches', price: 0, stock: 0, description: '' });
      fetchProducts();
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  };

  const filteredProducts = (products.length > 0 ? products : mockProducts).filter((p) => {
    const matchSearch = search === '' || (p.name as string)?.toLowerCase().includes(search.toLowerCase()) || (p.brand as string)?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === '' || p.category === categoryFilter;
    const matchStatus = statusFilter === '' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const displayTotalPages = products.length > 0 ? totalPages : Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = products.length > 0 ? filteredProducts : filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStockIndicator = (stock: number) => {
    if (stock <= 5) return { color: 'bg-error', label: 'Critical' };
    if (stock <= 15) return { color: 'bg-warning', label: 'Low' };
    return { color: 'bg-success', label: 'In Stock' };
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      label: 'Product',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden" aria-hidden="true">
            <span className="text-xs font-bold text-text-muted">LX</span>
          </div>
          <div>
            <p className="text-sm font-medium text-navy">{item.name as string}</p>
            <p className="text-xs text-text-muted">{item.sku as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (item) => <span className="text-text-secondary">{item.brand as string}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (item) => <span className="text-text-secondary">{item.category as string}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (item) => <span className="font-semibold text-navy">{formatCurrency(item.price as number)}</span>,
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (item) => {
        const stock = item.stock as number;
        const indicator = getStockIndicator(stock);
        return (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${indicator.color}`} aria-hidden="true" />
            <span className={`font-medium ${stock <= 5 ? 'text-error' : stock <= 15 ? 'text-warning' : 'text-navy'}`}>
              {stock}
            </span>
            <span className="text-xs text-text-muted hidden lg:inline">{indicator.label}</span>
          </div>
        );
      },
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
      className: 'w-16',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); window.location.href = `/products/${item._id}`; }}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-info-bg rounded transition-colors"
            aria-label={`View ${item.name}`}
          >
            <Eye size={14} />
          </button>
          <button className="p-1.5 text-text-muted hover:text-navy hover:bg-gray-100 rounded transition-colors" aria-label="More actions">
            <MoreVertical size={14} />
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">Products</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage your luxury product catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download size={15} />} aria-label="Export products">Export</Button>
            <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)} aria-label="Add new product">Add Product</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="w-72" />
          <Select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'Watches', label: 'Watches' },
              { value: 'Jewelry', label: 'Jewelry' },
              { value: 'Bags', label: 'Bags' },
              { value: 'Apparel', label: 'Apparel' },
            ]}
            className="w-40"
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
            className="w-36"
          />
          <div className="ml-auto flex items-center border border-border rounded-lg overflow-hidden" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-gray-50'}`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-navy text-white' : 'bg-white text-text-secondary hover:bg-gray-50'}`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg animate-fade-in" role="toolbar" aria-label="Bulk actions">
            <span className="text-sm text-accent font-medium">{selectedIds.length} product(s) selected</span>
            <Button variant="secondary" size="sm" aria-label="Bulk edit selected products">Bulk Edit</Button>
            <Button variant="danger" size="sm" aria-label="Delete selected products">Delete Selected</Button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list" aria-label="Products grid">
            {paginatedProducts.map((product) => {
              const stock = product.stock as number;
              const indicator = getStockIndicator(stock);
              return (
                <div
                  key={String(product._id)}
                  onClick={() => window.location.href = `/products/${product._id}`}
                  className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/products/${product._id}`; }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors" aria-hidden="true">
                    <span className="text-3xl font-bold text-gray-300">LX</span>
                  </div>
                  <Badge variant={statusColors[product.status as string] || 'default'} size="sm">{product.status as string}</Badge>
                  <h3 className="text-sm font-medium text-navy mt-2 line-clamp-1">{product.name as string}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{product.brand as string} - {product.category as string}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-gold-dark">{formatCurrency(product.price as number)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${indicator.color}`} aria-hidden="true" />
                      <span className={`text-xs font-medium ${stock <= 5 ? 'text-error' : stock <= 15 ? 'text-warning' : 'text-text-secondary'}`}>
                        Stock: {stock}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedProducts}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onRowClick={(item) => window.location.href = `/products/${item._id}`}
            currentPage={currentPage}
            totalPages={displayTotalPages}
            onPageChange={setCurrentPage}
            emptyMessage="No products found"
          />
        )}

        {/* Add Product Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => { setNewProduct({ ...newProduct, name: e.target.value }); setNameError(''); }}
                placeholder="Enter product name"
                required
                error={nameError}
              />
              <Input
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="LX-00001"
              />
              <Input
                label="Brand"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                placeholder="Brand name"
              />
              <Select
                label="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                options={[
                  { value: 'Watches', label: 'Watches' },
                  { value: 'Jewelry', label: 'Jewelry' },
                  { value: 'Bags', label: 'Bags' },
                  { value: 'Apparel', label: 'Apparel' },
                ]}
              />
              <Input
                label="Price"
                type="number"
                value={newProduct.price || ''}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                placeholder="0"
                required
              />
              <Input
                label="Stock"
                type="number"
                value={newProduct.stock || ''}
                onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all h-24"
                placeholder="Product description..."
                aria-label="Product description"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="gold" loading={creating} onClick={handleCreate} aria-label="Create product">Create Product</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
