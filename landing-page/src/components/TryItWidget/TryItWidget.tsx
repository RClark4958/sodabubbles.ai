import { useState, useRef, type FormEvent } from 'react';
import { useTurnstile } from '../../hooks/useTurnstile';
import { useChatQuery } from '../../hooks/useChatQuery';
import './TryItWidget.css';

interface TryItWidgetProps {
  projectSlug: string;
  placeholder?: string;
  accentColor: string;
}

export function TryItWidget({ projectSlug, placeholder, accentColor }: TryItWidgetProps) {
  const [query, setQuery] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const { token, error: turnstileError, resetToken } = useTurnstile(turnstileRef);
  const { response, isLoading, error, sendQuery, reset } = useChatQuery(projectSlug);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    if (!token) {
      return; // Turnstile hasn't resolved yet, wait
    }
    sendQuery(query.trim(), token);
    resetToken();
  };

  const handleClear = () => {
    setQuery('');
    reset();
  };

  const style = { '--accent': accentColor } as React.CSSProperties;

  return (
    <div className="try-it" style={style}>
      <form className="try-it__form" onSubmit={handleSubmit}>
        <textarea
          className="try-it__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Ask a question...'}
          rows={2}
          maxLength={500}
          disabled={isLoading}
        />
        <div className="try-it__controls">
          <span className="try-it__counter">{query.length}/500</span>
          <div className="try-it__buttons">
            {(response || error) && (
              <button type="button" className="try-it__btn try-it__btn--clear" onClick={handleClear}>
                Clear
              </button>
            )}
            <button
              type="submit"
              className="try-it__btn try-it__btn--ask"
              disabled={!query.trim() || isLoading || !token}
            >
              {isLoading ? 'Asking...' : 'Ask'}
            </button>
          </div>
        </div>
      </form>

      {/* Hidden Turnstile container */}
      <div ref={turnstileRef} style={{ display: 'none' }} />

      {turnstileError && <div className="try-it__error">{turnstileError}</div>}

      {isLoading && (
        <div className="try-it__loading">
          <span className="try-it__dots">
            <span />
            <span />
            <span />
          </span>
          Thinking...
        </div>
      )}

      {error && <div className="try-it__error">{error}</div>}

      {response && (
        <div className="try-it__response">
          <div className="try-it__response-text">{response.response}</div>

          {response.citations && response.citations.length > 0 && (
            <div className="try-it__citations">
              <strong>Sources:</strong>
              <ul>
                {response.citations.map((c, i) => (
                  <li key={i}>
                    {c.headline}
                    {c.date && <span className="try-it__citation-date"> ({c.date})</span>}
                    {c.section && <span className="try-it__citation-section"> - {c.section}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response.confidence != null && (
            <div className="try-it__confidence">
              Confidence: {Math.round(response.confidence * 100)}%
            </div>
          )}

          {response.disclaimer && (
            <div className="try-it__disclaimer">{response.disclaimer}</div>
          )}
        </div>
      )}
    </div>
  );
}
