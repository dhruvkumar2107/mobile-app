'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { productsAPI, variantsAPI, reviewsAPI } from '@/lib/api';
import { Product, Variant, Review } from '@/types';
import { ArrowLeft, Star, Package, Edit, Trash2, Eye, TrendingUp, ShoppingCart, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsAPI.getById(productId);
      const data = res.data?.data || res.data;
      setProduct(data);

      // Fetch variants
      try {
        const vRes = await variantsAPI.getByProduct(productId);
        const vData = vRes.data?.data || vRes.data;
        setVariants(Array.isArray(vData) ? vData : vData?.variants || []);
      } catch {
        setVariants([]);
      }

      // Fetch reviews
      try {
        const rRes = await reviewsAPI.getAll({ productId, limit: 50 });
        const rData = rRes.data?.data || rRes.data;
        setReviews(Array.isArray(rData) ? rData : rData?.reviews || []);
      } catch {
        setReviews([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await productsAPI.delete(productId);
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !product) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <AlertTriangle size={48} className="text-warning" />
          <h2 className="text-xl font-bold text-navy">{error || 'Product not found'}</h2>
          <p className="text-sm text-text-secondary">The product you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchProduct}>Retry</Button>
            <Link href="/products">
              <Button variant="primary">Back to Products</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusVariant = product.status === 'active' ? 'success' : product.status === 'draft' ? 'warning' : 'default';
  const stockStatus = product.stock <= 0
    ? { label: 'Out of Stock', variant: 'error' as const }
    : product.lowStockThreshold && product.stock <= product.lowStockThreshold
    ? { label: 'Low Stock', variant: 'warning' as const }
    : { label: 'In Stock', variant: 'success' as const };

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
                <h1 className="text-2xl font-bold text-navy">{product.name}</h1>
                <Badge variant={statusVariant} dot>{product.status || (product.isActive ? 'active' : 'draft')}</Badge>
                {product.featured && <Badge variant="gold">Featured</Badge>}
              </div>
              <p className="text-sm text-text-secondary mt-0.5">SKU: {product.sku} | {product.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/products/${productId}/edit`}>
              <Button variant="secondary" size="sm" icon={<Edit size={15} />}>Edit</Button>
            </Link>
            <Button variant="danger" size="sm" icon={<Trash2 size={15} />} onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Price</p>
            <p className="text-xl font-bold text-navy mt-1">{formatCurrency(product.price)}</p>
            {(product.compareAtPrice || product.mrp) && (
              <p className="text-xs text-text-muted line-through">{formatCurrency(product.compareAtPrice || product.mrp!)}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Stock</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-bold text-navy">{product.stock}</p>
              <Badge variant={stockStatus.variant} size="sm">{stockStatus.label}</Badge>
            </div>
            {product.reserved !== undefined && product.reserved > 0 && (
              <p className="text-xs text-text-muted">{product.reserved} reserved</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Rating</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={16} className="text-gold fill-gold" />
              <span className="text-xl font-bold text-navy">{product.rating}</span>
            </div>
            <p className="text-xs text-text-muted">{product.reviewCount} reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider">Sales</p>
            <p className="text-xl font-bold text-navy mt-1">{product.salesCount || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'details', label: 'Details' },
            { id: 'variants', label: 'Variants', count: variants.length },
            { id: 'reviews', label: 'Reviews', count: reviews.length || product.reviewCount },
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
                {product.images && product.images.length > 0 ? (
                  <>
                    <div className="mb-4 aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={product.images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedImage === i ? 'border-gold' : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                        <ImageIcon size={24} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Description</h3>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-navy mb-3">Specifications</h3>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                        <span className="text-text-secondary">{key}</span>
                        <span className="text-navy font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-navy mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-text-secondary text-xs rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Product Info</h3>
                <div className="space-y-3">
                  {[
                    ['Brand', product.brand],
                    ['Category', product.category],
                    ['Subcategory', product.subcategory || 'N/A'],
                    ['SKU', product.sku],
                    ['Barcode', product.barcode || 'N/A'],
                    ['Weight', product.weight ? `${product.weight} kg` : 'N/A'],
                    ['Seller', product.seller || 'N/A'],
                    ['Created', formatDate(product.createdAt)],
                    ['Updated', product.updatedAt ? formatDate(product.updatedAt) : 'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{label}</span>
                      <span className="text-navy font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Inventory</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total Stock</span>
                    <span className="text-navy font-medium">{product.stock}</span>
                  </div>
                  {product.reserved !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Reserved</span>
                      <span className="text-navy font-medium">{product.reserved}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Available</span>
                    <span className="text-navy font-medium">
                      {product.stock - (product.reserved || 0)}
                    </span>
                  </div>
                  {product.lowStockThreshold !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Low Stock Alert</span>
                      <span className="text-navy font-medium">{'<'} {product.lowStockThreshold}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <Badge variant={stockStatus.variant} size="md">{stockStatus.label}</Badge>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {product.highlights && product.highlights.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-navy mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <span className="text-success mt-0.5">●</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dimensions */}
              {product.dimensions && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-navy mb-3">Dimensions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Length</span>
                      <span className="text-navy font-medium">{product.dimensions.length} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Width</span>
                      <span className="text-navy font-medium">{product.dimensions.width} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Height</span>
                      <span className="text-navy font-medium">{product.dimensions.height} cm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div className="bg-white rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">Product Variants</h3>
                <Button variant="secondary" size="sm" icon={<Edit size={15} />} onClick={() => router.push(`/products/${productId}/edit`)}>
                  Manage Variants
                </Button>
              </div>
            </div>
            {variants.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-text-secondary">No variants found for this product.</p>
                <Link href={`/products/${productId}/edit`}>
                  <Button variant="secondary" size="sm" className="mt-3">Add Variants</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-5 py-3 font-medium text-text-secondary">Variant</th>
                      <th className="px-5 py-3 font-medium text-text-secondary">SKU</th>
                      <th className="px-5 py-3 font-medium text-text-secondary">Price</th>
                      <th className="px-5 py-3 font-medium text-text-secondary">Stock</th>
                      <th className="px-5 py-3 font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-navy font-medium">
                          {Object.values(variant.attributes).join(' / ')}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{variant.sku}</td>
                        <td className="px-5 py-3 text-navy font-medium">
                          {formatCurrency(variant.effectivePrice || variant.priceOverride || product.price)}
                        </td>
                        <td className="px-5 py-3 text-navy">{variant.stock}</td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={variant.availability === 'in_stock' ? 'success' : variant.availability === 'out_of_stock' ? 'error' : 'default'}
                            size="sm"
                          >
                            {variant.availability.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">Customer Reviews</h3>
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-gold fill-gold" />
                  <span className="text-sm font-bold text-navy">{product.rating}</span>
                  <span className="text-sm text-text-secondary">({product.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <Star size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-text-secondary">No reviews yet for this product.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {reviews.map((review) => (
                  <div key={review._id} className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-navy">
                            {review.userName || (typeof review.customer === 'object' && review.customer?.name) || 'Anonymous'}
                          </span>
                          {review.verified && (
                            <Badge variant="success" size="sm">Verified</Badge>
                          )}
                          {review.status === 'pending' && (
                            <Badge variant="warning" size="sm">Pending</Badge>
                          )}
                          {review.status === 'hidden' && (
                            <Badge variant="default" size="sm">Hidden</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < review.rating ? 'text-gold fill-gold' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-text-muted">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.title && (
                      <p className="text-sm font-medium text-navy mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-text-secondary">{review.comment || review.body}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img, i) => (
                          <img key={i} src={img} alt="Review" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Product Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-secondary uppercase tracking-wider">Total Views</p>
                <p className="text-xl font-bold text-navy mt-1">--</p>
                <p className="text-xs text-text-muted">Analytics coming soon</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-secondary uppercase tracking-wider">Conversion Rate</p>
                <p className="text-xl font-bold text-navy mt-1">--</p>
                <p className="text-xs text-text-muted">Analytics coming soon</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-secondary uppercase tracking-wider">Revenue</p>
                <p className="text-xl font-bold text-navy mt-1">--</p>
                <p className="text-xs text-text-muted">Analytics coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
