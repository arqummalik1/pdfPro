'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminLogin } from '@/lib/api';
import { FileText, Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  error?: string;
}

export default function AdminLogin({ onLogin, error: initialError }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [locked, setLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(pin);
      if (response.success) {
        onLogin();
      } else {
        setError(response.message || 'Login failed');
        if (response.locked) {
          setLocked(true);
          setRetryAfter(response.retryAfter || 0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setLocked(false);
    setError('');
  };

  if (locked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 mx-auto mb-4">
                <FileText className="h-7 w-7 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Locked</h2>
              <p className="text-sm text-gray-600 mb-4">
                Too many failed attempts. Please try again in {retryAfter} minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 mx-auto mb-4">
              <FileText className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your 6-digit PIN to access analytics
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={pin}
                  onChange={handlePinChange}
                  required
                  autoComplete="off"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder:text-gray-300"
                  placeholder="______"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter 6-digit PIN. 3 wrong attempts = 2 hour lock.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to mydearPDF
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          This area is restricted to authorized personnel only.
          <br />
          All login attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
