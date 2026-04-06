'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackEvent } from '@/lib/analytics';

export default function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    void trackEvent({
      event: 'web_vital_recorded',
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      status: 'success',
      durationMs: Math.round(metric.value),
      metadata: {
        metricId: metric.id,
        metricName: metric.name,
        rating: metric.rating,
        navigationType: metric.navigationType,
        delta: metric.delta,
        value: metric.value,
      },
    });
  });

  return null;
}
