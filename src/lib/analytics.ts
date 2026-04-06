export type AnalyticsEventPayload = {
  event: string;
  path?: string;
  toolId?: string;
  sessionId?: string;
  status?: 'started' | 'success' | 'error' | 'view';
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:10000/api/v1'
    : 'https://pdfpro-s8il.onrender.com/api/v1';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
const ANALYTICS_API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
const SESSION_STORAGE_KEY = 'mydearpdf.analytics.session_id';
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';

const MAX_EVENT_NAME_LENGTH = 80;
const MAX_PATH_LENGTH = 512;
const MAX_TOOL_ID_LENGTH = 100;
const MAX_SESSION_ID_LENGTH = 100;
const MAX_STATUS_LENGTH = 40;
const MAX_METADATA_KEYS = 40;
const MAX_METADATA_VALUE_LENGTH = 500;

type SanitizedMetadata = Record<string, string | number | boolean | null>;

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const newSessionId = generateSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    return newSessionId;
  } catch {
    // Local storage can throw in private mode or strict browser settings.
    return generateSessionId();
  }
}

function sanitizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function sanitizeMetadata(metadata: unknown): SanitizedMetadata | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const result: SanitizedMetadata = {};
  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, MAX_METADATA_KEYS);

  for (const [rawKey, value] of entries) {
    const key = sanitizeString(rawKey, 80);
    if (!key) continue;

    if (typeof value === 'string') {
      result[key] = value.slice(0, MAX_METADATA_VALUE_LENGTH);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      result[key] = value;
      continue;
    }

    try {
      const serialized = JSON.stringify(value);
      if (serialized) {
        result[key] = serialized.slice(0, MAX_METADATA_VALUE_LENGTH);
      }
    } catch {
      // Skip values that cannot be serialized.
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function buildRequestBody(payload: AnalyticsEventPayload) {
  const event = sanitizeString(payload.event, MAX_EVENT_NAME_LENGTH);
  if (!event) return null;

  return {
    event,
    path: sanitizeString(payload.path, MAX_PATH_LENGTH),
    toolId: sanitizeString(payload.toolId, MAX_TOOL_ID_LENGTH),
    sessionId: sanitizeString(payload.sessionId || getAnalyticsSessionId(), MAX_SESSION_ID_LENGTH),
    status: sanitizeString(payload.status, MAX_STATUS_LENGTH),
    durationMs: Number.isFinite(payload.durationMs) ? payload.durationMs : undefined,
    metadata: sanitizeMetadata(payload.metadata),
  };
}

function sendWithBeacon(url: string, body: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }

  try {
    const blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  } catch {
    return false;
  }
}

export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
  if (typeof window === 'undefined' || !ANALYTICS_ENABLED) return;
  const body = buildRequestBody(payload);
  if (!body) return;

  const url = `${ANALYTICS_API_BASE}/analytics/event`;
  const serializedBody = JSON.stringify(body);
  try {
    if (sendWithBeacon(url, serializedBody)) {
      return;
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializedBody,
      keepalive: true,
    });
  } catch {
    // Do not interrupt user flows if analytics is unavailable.
  }
}
