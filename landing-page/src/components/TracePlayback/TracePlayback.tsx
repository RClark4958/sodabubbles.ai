import { useEffect, useMemo, useState } from 'react';
import {
  BACKENDS,
  REDACTIONS,
  TRACE_SPANS,
  TRACE_TOTAL_MS,
  VERIFY_LINES,
  type BackendProfile,
  type DemoSpan,
} from '../../data/payerbenchTrace';
import './TracePlayback.css';

// Replay runs a little faster than real time, then holds so the finished trace can be read.
const SPEED = 1.6;
const HOLD_MS = 9000;
const TICK_MS = 50;

type Tab = 'trace' | 'backends' | 'redaction' | 'verify';

interface TracePlaybackProps {
  accentColor: string;
}

function inputTokensFor(span: DemoSpan, backend: BackendProfile): number | undefined {
  if (span.inputTokens === undefined) return undefined;
  if (backend.inputRule === 'net') return span.inputTokens - (span.cachedTokens ?? 0);
  return span.inputTokens;
}

export function TracePlayback({ accentColor }: TracePlaybackProps) {
  const [clock, setClock] = useState(0);
  const [tab, setTab] = useState<Tab>('trace');
  const [backendId, setBackendId] = useState<BackendProfile['id']>('phoenix');
  const [selected, setSelected] = useState<string>('c4');

  // Advance the replay clock; loop after a hold at the end.
  useEffect(() => {
    const timer = setInterval(() => {
      setClock((c) => {
        const next = c + TICK_MS * SPEED;
        return next > TRACE_TOTAL_MS + HOLD_MS ? 0 : next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const backend = BACKENDS.find((b) => b.id === backendId)!;
  const visible = useMemo(() => TRACE_SPANS.filter((s) => s.start <= clock), [clock]);
  const selectedSpan = TRACE_SPANS.find((s) => s.id === selected) ?? TRACE_SPANS[TRACE_SPANS.length - 1];
  const llmSpans = TRACE_SPANS.filter((s) => s.kind === 'llm');
  const totalIn = llmSpans.reduce((n, s) => n + (inputTokensFor(s, backend) ?? 0), 0);
  const totalOut = llmSpans.reduce((n, s) => n + (s.outputTokens ?? 0), 0);
  const style = { '--accent': accentColor } as React.CSSProperties;
  const verifyVisible = Math.min(VERIFY_LINES.length, Math.floor(clock / 900));

  return (
    <div className="trace-playback" style={style}>
      <div className="trace-playback__header">
        <div>
          <span className="trace-playback__title">PayerBench · denied-claim</span>
          <span className="trace-playback__sub">
            real trace, replayed · {TRACE_SPANS.length} spans · {(TRACE_TOTAL_MS / 1000).toFixed(1)} s ·
            local Gemma 4 31B
          </span>
        </div>
        <span className="trace-playback__clock">
          {Math.min(clock, TRACE_TOTAL_MS) >= TRACE_TOTAL_MS ? 'done' : `${(clock / 1000).toFixed(1)} s`}
        </span>
      </div>

      <div className="trace-playback__tabs" role="tablist">
        {(
          [
            ['trace', 'Trace'],
            ['backends', '4 backends'],
            ['redaction', 'Redaction'],
            ['verify', 'Verify'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`trace-playback__tab ${tab === id ? 'trace-playback__tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'trace' && (
        <div className="trace-playback__body">
          <div className="trace-playback__waterfall">
            {visible.map((s) => {
              const left = (s.start / TRACE_TOTAL_MS) * 100;
              const shown = Math.max(0, Math.min(s.dur, clock - s.start));
              const width = Math.max((shown / TRACE_TOTAL_MS) * 100, 0.6);
              return (
                <button
                  key={s.id}
                  className={`trace-playback__row trace-playback__row--${s.kind} ${
                    selected === s.id ? 'trace-playback__row--selected' : ''
                  }`}
                  style={{ paddingLeft: `${0.4 + s.depth * 0.9}rem` }}
                  onClick={() => setSelected(s.id)}
                  title={s.detail}
                >
                  <span className="trace-playback__name">{s.name}</span>
                  <span className="trace-playback__bar-track">
                    <span className="trace-playback__bar" style={{ left: `${left}%`, width: `${width}%` }} />
                  </span>
                  <span className="trace-playback__dur">
                    {s.kind === 'llm' && s.inputTokens !== undefined
                      ? `${inputTokensFor(s, backend)}/${s.outputTokens} tok`
                      : `${s.dur} ms`}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="trace-playback__detail">
            <span className={`trace-playback__kind trace-playback__kind--${selectedSpan.kind}`}>
              {selectedSpan.kind === 'llm'
                ? backend.llmLabel
                : selectedSpan.kind === 'tool'
                  ? 'execute_tool'
                  : selectedSpan.kind}
            </span>
            <span className="trace-playback__detail-text">{selectedSpan.detail}</span>
          </div>
        </div>
      )}

      {tab === 'backends' && (
        <div className="trace-playback__body">
          <div className="trace-playback__pills">
            {BACKENDS.map((b) => (
              <button
                key={b.id}
                className={`trace-playback__pill ${b.id === backendId ? 'trace-playback__pill--active' : ''}`}
                onClick={() => setBackendId(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="trace-playback__stats">
            <div className="trace-playback__stat">
              <span className="trace-playback__value">{inputTokensFor(llmSpans[3], backend)}</span>
              <span className="trace-playback__unit">input tokens, final LLM span</span>
            </div>
            <div className="trace-playback__stat">
              <span className="trace-playback__value">{llmSpans[3].outputTokens}</span>
              <span className="trace-playback__unit">output tokens</span>
            </div>
            <div className="trace-playback__stat">
              <span className="trace-playback__value">{backend.attrsRetained}</span>
              <span className="trace-playback__unit">attributes retained</span>
            </div>
            <div className="trace-playback__stat">
              <span className="trace-playback__value">{backend.genAiAttrs}</span>
              <span className="trace-playback__unit">gen_ai.* kept</span>
            </div>
          </div>
          <p className="trace-playback__note">
            <strong>{backend.llmLabel}</strong> · {backend.hosting} · ingest {backend.lag}. {backend.note}
            {backend.inputRule === 'net' && (
              <>
                {' '}The raw prompt was {llmSpans[3].inputTokens} tokens with {llmSpans[3].cachedTokens} cached.
              </>
            )}
          </p>
          <p className="trace-playback__totals">
            Whole trace as this backend reports it: {totalIn.toLocaleString()} in / {totalOut} out across{' '}
            {llmSpans.length} LLM calls.
          </p>
        </div>
      )}

      {tab === 'redaction' && (
        <div className="trace-playback__body">
          <ul className="trace-playback__redactions">
            {REDACTIONS.map((r) => (
              <li key={r.before}>
                <code className="trace-playback__before">{r.before}</code>
                <span className="trace-playback__arrow">→</span>
                <code className="trace-playback__after">{r.after}</code>
                <span className="trace-playback__how">{r.how}</span>
              </li>
            ))}
          </ul>
          <p className="trace-playback__note">
            Two layers: pattern rules in the OpenTelemetry Collector before any exporter, and Presidio entity
            recognition inside the agent for names in free text. Synthetic members only.
          </p>
        </div>
      )}

      {tab === 'verify' && (
        <div className="trace-playback__body">
          <pre className="trace-playback__verify">
            <span className="trace-playback__prompt">$ just verify --phi-since 1790539836</span>
            {'\n'}
            {VERIFY_LINES.slice(0, Math.max(verifyVisible, 1)).map((l) => (
              <span key={l.name} className="trace-playback__verify-line">
                <span className="trace-playback__ok">ok </span>
                {'  '}
                {l.name.padEnd(10)}
                {l.detail}
                {'\n'}
              </span>
            ))}
          </pre>
          <p className="trace-playback__note">
            Every run asks each backend what it holds, counts spans carrying the GenAI convention, probes for
            seven known synthetic identifiers, and parses a redacted tool result back into JSON.
          </p>
        </div>
      )}
    </div>
  );
}
