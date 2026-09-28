import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, HealthResponse } from '../types';

const POLL_INTERVAL = 45_000;

export function useHealthCheck(slug: string | undefined): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  const check = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/health/${slug}`);
      const data: HealthResponse = await res.json();
      setStatus(data.status);
    } catch {
      setStatus('offline');
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setStatus('offline');
      return;
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [slug, check]);

  return status;
}
