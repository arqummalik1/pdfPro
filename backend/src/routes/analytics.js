/**
 * API Routes - Website Analytics
 */
const express = require('express');
const { logWebEvent, supabaseAdmin } = require('../config/supabase');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();
const ALLOWED_STATUSES = new Set(['started', 'success', 'error', 'view']);
const MAX_METADATA_KEYS = 40;
const MAX_METADATA_VALUE_LENGTH = 500;
const MAX_ANALYTICS_ROWS = 20000;
const PAGE_SIZE = 1000;

function sanitizeString(value, maxLength = 255) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function sanitizeDuration(value) {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration < 0) return null;
  return Math.round(duration);
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result = {};
  const entries = Object.entries(value).slice(0, MAX_METADATA_KEYS);

  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeString(rawKey, 80);
    if (!key) continue;

    if (typeof rawValue === 'string') {
      result[key] = rawValue.slice(0, MAX_METADATA_VALUE_LENGTH);
      continue;
    }

    if (typeof rawValue === 'number' || typeof rawValue === 'boolean' || rawValue === null) {
      result[key] = rawValue;
      continue;
    }

    try {
      const serialized = JSON.stringify(rawValue);
      if (serialized) {
        result[key] = serialized.slice(0, MAX_METADATA_VALUE_LENGTH);
      }
    } catch {
      // Ignore unserializable values.
    }
  }

  return result;
}

function parseDays(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(Math.round(parsed), 365);
}

async function fetchAnalyticsRows(sinceIso) {
  if (!supabaseAdmin) {
    throw new Error('Analytics storage is not configured');
  }

  const rows = [];
  let offset = 0;

  while (rows.length < MAX_ANALYTICS_ROWS) {
    const { data, error } = await supabaseAdmin
      .from('web_analytics_events')
      .select('created_at, event_name, path, tool_id, session_id')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

function aggregateDashboard(rows) {
  const summary = {
    totalEvents: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    toolStarts: 0,
    toolSuccesses: 0,
    toolFailures: 0,
    downloads: 0,
  };

  const uniqueSessions = new Set();
  const dailyMap = new Map();
  const toolsMap = new Map();
  const pagesMap = new Map();

  for (const row of rows) {
    summary.totalEvents += 1;
    if (row.session_id) uniqueSessions.add(row.session_id);

    const day = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : 'unknown';
    if (!dailyMap.has(day)) {
      dailyMap.set(day, {
        day,
        uniqueSessions: new Set(),
        pageViews: 0,
        toolStarts: 0,
        toolSuccesses: 0,
        toolFailures: 0,
        downloads: 0,
      });
    }

    const dayEntry = dailyMap.get(day);
    if (row.session_id) dayEntry.uniqueSessions.add(row.session_id);

    const toolId = row.tool_id || 'unknown';
    if (!toolsMap.has(toolId)) {
      toolsMap.set(toolId, {
        toolId,
        starts: 0,
        successes: 0,
        failures: 0,
        downloads: 0,
      });
    }
    const toolEntry = toolsMap.get(toolId);

    switch (row.event_name) {
      case 'page_view':
        summary.pageViews += 1;
        dayEntry.pageViews += 1;
        if (row.path) {
          pagesMap.set(row.path, (pagesMap.get(row.path) || 0) + 1);
        }
        break;
      case 'tool_process_started':
        summary.toolStarts += 1;
        dayEntry.toolStarts += 1;
        toolEntry.starts += 1;
        break;
      case 'tool_process_succeeded':
        summary.toolSuccesses += 1;
        dayEntry.toolSuccesses += 1;
        toolEntry.successes += 1;
        break;
      case 'tool_process_failed':
        summary.toolFailures += 1;
        dayEntry.toolFailures += 1;
        toolEntry.failures += 1;
        break;
      case 'tool_output_downloaded':
        summary.downloads += 1;
        dayEntry.downloads += 1;
        toolEntry.downloads += 1;
        break;
      default:
        break;
    }
  }

  summary.uniqueVisitors = uniqueSessions.size;

  const daily = Array.from(dailyMap.values())
    .map((entry) => ({
      day: entry.day,
      uniqueVisitors: entry.uniqueSessions.size,
      pageViews: entry.pageViews,
      toolStarts: entry.toolStarts,
      toolSuccesses: entry.toolSuccesses,
      toolFailures: entry.toolFailures,
      downloads: entry.downloads,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const tools = Array.from(toolsMap.values())
    .filter((tool) => tool.starts || tool.successes || tool.failures || tool.downloads)
    .map((tool) => ({
      ...tool,
      successRate: tool.starts > 0 ? Number(((tool.successes / tool.starts) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.starts - a.starts);

  const topPages = Array.from(pagesMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return { summary, daily, tools, topPages };
}

router.post('/analytics/event', async (req, res) => {
  try {
    const eventName = sanitizeString(req.body?.event, 80);
    if (!eventName) {
      return res.status(400).json({
        success: false,
        message: 'event is required',
      });
    }

    const status = sanitizeString(req.body?.status, 40);
    const normalizedStatus = status && ALLOWED_STATUSES.has(status) ? status : null;

    const payload = {
      event_name: eventName,
      path: sanitizeString(req.body?.path, 512),
      tool_id: sanitizeString(req.body?.toolId, 100),
      session_id: sanitizeString(req.body?.sessionId, 100),
      status: normalizedStatus,
      duration_ms: sanitizeDuration(req.body?.durationMs),
      metadata: sanitizeMetadata(req.body?.metadata),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || null,
    };

    // Never block user requests on analytics persistence.
    void logWebEvent(payload).catch(() => null);

    return res.status(202).json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to record analytics event',
    });
  }
});

router.get('/analytics/dashboard', requireAdminAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({
        success: false,
        message: 'Analytics storage is not configured on the backend',
      });
    }

    const days = parseDays(req.query?.days);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceIso = sinceDate.toISOString();

    const rows = await fetchAnalyticsRows(sinceIso);
    const { summary, daily, tools, topPages } = aggregateDashboard(rows);

    return res.json({
      success: true,
      windowDays: days,
      rowCount: rows.length,
      truncated: rows.length >= MAX_ANALYTICS_ROWS,
      generatedAt: new Date().toISOString(),
      summary,
      daily,
      tools,
      topPages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load analytics dashboard data',
    });
  }
});

module.exports = router;
