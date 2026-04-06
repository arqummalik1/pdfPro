'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAnalyticsDashboard, adminLogout, checkAdminAuthStatus, type AnalyticsDashboardResponse } from '@/lib/api';
import { FileText, RefreshCw, AlertCircle, BarChart3, Users, Activity, Download, LogOut } from 'lucide-react';
import AdminLogin from './AdminLogin';

const DAY_OPTIONS = [7, 14, 30, 60, 90];

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="text-gray-500">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authConfigured, setAuthConfigured] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const status = await checkAdminAuthStatus();
        setAuthConfigured(status.authConfigured);
        if (status.authConfigured) {
          setIsAuthenticated(status.authenticated);
        } else {
          // If auth not configured, allow access (dev mode)
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAnalyticsDashboard(days);
      if (!response.success) {
        if (response.message?.includes('Unauthorized') || response.message?.includes('AUTH_REQUIRED')) {
          setIsAuthenticated(false);
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(response.message || 'Failed to load dashboard data');
      }
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboard();
    }
  }, [loadDashboard, isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      setIsAuthenticated(false);
      setData(null);
    }
  };

  // Move useMemo BEFORE early returns to maintain consistent hook order
  const summary = useMemo(
    () =>
      data?.summary || {
        totalEvents: 0,
        uniqueVisitors: 0,
        pageViews: 0,
        toolStarts: 0,
        toolSuccesses: 0,
        toolFailures: 0,
        downloads: 0,
      },
    [data]
  );

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} error={error || undefined} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold">mydearPDF</span>
          </Link>
          <div className="flex items-center gap-3">
            <label htmlFor="days" className="text-sm text-gray-600">
              Range
            </label>
            <select
              id="days"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
            <button
              onClick={() => void loadDashboard()}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            {authConfigured && (
              <button
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Visitor and tool usage insights for the last {days} days.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {data?.truncated && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Large event volume detected. Results were sampled to keep the dashboard responsive.
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Unique Visitors" value={summary.uniqueVisitors} icon={<Users className="h-5 w-5" />} />
          <MetricCard title="Page Views" value={summary.pageViews} icon={<BarChart3 className="h-5 w-5" />} />
          <MetricCard title="Tool Starts" value={summary.toolStarts} icon={<Activity className="h-5 w-5" />} />
          <MetricCard title="Downloads" value={summary.downloads} icon={<Download className="h-5 w-5" />} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Top Tools</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2">Tool</th>
                    <th className="pb-2">Starts</th>
                    <th className="pb-2">Success %</th>
                    <th className="pb-2">Failures</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.tools || []).slice(0, 12).map((tool) => (
                    <tr key={tool.toolId} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-900">{tool.toolId}</td>
                      <td className="py-2 text-gray-700">{formatNumber(tool.starts)}</td>
                      <td className="py-2 text-gray-700">{tool.successRate.toFixed(2)}%</td>
                      <td className="py-2 text-gray-700">{formatNumber(tool.failures)}</td>
                    </tr>
                  ))}
                  {!loading && (data?.tools?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No tool analytics data found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Top Pages</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2">Path</th>
                    <th className="pb-2">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topPages || []).map((page) => (
                    <tr key={page.path} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-900">{page.path}</td>
                      <td className="py-2 text-gray-700">{formatNumber(page.views)}</td>
                    </tr>
                  ))}
                  {!loading && (data?.topPages?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No page view analytics data found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Daily Trend</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2">Day</th>
                  <th className="pb-2">Visitors</th>
                  <th className="pb-2">Page Views</th>
                  <th className="pb-2">Starts</th>
                  <th className="pb-2">Successes</th>
                  <th className="pb-2">Failures</th>
                  <th className="pb-2">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {(data?.daily || []).map((day) => (
                  <tr key={day.day} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-900">{day.day}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.uniqueVisitors)}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.pageViews)}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.toolStarts)}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.toolSuccesses)}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.toolFailures)}</td>
                    <td className="py-2 text-gray-700">{formatNumber(day.downloads)}</td>
                  </tr>
                ))}
                {!loading && (data?.daily?.length || 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      No daily analytics data found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
