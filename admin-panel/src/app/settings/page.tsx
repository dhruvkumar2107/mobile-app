'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import { User, Store, Shield, Bell, CreditCard, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { settingsAPI, authAPI } from '@/lib/api';

interface Settings {
  storeName: string;
  storeDescription: string;
  storeUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  taxRate: number;
  freeShippingThreshold: number;
  shippingCharge: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  returnWindowDays: number;
  supportEmail: string;
  supportPhone: string;
}

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
}

interface NotificationPrefs {
  newOrders: boolean;
  lowStock: boolean;
  reviews: boolean;
  paymentFailures: boolean;
  dailyReports: boolean;
  campaignUpdates: boolean;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState<Settings>({
    storeName: '',
    storeDescription: '',
    storeUrl: '',
    contactEmail: '',
    phone: '',
    address: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    taxRate: 15,
    freeShippingThreshold: 999,
    shippingCharge: 99,
    minOrderAmount: 499,
    maxOrderAmount: 500000,
    returnWindowDays: 30,
    supportEmail: '',
    supportPhone: '',
  });
  const [profile, setProfile] = useState<Profile>({ firstName: '', lastName: '', email: '' });
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    newOrders: true, lowStock: true, reviews: true, paymentFailures: true, dailyReports: false, campaignUpdates: false,
  });
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, profileRes] = await Promise.allSettled([
        settingsAPI.get(),
        authAPI.getProfile(),
      ]);

      if (settingsRes.status === 'fulfilled') {
        const data = settingsRes.value.data?.data || settingsRes.value.data;
        if (data) {
          setSettings({
            storeName: data.storeName || '',
            storeDescription: data.storeDescription || '',
            storeUrl: data.storeUrl || '',
            contactEmail: data.supportEmail || '',
            phone: data.supportPhone || '',
            address: data.address || '',
            currency: data.currency || 'INR',
            timezone: data.timezone || 'Asia/Kolkata',
            taxRate: data.taxRate ?? 15,
            freeShippingThreshold: data.freeShippingThreshold ?? 999,
            shippingCharge: data.shippingCharge ?? 99,
            minOrderAmount: data.minOrderAmount ?? 499,
            maxOrderAmount: data.maxOrderAmount ?? 500000,
            returnWindowDays: data.returnWindowDays ?? 30,
            supportEmail: data.supportEmail || '',
            supportPhone: data.supportPhone || '',
          });
        }
      }

      if (profileRes.status === 'fulfilled') {
        const userData = profileRes.value.data?.data || profileRes.value.data;
        if (userData) {
          const nameParts = (userData.name || '').split(' ');
          setProfile({
            firstName: nameParts[0] || userData.firstName || '',
            lastName: nameParts.slice(1).join(' ') || userData.lastName || '',
            email: userData.email || '',
          });
        }
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
      await settingsAPI.update({
        storeName: settings.storeName,
        storeDescription: settings.storeDescription,
        currency: settings.currency,
        taxRate: settings.taxRate,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingCharge: settings.shippingCharge,
        minOrderAmount: settings.minOrderAmount,
        maxOrderAmount: settings.maxOrderAmount,
        returnWindowDays: settings.returnWindowDays,
        supportEmail: settings.contactEmail,
        supportPhone: settings.phone,
      });
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
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      await settingsAPI.update({ profile: { name: fullName, email: profile.email } });
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
      await settingsAPI.update({ notificationPreferences: notifications });
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
                <label className="block text-sm font-medium text-navy mb-1.5">Contact Email</label>
                <input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Phone</label>
                <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Currency</label>
                <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
                <input value={settings.storeDescription} onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Tax Rate (%)</label>
                <input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Free Shipping Threshold</label>
                <input type="number" value={settings.freeShippingThreshold} onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Shipping Charge</label>
                <input type="number" value={settings.shippingCharge} onChange={(e) => setSettings({ ...settings, shippingCharge: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Return Window (days)</label>
                <input type="number" value={settings.returnWindowDays} onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Min Order Amount</label>
                <input type="number" value={settings.minOrderAmount} onChange={(e) => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Max Order Amount</label>
                <input type="number" value={settings.maxOrderAmount} onChange={(e) => setSettings({ ...settings, maxOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
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
                {profile.firstName ? profile.firstName.charAt(0) : ''}{profile.lastName ? profile.lastName.charAt(0) : ''}
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
