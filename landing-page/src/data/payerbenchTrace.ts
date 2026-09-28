// A real trace captured from the agents-observability-platform stack on 2026-09-27, exported from
// Arize Phoenix after both redaction layers had run. Nothing here reaches a live service; the demo
// replays this data. Member IDs are SHA-256 pseudonyms and dates are year-only, exactly as stored.

export type SpanKind = 'root' | 'chain' | 'llm' | 'tool';

export interface DemoSpan {
  id: string;
  depth: number;
  name: string;
  kind: SpanKind;
  /** ms from trace start */
  start: number;
  /** ms */
  dur: number;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  detail?: string;
}

export const MEMBER_PSEUDONYM = 'MEMBER-1ff44e68…8b2717d3';

export const TRACE_TOTAL_MS = 8594;

export const TRACE_SPANS: DemoSpan[] = [
  { id: 'root', depth: 0, name: 'payerbench.chat', kind: 'root', start: 0, dur: 8594,
    detail: `user: "This is ${MEMBER_PSEUDONYM}. One of my claims was denied and I don't understand why. What happened and what can I do?"` },
  { id: 'agent', depth: 1, name: 'invoke_agent payerbench', kind: 'chain', start: 0, dur: 8593,
    detail: 'LangGraph graph run, mapped to the GenAI convention as invoke_agent' },
  { id: 'm1', depth: 2, name: 'model', kind: 'chain', start: 1, dur: 1318, detail: 'graph node · step 1' },
  { id: 'c1', depth: 3, name: 'chat gemma-4-31b-it-8bit', kind: 'llm', start: 1, dur: 1317,
    inputTokens: 642, outputTokens: 27, cachedTokens: 641,
    detail: 'tool_call → list_claims({"member_id": "MEMBER-1ff4…"})' },
  { id: 'r1', depth: 2, name: 'route', kind: 'chain', start: 1318, dur: 0, detail: 'conditional edge: tool_calls present → tools' },
  { id: 't1', depth: 2, name: 'tools', kind: 'chain', start: 1319, dur: 23, detail: 'graph node · step 2' },
  { id: 'x1', depth: 3, name: 'execute_tool list_claims', kind: 'tool', start: 1319, dur: 23,
    detail: '4 claims · service_date "2026-XX-XX" · one status "denied"' },
  { id: 'm2', depth: 2, name: 'model', kind: 'chain', start: 1343, dur: 1324, detail: 'graph node · step 3' },
  { id: 'c2', depth: 3, name: 'chat gemma-4-31b-it-8bit', kind: 'llm', start: 1343, dur: 1323,
    inputTokens: 1274, outputTokens: 30, cachedTokens: 1273,
    detail: 'tool_call → get_claim({"claim_id": "C-49447089"})' },
  { id: 'r2', depth: 2, name: 'route', kind: 'chain', start: 2667, dur: 0, detail: 'conditional edge: tool_calls present → tools' },
  { id: 't2', depth: 2, name: 'tools', kind: 'chain', start: 2667, dur: 1, detail: 'graph node · step 4' },
  { id: 'x2', depth: 3, name: 'execute_tool get_claim', kind: 'tool', start: 2667, dur: 1,
    detail: 'status "denied" · denial_code "CO-50" · billed 2495.02 · member_owes 2495.02' },
  { id: 'm3', depth: 2, name: 'model', kind: 'chain', start: 2668, dur: 1450, detail: 'graph node · step 5' },
  { id: 'c3', depth: 3, name: 'chat gemma-4-31b-it-8bit', kind: 'llm', start: 2668, dur: 1449,
    inputTokens: 1473, outputTokens: 27, cachedTokens: 1273,
    detail: 'tool_call → search_plan_document({"query": "appeal process for denied claims medically necessary"})' },
  { id: 'r3', depth: 2, name: 'route', kind: 'chain', start: 4117, dur: 0, detail: 'conditional edge: tool_calls present → tools' },
  { id: 't3', depth: 2, name: 'tools', kind: 'chain', start: 4118, dur: 1, detail: 'graph node · step 6' },
  { id: 'x3', depth: 3, name: 'execute_tool search_plan_document', kind: 'tool', start: 4118, dur: 1,
    detail: 'section "appeals": 180 days to appeal · first-level decided in 30 days' },
  { id: 'm4', depth: 2, name: 'model', kind: 'chain', start: 4119, dur: 4475, detail: 'graph node · step 7' },
  { id: 'c4', depth: 3, name: 'chat gemma-4-31b-it-8bit', kind: 'llm', start: 4119, dur: 4474,
    inputTokens: 1786, outputTokens: 104, cachedTokens: 1472,
    detail: 'Claim C-49447089 for manual therapy with Dr. [REDACTED_PERSON] on 2026-XX-XX was denied because it was not deemed medically necessary (CO-50). You have the right to appeal within 180 days…' },
  { id: 'r4', depth: 2, name: 'route', kind: 'chain', start: 8593, dur: 0, detail: 'conditional edge: no tool_calls → END' },
];

