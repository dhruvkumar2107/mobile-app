'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Star, Package, Edit, Trash2, Eye, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const mockProduct = {
  _id: '1',
  name: 'Royal Chronograph Watch',
  slug: 'royal-chronograph-watch',
  description: 'Exquisite hand-crafted chronograph with Swiss movement, 18K gold plated case, sapphire crystal glass, and Italian leather strap. Water resistant up to 100 meters.',
  price: 89500,
  compareAtPrice: 99500,
  sku: 'LX-00001',
  barcode: '8901234567890',
  brand: 'LUXE Heritage',
  category: 'Watches',
  subcategory: 'Chronographs',
  images: [],
  stock: 24,
  reserved: 3,
  lowStockThreshold: 10,
  weight: 0.15,
  tags: ['luxury', 'watch', 'chronograph', 'gold'],
  status: 'active' as const,
  featured: true,
  rating: 4.8,
  reviewCount: 124,
  salesCount: 342,
  createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  updatedAt: new Date(Date.now() - 86400000).toISOString(),
};

export default function ProductDetailPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products" className="p-2 text-text-secondary hover:text-navy hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-navy">{mockProduct.name}</h1>
                <Badge variant="success" dot>Active</Badge>
                {mockProduct.featured && <Badge variant="gold">Featured</Badge>}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">SKU: {mockProduct.sku} | {mockProduct.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Edit size={15} />}>Edit</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={15} />}>Delete</Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Price</p>
            <p className="text-xl font-bold text-navy mt-1">{formatCurrency(mockProduct.price)}</p>
            {mockProduct.compareAtPrice && (
              <p className="text-xs text-text-muted line-through">{formatCurrency(mockProduct.compareAtPrice)}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Stock</p>
            <p className="text-xl font-bold text-navy mt-1">{mockProduct.stock}</p>
            <p className="text-xs text-text-muted">{mockProduct.reserved} reserved</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Rating</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={16} className="text-gold fill-gold" />
              <span className="text-xl font-bold text-navy">{mockProduct.rating}</span>
            </div>
            <p className="text-xs text-text-muted">{mockProduct.reviewCount} reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Sales</p>
            <p className="text-xl font-bold text-navy mt-1">{mockProduct.salesCount}</p>
            <p className="text-xs text-success">+12% this month</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'details', label: 'Details' },
            { id: 'variants', label: 'Variants' },
            { id: 'reviews', label: 'Reviews', count: mockProduct.reviewCount },
            { id: 'analytics', label: 'Analytics' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-4">Product Images</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                      <Package size={24} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Description</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{mockProduct.description}</p>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {mockProduct.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-text-secondary text-xs rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Product Info</h3>
                <div className="space-y-3">
                  {[
                    ['Brand', mockProduct.brand],
                    ['Category', mockProduct.category],
                    ['Subcategory', mockProduct.subcategory],
                    ['SKU', mockProduct.sku],
                    ['Barcode', mockProduct.barcode || 'N/A'],
                    ['Weight', `${mockProduct.weight} kg`],
                    ['Created', formatDate(mockProduct.createdAt)],
                    ['Updated', formatDate(mockProduct.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{label}</span>
                      <span className="text-navy font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
