'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { formatDateTime } from '@/lib/utils';
import { Bell, Send, Users, ShoppingCart, Package, Star, AlertTriangle, CheckCircle } from 'lucide-react';

const mockNotifications = Array.from({ length: 20 }, (_, i) => ({
  _id: String(i + 1),
  title: [
    'New order received', 'Payment successful', 'Low stock alert', 'New review posted',
    'Customer complaint', 'Campaign completed', 'System backup done', 'New customer registered',
  ][i % 8],
  message: [
    'Order #ORD-28491 has been placed by Arjun Mehta for ₹45,999',
    'Payment of ₹89,500 received for order #ORD-28490',
    'Royal Chronograph Watch stock is below threshold (5 units remaining)',
    '5-star review received on Diamond Pendant Set from Priya Sharma',
    'Customer reported issue with order #ORD-28485',
    'Summer Sale 2024 campaign has ended. Total revenue: ₹5,20,000',
    'Daily backup completed successfully at 03:00 AM',
    'New customer Sneha Iyer has registered via Google SSO',
  ][i % 8],
  type: ['info', 'success', 'warning', 'info', 'error', 'success', 'info', 'success'][i % 8] as string,
  read: i > 5,
  createdAt: new Date(Date.now() - i * 1800000).toISOString(),
}));

const mockHistory = Array.from({ length: 10 }, (_, i) => ({
  _id: String(i + 1),
  title: ['Flash Sale Alert', 'New Collection Launch', 'VIP Exclusive Offer', 'Seasonal Discount'][i % 4],
  message: ['Hurry! Up to 50% off on select items', 'Check out our latest luxury collection', 'Exclusive 20% off for VIP members', 'End of season sale - limited time only'][i % 4],
  target: ['All Customers', 'VIP Members', 'New Customers', 'Active Buyers'][i % 4],
  sent: Math.floor(Math.random() * 50000) + 5000,
  delivered: 0,
  opened: 0,
  sentAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

mockHistory.forEach((h) => {
  h.delivered = Math.floor(h.sent * 0.95);
  h.opened = Math.floor(h.delivered * 0.4);
});

const typeIcons: Record<string, React.ReactNode> = {
  info: <Bell size={16} className="text-info" />,
  success: <CheckCircle size={16} className="text-success" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  error: <AlertTriangle size={16} className="text-error" />,
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [sendTarget, setSendTarget] = useState('all');
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

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
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-sm text-text-secondary mt-0.5">Send notifications and view history</p>
        </div>

        <Tabs
          tabs={[
            { id: 'inbox', label: 'Inbox', count: mockNotifications.filter((n) => !n.read).length },
            { id: 'send', label: 'Send Notification' },
            { id: 'history', label: 'History', count: mockHistory.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'inbox' && (
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {mockNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 flex items-start gap-3 transition-colors ${
                  notification.read ? 'bg-white' : 'bg-accent/5'
                } hover:bg-gray-50`}
              >
                <div className="shrink-0 mt-0.5">
                  {typeIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${notification.read ? 'font-medium text-navy' : 'font-semibold text-navy'}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-accent rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{notification.message}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDateTime(notification.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'send' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-2xl">
            <h3 className="text-sm font-semibold text-navy mb-4">Send Push Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Target Audience</label>
                <select
                  value={sendTarget}
                  onChange={(e) => setSendTarget(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="all">All Customers</option>
                  <option value="vip">VIP Members</option>
                  <option value="new">New Customers (Last 30 days)</option>
                  <option value="inactive">Inactive (30+ days)</option>
                  <option value="high-value">High Value Customers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Title</label>
                <input
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Message</label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  rows={3}
                  placeholder="Notification message..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary">Preview</Button>
                <Button variant="gold" icon={<Send size={15} />}>Send Now</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {mockHistory.map((item) => (
              <div key={item._id} className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-navy">{item.title}</h4>
                  <span className="text-xs text-text-muted">{formatDateTime(item.sentAt)}</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{item.message}</p>
                <div className="flex items-center gap-6 text-xs">
                  <span className="text-text-muted">Target: <span className="text-navy font-medium">{item.target}</span></span>
                  <span className="text-text-muted">Sent: <span className="text-navy font-medium">{item.sent.toLocaleString()}</span></span>
                  <span className="text-text-muted">Delivered: <span className="text-navy font-medium">{item.delivered.toLocaleString()}</span></span>
                  <span className="text-text-muted">Opened: <span className="text-navy font-medium">{item.opened.toLocaleString()}</span></span>
                  <span className="text-text-muted">Rate: <span className="text-success font-medium">{((item.opened / item.delivered) * 100).toFixed(1)}%</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
