'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { User, Store, Shield, Bell, CreditCard, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

interface Settings {
  storeName: string;
  storeUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState<Settings>({
    storeName: 'LUXE',
    storeUrl: 'https://luxe.com',
    contactEmail: 'support@luxe.com',
    phone: '+91 1800-123-4567',
    address: '42 Luxury Avenue, Bandra West, Mumbai 400050',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });
  const [profile, setProfile] = useState({ firstName: 'Admin', lastName: 'User', email: 'admin@luxe.com' });
  const [notifications, setNotifications] = useState({
    newOrders: true, lowStock: true, reviews: true, paymentFailures: true, dailyReports: false, campaignUpdates: false,
  });
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await settingsAPI.get();
      const data = res.data?.data || res.data;
      if (data) {
        setSettings(prev => ({
          storeName: data.storeName || prev.storeName,
          storeUrl: data.storeUrl || prev.storeUrl,
          contactEmail: data.supportEmail || prev.contactEmail,
          phone: data.supportPhone || prev.phone,
          address: prev.address,
          currency: data.currency || prev.currency,
          timezone: prev.timezone,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings as unknown as Record<string, unknown>);
      showMessage('success', 'Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showMessage('error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({ profile });
      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      showMessage('error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({ notifications });
      showMessage('success', 'Notification preferences saved!');
    } catch (err) {
      console.error('Failed to save notifications:', err);
      showMessage('error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-navy">Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure your store and admin preferences</p>
        </div>

        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${saveMessage.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
            {saveMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {saveMessage.text}
          </div>
        )}

        <Tabs
          tabs={[
            { id: 'store', label: 'Store Settings' },
            { id: 'profile', label: 'Admin Profile' },
            { id: 'roles', label: 'Roles & Permissions' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'billing', label: 'Billing' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'store' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-3xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Store size={20} className="text-gold" />
              <h3 className="text-lg font-semibold text-navy">Store Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Store Name</label>
                <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Store URL</label>
                <input value={settings.storeUrl} onChange={(e) => setSettings({ ...settings, storeUrl: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Contact Email</label>
                <input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
                <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-navy mb-1.5">Address</label>
                <input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Currency</label>
                <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Timezone</label>
                <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="gold" icon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-3xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <User size={20} className="text-gold" />
              <h3 className="text-lg font-semibold text-navy">Admin Profile</h3>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy text-2xl font-bold">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </div>
              <div>
                <Button variant="secondary" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  Change Avatar
                </Button>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('Selected avatar:', file.name);
                  }
                }} />
                <p className="text-xs text-text-muted mt-1">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">First Name</label>
                <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Last Name</label>
                <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
                <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="gold" icon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={20} className="text-gold" />
              <h3 className="text-lg font-semibold text-navy">Roles & Permissions</h3>
            </div>
            <div className="space-y-3">
              {[
                { role: 'Super Admin', desc: 'Full access to all features', users: 1, perms: ['All'] },
                { role: 'Admin', desc: 'Access to most features', users: 3, perms: ['Orders', 'Products', 'Customers', 'Settings'] },
                { role: 'Manager', desc: 'Access to orders, products, and customers', users: 2, perms: ['Orders', 'Products', 'Customers'] },
                { role: 'Staff', desc: 'View-only access', users: 5, perms: ['Orders (View)', 'Products (View)'] },
              ].map((item) => (
                <div key={item.role} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.role}</p>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.perms.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 bg-navy/5 text-navy rounded font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{item.users} users</span>
                    <Button variant="ghost" size="sm" onClick={() => console.log(`${item.role} permissions:`, item.perms)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-3xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell size={20} className="text-gold" />
              <h3 className="text-lg font-semibold text-navy">Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              {([
                { key: 'newOrders', label: 'New order notifications', description: 'Get notified when a new order is placed' },
                { key: 'lowStock', label: 'Low stock alerts', description: 'Alert when product stock is below threshold' },
                { key: 'reviews', label: 'Customer reviews', description: 'Notifications for new customer reviews' },
                { key: 'paymentFailures', label: 'Payment failures', description: 'Alert for failed payment transactions' },
                { key: 'dailyReports', label: 'Daily reports', description: 'Receive daily business summary via email' },
                { key: 'campaignUpdates', label: 'Campaign updates', description: 'Notifications for campaign status changes' },
              ] as const).map((pref) => (
                <div key={pref.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-navy">{pref.label}</p>
                    <p className="text-xs text-text-muted">{pref.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications[pref.key]} onChange={() => setNotifications({ ...notifications, [pref.key]: !notifications[pref.key] })} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="gold" icon={saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} onClick={handleSaveNotifications} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl border border-border p-6 max-w-3xl space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={20} className="text-gold" />
              <h3 className="text-lg font-semibold text-navy">Billing & Subscription</h3>
            </div>
            <div className="p-4 bg-gradient-to-r from-navy to-navy-light rounded-xl text-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Enterprise Plan</h4>
                <span className="text-gold text-sm font-semibold">₹49,999/year</span>
              </div>
              <p className="text-sm text-white/60">Full access to all features. Renews on Jan 1, 2025.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-muted">Monthly Revenue</p>
                <p className="text-lg font-bold text-navy">₹24.85L</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-muted">Platform Fee</p>
                <p className="text-lg font-bold text-navy">₹2,485</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-text-muted">Next Invoice</p>
                <p className="text-lg font-bold text-navy">Oct 1</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
