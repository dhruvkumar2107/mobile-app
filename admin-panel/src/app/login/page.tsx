'use client';

import React, { useState, useCallback } from 'react';
import { Crown, Eye, EyeOff, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { authAPI } from '@/lib/api';

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export default function LoginPage() {
  const [email, setEmail] = useState('admin@luxe.in');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLockout = useCallback(() => {
    setIsLocked(true);
    setLockTimeRemaining(30);
    const interval = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLocked(false);
          setLoginAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSent(true);
    } catch {
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail || !sanitizedPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ email: sanitizedEmail, password: sanitizedPassword });
      const token = res.data.token || res.data.accessToken || res.data.data?.token;
      if (token) {
        localStorage.setItem('admin_token', token);
        window.location.href = '/dashboard';
      } else {
        setError('Invalid response from server');
      }
    } catch (err: unknown) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 5) {
        handleLockout();
        setError('Too many failed attempts. Please try again in 30 seconds.');
      } else {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg = axiosErr.response?.data?.message || `Login failed. ${5 - newAttempts} attempt(s) remaining.`;
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 luxury-gradient relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gold rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold/50 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-8 animate-pulse-gold">
            <Crown size={40} className="text-navy" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-wider mb-3">LUXE</h1>
          <p className="text-gold/70 text-sm tracking-[0.3em] uppercase mb-12">Enterprise Admin Panel</p>
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-white">48K+</p>
              <p className="text-xs text-white/40 mt-1">Customers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">₹24L+</p>
              <p className="text-xs text-white/40 mt-1">Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">18K+</p>
              <p className="text-xs text-white/40 mt-1">Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Crown size={22} className="text-navy" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy tracking-wider">LUXE</h1>
              <p className="text-[10px] text-text-muted tracking-[0.2em]">ADMIN</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-navy">Welcome back</h2>
          <p className="text-text-secondary mt-1 mb-8">Sign in to manage your luxury empire</p>

          {error && (
            <div className="mb-4 p-3 bg-error-bg border border-error/20 rounded-lg text-sm text-error flex items-center gap-2" role="alert">
              <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-navy mb-1.5">
                Email <span className="text-error" aria-hidden="true">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all h-10"
                placeholder="admin@luxe.in"
                required
                autoComplete="email"
                aria-required="true"
                disabled={isLocked}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-navy mb-1.5">
                Password <span className="text-error" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all pr-10 h-10"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-gold hover:text-gold-dark font-medium transition-colors">
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-gold to-gold-dark text-navy font-semibold rounded-lg hover:from-gold-light hover:to-gold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              aria-disabled={loading || isLocked}
              aria-busy={loading}
            >
              {isLocked ? (
                <>
                  <AlertTriangle size={18} />
                  Locked ({lockTimeRemaining}s)
                </>
              ) : loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            Secured by LUXE Enterprise. All rights reserved.
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            {resetSent ? (
              <div className="text-center space-y-4">
                <Mail size={48} className="mx-auto text-gold" />
                <h3 className="text-lg font-bold text-navy">Check your email</h3>
                <p className="text-sm text-text-secondary">If an account exists with <strong>{resetEmail}</strong>, we&apos;ve sent password reset instructions.</p>
                <button onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(''); }} className="w-full py-2.5 bg-navy text-white rounded-lg font-semibold hover:bg-navy-light transition-colors">
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-navy">Reset Password</h3>
                  <p className="text-sm text-text-secondary mt-1">Enter your email address and we&apos;ll send you a link to reset your password.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all h-10"
                    placeholder="admin@luxe.in"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForgotPassword(false)} className="flex-1 py-2.5 px-4 border border-border rounded-lg text-sm font-medium text-navy hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={resetLoading} className="flex-1 py-2.5 px-4 bg-gradient-to-r from-gold to-gold-dark text-navy font-semibold rounded-lg hover:from-gold-light hover:to-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {resetLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
