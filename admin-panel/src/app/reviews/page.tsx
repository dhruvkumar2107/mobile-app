'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import DataTable, { Column } from '@/components/DataTable';
import SearchInput from '@/components/SearchInput';
import Select from '@/components/Select';
import Badge from '@/components/Badge';
import Tabs from '@/components/Tabs';
import { formatDate } from '@/lib/utils';
import { reviewsAPI } from '@/lib/api';
import { Star, CheckCircle, Eye, Trash2 } from 'lucide-react';

const mockReviews = Array.from({ length: 25 }, (_, i) => ({
  _id: String(i + 1),
  customer: {
    firstName: ['Arjun', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Ananya', 'Karan', 'Meera'][i % 8],
    lastName: ['Mehta', 'Sharma', 'Gupta', 'Patel', 'Singh', 'Reddy', 'Joshi', 'Nair'][i % 8],
  },
  product: {
    name: ['Royal Chronograph Watch', 'Diamond Pendant Set', 'Italian Leather Bag', 'Cashmere Blend Coat', 'Pearl Earrings'][i % 5],
  },
  rating: Math.floor(Math.random() * 3) + 3,
  title: ['Exceptional quality!', 'Beautiful craftsmanship', 'Worth every penny', 'Stunning piece', 'Highly recommended'][i % 5],
  comment: [
    'Absolutely love this product. The attention to detail is remarkable and it exceeded my expectations.',
    'The craftsmanship is outstanding. This is truly a luxury piece that I will treasure forever.',
    'Fast delivery and excellent packaging. The product looks even better in person.',
    'A bit pricey but you get what you pay for. The quality is unmatched.',
    'Bought this as a gift and it was a huge hit. Will definitely shop here again.',
  ][i % 5],
  status: ['approved', 'approved', 'pending', 'approved', 'hidden'][i % 5] as string,
  helpful: Math.floor(Math.random() * 50),
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  hidden: 'default',
  rejected: 'error',
};

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const pageSize = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: pageSize };
      const res = await reviewsAPI.getAll(params);
      const d = res.data;
      const data = d.data || d.reviews || d;
      if (Array.isArray(data)) {
        setReviews(data);
        setTotalPages(d.totalPages || Math.ceil((d.total || data.length) / pageSize));
      } else {
        setReviews(mockReviews);
        setTotalPages(3);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews(mockReviews);
      setTotalPages(3);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = async (id: string, action: string) => {
    try {
      await reviewsAPI.moderate(id, action);
      fetchReviews();
    } catch (err) {
      console.error(`Failed to ${action} review:`, err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsAPI.moderate(id, 'reject');
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : mockReviews;
  const filteredReviews = displayReviews.filter((r) => {
    const customerName = `${(r.customer as Record<string, unknown>)?.firstName || ''} ${(r.customer as Record<string, unknown>)?.lastName || ''}`;
    const productName = (r.product as Record<string, unknown>)?.name as string || '';
    const matchSearch = search === '' ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      productName.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === '' || r.rating === parseInt(ratingFilter);
    const matchTab = activeTab === 'all' || r.status === activeTab;
    return matchSearch && matchRating && matchTab;
  });

  const displayTotalPages = reviews.length > 0 ? totalPages : Math.ceil(filteredReviews.length / pageSize);
  const paginatedReviews = reviews.length > 0 ? filteredReviews : filteredReviews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allReviews = reviews.length > 0 ? reviews : mockReviews;
  const statusCounts: Record<string, number> = {};
  allReviews.forEach((r) => {
    const s = r.status as string;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'customer',
      label: 'Customer',
      render: (item) => {
        const c = item.customer as Record<string, unknown>;
        if (c && c.firstName) {
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-white text-xs font-semibold">
                {(c.firstName as string).charAt(0)}{(c.lastName as string).charAt(0)}
              </div>
              <span className="text-sm font-medium text-navy">{c.firstName as string} {c.lastName as string}</span>
            </div>
          );
        }
        return <span className="text-sm font-medium text-navy">Anonymous</span>;
      },
    },
    {
      key: 'product',
      label: 'Product',
      render: (item) => {
        const p = item.product as Record<string, unknown>;
        return <span className="text-text-secondary">{(p?.name as string) || 'Unknown'}</span>;
      },
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (item) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={14}
              className={i < (item.rating as number) ? 'text-gold fill-gold' : 'text-gray-200'}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'review',
      label: 'Review',
      render: (item) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium text-navy truncate">{item.title as string}</p>
          <p className="text-xs text-text-muted truncate mt-0.5">{item.comment as string}</p>
        </div>
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
      render: (item) => (
        <div className="flex items-center gap-1">
          {(item.status as string) === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleModerate(item._id as string, 'approve'); }}
              className="p-1.5 text-text-muted hover:text-success hover:bg-success-bg rounded transition-colors"
              title="Approve"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {(item.status as string) === 'approved' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleModerate(item._id as string, 'hide'); }}
              className="p-1.5 text-text-muted hover:text-warning hover:bg-warning-bg rounded transition-colors"
              title="Hide"
            >
              <Eye size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(item._id as string); }}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg rounded transition-colors"
            title="Delete"
          >
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
        <div>
          <h1 className="text-2xl font-bold text-navy">Reviews</h1>
          <p className="text-sm text-text-secondary mt-0.5">Moderate customer reviews and feedback</p>
        </div>

        <Tabs
          tabs={[
            { id: 'all', label: 'All Reviews', count: displayReviews.length },
            { id: 'pending', label: 'Pending', count: statusCounts['pending'] || 0 },
            { id: 'approved', label: 'Approved', count: statusCounts['approved'] || 0 },
            { id: 'hidden', label: 'Hidden', count: statusCounts['hidden'] || 0 },
          ]}
          activeTab={activeTab}
          onChange={(id) => { setActiveTab(id); setCurrentPage(1); }}
        />

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search reviews..." className="w-80" />
          <Select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: '', label: 'All Ratings' },
              { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' },
              { value: '3', label: '3 Stars' },
              { value: '2', label: '2 Stars' },
              { value: '1', label: '1 Star' },
            ]}
            className="w-36"
          />
        </div>

        <DataTable
          columns={columns}
          data={paginatedReviews}
          currentPage={currentPage}
          totalPages={displayTotalPages}
          onPageChange={setCurrentPage}
          emptyMessage="No reviews found"
        />
      </div>
    </AdminLayout>
  );
}
