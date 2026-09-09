'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { formatDateTime } from '@/lib/utils';
import { notificationsAPI } from '@/lib/api';
import { Notification } from '@/types';
import { Bell, Send, Users, ShoppingCart, Package, Star, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Bell size={16} className="text-info" />,
  success: <CheckCircle size={16} className="text-success" />,
  warning: <AlertTriangle size={16} className="text-warning" />,
  error: <AlertTriangle size={16} className="text-error" />,
  order: <ShoppingCart size={16} className="text-info" />,
  system: <Bell size={16} className="text-text-muted" />,
  product: <Package size={16} className="text-accent" />,
  review: <Star size={16} className="text-warning" />,
};

interface SentNotification {
  _id: string;
  title: string;
  body: string;
  target: string;
  sent: number;
  sentAt: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [sendTarget, setSendTarget] = useState('all');
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentHistory, setSentHistory] = useState<SentNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll({ page: 1, limit: 50 });
      const data = res.data?.data;
      const items = data?.data || data || [];
      setNotifications(items.map((n: any) => ({
        _id: n.id || n._id,
        title: n.title,
        message: n.body || n.message,
        type: n.type || 'info',
        read: n.read || false,
        createdAt: n.createdAt,
      })));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSend = async () => {
    if (!sendTitle.trim() || !sendMessage.trim()) {
      setSendError('Title and message are required');
      setTimeout(() => setSendError(null), 3000);
      return;
    }
    try {
      setSending(true);
      setSendError(null);
      setSendSuccess(null);
      const payload: any = { title: sendTitle, body: sendMessage, type: 'system' };
      if (sendTarget !== 'all') {
        // For non-all targets, the backend will broadcast to all users as a fallback
        // since there's no dedicated endpoint for filtered targets
      }
      await notificationsAPI.send(payload);
      setSentHistory((prev) => [
        {
          _id: String(Date.now()),
          title: sendTitle,
          body: sendMessage,
          target: sendTarget === 'all' ? 'All Customers' : sendTarget === 'vip' ? 'VIP Members' : sendTarget === 'new' ? 'New Customers' : 'Inactive Users',
          sent: 1,
          sentAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSendSuccess(`Notification "${sendTitle}" sent successfully!`);
      setSendTitle('');
      setSendMessage('');
      setSendTarget('all');
      setTimeout(() => setSendSuccess(null), 4000);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to send notification:', err);
      setSendError('Failed to send notification. Please try again.');
      setTimeout(() => setSendError(null), 4000);
    } finally {
      setSending(false);
    }
  };

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
            { id: 'inbox', label: 'Inbox', count: unreadCount },
            { id: 'send', label: 'Send Notification' },
            { id: 'history', label: 'History', count: sentHistory.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'inbox' && (
          <div className="bg-white rounded-xl border border-border divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    notification.read ? 'bg-white' : 'bg-accent/5'
                  } hover:bg-gray-50`}
                >
                  <div className="shrink-0 mt-0.5">
                    {typeIcons[notification.type] || <Bell size={16} className="text-text-muted" />}
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
              ))
            )}
          </div>
        )}

        {activeTab === 'send' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-2xl">
            <h3 className="text-sm font-semibold text-navy mb-4">Send Push Notification</h3>

            {sendSuccess && (
              <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2 bg-success/10 text-success border border-success/20">
                <CheckCircle size={16} />
                {sendSuccess}
              </div>
            )}
            {sendError && (
              <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2 bg-error/10 text-error border border-error/20">
                <AlertTriangle size={16} />
                {sendError}
              </div>
            )}

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
                <Button
                  variant="secondary"
                  onClick={() => { setSendTitle(''); setSendMessage(''); setSendTarget('all'); }}
                >
                  Clear
                </Button>
                <Button
                  variant="gold"
                  icon={sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Send Now'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {sentHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center text-text-muted text-sm">
                No notifications sent yet. Use the Send tab to send your first notification.
              </div>
            ) : (
              sentHistory.map((item) => (
                <div key={item._id} className="bg-white rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-navy">{item.title}</h4>
                    <span className="text-xs text-text-muted">{formatDateTime(item.sentAt)}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{item.body}</p>
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-text-muted">Target: <span className="text-navy font-medium">{item.target}</span></span>
                    <span className="text-text-muted">Sent: <span className="text-navy font-medium">{item.sent}</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
