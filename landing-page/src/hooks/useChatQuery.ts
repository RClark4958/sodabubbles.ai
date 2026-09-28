import { useState, useCallback } from 'react';
import type { ChatProxyResponse } from '../types';

export function useChatQuery(projectSlug: string) {
  const [response, setResponse] = useState<ChatProxyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(
    async (query: string, turnstileToken: string) => {
      setIsLoading(true);
      setError(null);
      setResponse(null);

      try {
        const res = await fetch(`/api/chat/${projectSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, turnstileToken }),
        });

        // The proxy returns JSON on handled paths, but an edge/gateway error
        // (e.g. a 504 timeout) yields a non-JSON HTML page. Parse defensively so
        // those surface the real status instead of a misleading "Network error".
        let data: ChatProxyResponse;
        try {
          data = await res.json();
        } catch {
          data = { response: '', error: `Request failed (${res.status})` };
        }

        if (!res.ok) {
          if (res.status === 429) {
            setError('Rate limit reached — max 10 queries per hour. Try again later.');
          } else if (res.status === 403) {
            setError('Verification failed. Please refresh the page and try again.');
          } else if (res.status === 504) {
            setError('The bot took too long to respond. Try a simpler question.');
          } else {
            setError(data.error || `Request failed (${res.status})`);
          }
          return;
        }

        setResponse(data);
      } catch {
        setError('Network error — please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [projectSlug]
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { response, isLoading, error, sendQuery, reset };
}
