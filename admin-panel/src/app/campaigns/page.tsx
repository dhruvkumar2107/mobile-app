'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Tabs from '@/components/Tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { campaignsAPI } from '@/lib/api';
import { Plus, Megaphone, Mail, MessageSquare, Bell, Share2, TrendingUp, Eye, MousePointerClick, DollarSign, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const mockCampaigns = Array.from({ length: 10 }, (_, i) => ({
  _id: String(i + 1),
  name: ['Summer Sale 2024', 'VIP Exclusive', 'New Year Special', 'Festive Collection Launch', 'Flash Sale - Watches', 'Birthday Rewards', 'Win-Back Campaign', 'Referral Program', 'App Launch', 'Clearance Sale'][i],
  type: ['email', 'sms', 'push', 'social'][i % 4] as string,
  status: ['active', 'completed', 'paused', 'draft'][i % 4] as string,
  targetAudience: ['All Customers', 'VIP Members', 'New Customers', 'Inactive 30+ Days', 'High Value'][i % 5],
  sent: Math.floor(Math.random() * 50000) + 1000,
  delivered: 0,
  opened: 0,
  clicked: 0,
  converted: 0,
  revenue: Math.floor(Math.random() * 500000) + 50000,
  startDate: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  endDate: new Date(Date.now() + Math.random() * 86400000 * 30).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
}));

mockCampaigns.forEach((c) => {
  c.delivered = Math.floor(c.sent * 0.92);
  c.opened = Math.floor(c.delivered * 0.35);
  c.clicked = Math.floor(c.opened * 0.22);
  c.converted = Math.floor(c.clicked * 0.15);
});

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  paused: 'warning',
  draft: 'default',
};

const typeIcons: Record<string, React.ReactNode> = {
  email: <Mail size={16} />,
  sms: <MessageSquare size={16} />,
  push: <Bell size={16} />,
  social: <Share2 size={16} />,
};

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', targetAudience: 'All Customers', startDate: '', endDate: '', message: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await campaignsAPI.getAll();
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setMessage({ type: 'error', text: 'Campaign name is required.' }); return; }
    setCreating(true);
    try {
      await campaignsAPI.create({
        name: form.name,
        type: form.type as 'email' | 'sms' | 'push' | 'social',
        status: 'draft',
        targetAudience: form.targetAudience,
        startDate: form.startDate || new Date().toISOString(),
        endDate: form.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      } as any);
      setMessage({ type: 'success', text: 'Campaign created successfully!' });
      setShowCreateModal(false);
      setForm({ name: '', type: 'email', targetAudience: 'All Customers', startDate: '', endDate: '', message: '' });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setMessage({ type: 'error', text: 'Failed to create campaign.' });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredCampaigns = activeTab === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === activeTab);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
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
            <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage marketing campaigns and promotions</p>
          </div>
          <Button variant="gold" size="sm" icon={<Plus size={15} />} onClick={() => setShowCreateModal(true)}>
            Create Campaign
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        <Tabs
          tabs={[
            { id: 'all', label: 'All', count: campaigns.length },
            { id: 'active', label: 'Active', count: campaigns.filter((c) => c.status === 'active').length },
            { id: 'completed', label: 'Completed', count: campaigns.filter((c) => c.status === 'completed').length },
            { id: 'paused', label: 'Paused', count: campaigns.filter((c) => c.status === 'paused').length },
            { id: 'draft', label: 'Drafts', count: campaigns.filter((c) => c.status === 'draft').length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center text-navy">
                    {typeIcons[campaign.type]}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy">{campaign.name}</h3>
                    <p className="text-xs text-text-muted capitalize">{campaign.type} campaign</p>
                  </div>
                </div>
                <Badge variant={statusColors[campaign.status]} dot>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>

              <p className="text-xs text-text-secondary mb-3">Target: {campaign.targetAudience}</p>

              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-text-muted">Sent</p>
                  <p className="text-sm font-semibold text-navy">{((campaign.sent || 0) / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Opened</p>
                  <p className="text-sm font-semibold text-navy">{campaign.delivered ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Clicked</p>
                  <p className="text-sm font-semibold text-navy">{campaign.opened ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : 0}%</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Revenue</p>
                  <p className="text-sm font-semibold text-gold-dark">{formatCurrency(campaign.revenue || 0)}</p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                  style={{ width: `${campaign.sent ? Math.min(100, (campaign.clicked / campaign.sent) * 100 * 5) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Create Campaign Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Campaign" size="lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Campaign Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="Enter campaign name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                  <option value="social">Social Media</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Target Audience</label>
                <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option>All Customers</option>
                  <option>VIP Members</option>
                  <option>New Customers</option>
                  <option>Inactive 30+ Days</option>
                  <option>High Value</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" rows={3} placeholder="Enter campaign message..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save as Draft'}
              </Button>
              <Button variant="gold" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 size={14} className="animate-spin" /> Launching...</> : 'Launch Campaign'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