/** How each backend represented the same LLM span, measured on the running stack. */
export interface BackendProfile {
  id: 'tempo' | 'phoenix' | 'langfuse' | 'langsmith';
  name: string;
  hosting: string;
  llmLabel: string;
  /** 'raw' reports prompt tokens as sent; 'net' subtracts cached tokens */
  inputRule: 'raw' | 'net';
  attrsRetained: number;
  genAiAttrs: number;
  lag: string;
  note: string;
}

export const BACKENDS: BackendProfile[] = [
  { id: 'tempo', name: 'Grafana Tempo', hosting: 'self-hosted', llmLabel: 'SPAN_KIND_CLIENT',
    inputRule: 'raw', attrsRetained: 48, genAiAttrs: 9, lag: 'search ~30–45 s',
    note: 'Stores exactly what arrived. No idea what an LLM is; queries any attribute with TraceQL.' },
  { id: 'phoenix', name: 'Arize Phoenix', hosting: 'self-hosted', llmLabel: 'llm',
    inputRule: 'raw', attrsRetained: 44, genAiAttrs: 9, lag: 'immediate',
    note: 'Reads OpenInference natively and maps the GenAI convention both ways. Rebuilds flattened messages into a list.' },
  { id: 'langfuse', name: 'Langfuse v4', hosting: 'self-hosted', llmLabel: 'GENERATION',
    inputRule: 'net', attrsRetained: 35, genAiAttrs: 9, lag: '1.8–3.1 s',
    note: 'Promotes model, usage and content into typed columns. Reports input tokens net of cache for cost math.' },
  { id: 'langsmith', name: 'LangSmith', hosting: 'cloud', llmLabel: 'run_type: llm',
    inputRule: 'raw', attrsRetained: 23, genAiAttrs: 0, lag: 'seconds',
    note: 'Reads LangChain’s own metadata, rolls tokens up the tree, and drops every gen_ai.* attribute the collector added.' },
];

export const REDACTIONS = [
  { before: 'M-SYNTH-000003', after: MEMBER_PSEUDONYM, how: 'collector · SHA-256 pseudonym' },
  { before: '"name": "Daniel Ramos"', after: '"name": "[REDACTED_NAME]"', how: 'collector · field rule' },
  { before: '2026-01-31', after: '2026-XX-XX', how: 'collector · year only' },
  { before: 'with Dr. John Hill on', after: 'with Dr. [REDACTED_PERSON] on', how: 'agent · Presidio NER' },
];

export const VERIFY_LINES = [
  { name: 'langfuse', detail: '100 observations across 9 traces (v2 API)' },
  { name: 'phoenix', detail: '35 traces' },
  { name: 'tempo', detail: '8 traces (TraceQL via Grafana proxy)' },
  { name: 'langsmith', detail: '5 root runs in project payerbench' },
  { name: 'semconv', detail: 'gen_ai.operation.name: chat=18, execute_tool=11, invoke_agent=8' },
  { name: 'phi', detail: '10 spans examined, 7 probes, 0 hits' },
  { name: 'shape', detail: 'redacted tool result parses; fields ok' },
];
