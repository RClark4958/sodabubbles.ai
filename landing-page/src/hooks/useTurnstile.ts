import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'invisible' | 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// Public Turnstile site key, injected at build time from .env (see .env.example).
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function useTurnstile(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // Check if script already exists
    if (document.querySelector('script[src*="turnstile"]')) {
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    script.onerror = () => {
      setError('Failed to load verification script');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      size: 'invisible',
      callback: (t: string) => {
        setToken(t);
        setError(null);
      },
      'expired-callback': () => {
        setToken(null);
      },
      'error-callback': () => {
        setError('Verification failed');
        setToken(null);
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerRef]);

  // Retry rendering if turnstile wasn't ready on first mount
  useEffect(() => {
    if (widgetIdRef.current) return;
    if (!containerRef.current) return;

    const interval = setInterval(() => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: 'invisible',
          callback: (t: string) => {
            setToken(t);
            setError(null);
          },
          'expired-callback': () => {
            setToken(null);
          },
          'error-callback': () => {
            setError('Verification failed');
            setToken(null);
          },
        });
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [containerRef]);

  const resetToken = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { token, error, resetToken };
}
