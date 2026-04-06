'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getAnalyticsSessionId, trackEvent } from '@/lib/analytics';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const mountedRef = useRef(false);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const isInitialView = !mountedRef.current;
    const previousPath = previousPathRef.current;

    mountedRef.current = true;
    previousPathRef.current = pathname;

    void trackEvent({
      event: 'page_view',
      path: pathname,
      status: 'view',
      sessionId: getAnalyticsSessionId() || undefined,
      metadata: {
        referrer: document.referrer || null,
        previousPath,
        isInitialView,
      },
    });
  }, [pathname]);

  return null;
}
