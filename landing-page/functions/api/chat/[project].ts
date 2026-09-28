// originVar names the environment variable holding the upstream origin; set in wrangler.toml [vars].
interface ChatTarget {
  originVar: 'MONEYBAGS_ORIGIN';
  chatPath: string;
  transformRequest: (query: string) => { body: string; headers: Record<string, string> };
  transformResponse: (data: any) => ChatProxyResponse;
}

interface ChatProxyResponse {
  response: string;
  citations?: { headline: string; date?: string; section?: string }[];
  confidence?: number;
  disclaimer?: string;
  error?: string;
}

const CHAT_TARGETS: Record<string, ChatTarget> = {
  moneybags: {
    originVar: 'MONEYBAGS_ORIGIN',
    chatPath: '/api/query',
    transformRequest: (query) => ({
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' },
    }),
    transformResponse: (data) => ({
      response: data.content || data.response || data.error || 'No response',
      citations: data.citations,
      confidence: data.confidence,
      disclaimer:
        data.disclaimer ||
        'This is AI-generated financial information. Not professional financial advice.',
    }),
  },
};

interface Env {
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
  MONEYBAGS_ORIGIN?: string;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json<{ success: boolean }>();
  return data.success;
}

async function checkRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const key = `ratelimit:${ip}:${hourBucket}`;
  const current = parseInt((await kv.get(key)) || '0', 10);
  if (current >= 10) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return true;
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache',
  };
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const slug = context.params.project as string;
  const target = CHAT_TARGETS[slug];

  if (!target) {
    return Response.json(
      { error: 'Unknown project' } as ChatProxyResponse,
      { status: 404, headers: corsHeaders() }
    );
  }

  const origin = context.env[target.originVar];
  if (!origin) {
    return Response.json(
      { error: 'Upstream not configured' } as ChatProxyResponse,
      { status: 503, headers: corsHeaders() }
    );
  }

  // Parse request body
  let body: { query?: string; turnstileToken?: string };
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' } as ChatProxyResponse,
      { status: 400, headers: corsHeaders() }
    );
  }

  // Validate query
  const query = body.query?.trim();
  if (!query) {
    return Response.json(
      { error: 'Query is required' } as ChatProxyResponse,
      { status: 400, headers: corsHeaders() }
    );
  }
  if (query.length > 500) {
    return Response.json(
      { error: 'Query must be 500 characters or fewer' } as ChatProxyResponse,
      { status: 400, headers: corsHeaders() }
    );
  }

  // Verify Turnstile token
  if (!body.turnstileToken) {
    return Response.json(
      { error: 'Turnstile verification required' } as ChatProxyResponse,
      { status: 403, headers: corsHeaders() }
    );
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';

  const turnstileOk = await verifyTurnstile(
    body.turnstileToken,
    context.env.TURNSTILE_SECRET_KEY,
    ip
  );
  if (!turnstileOk) {
    return Response.json(
      { error: 'Turnstile verification failed' } as ChatProxyResponse,
      { status: 403, headers: corsHeaders() }
    );
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(context.env.RATE_LIMIT_KV, ip);
  if (!withinLimit) {
    return Response.json(
      { error: 'Rate limit exceeded — max 10 queries per hour. Try again later.' } as ChatProxyResponse,
      { status: 429, headers: corsHeaders() }
    );
  }

  // Forward to upstream with 30s timeout
  try {
    // Detailed AI Search responses need ~30s+; allow generous headroom but stay
    // under Cloudflare's ~100s edge gateway timeout so we return our own JSON 504.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const transformed = target.transformRequest(query);
    const upstream = await fetch(`${origin}${target.chatPath}`, {
      method: 'POST',
      headers: transformed.headers,
      body: transformed.body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const text = await upstream.text();
      return Response.json(
        { error: `Upstream error (${upstream.status})`, response: text } as ChatProxyResponse,
        { status: 502, headers: corsHeaders() }
      );
    }

    const data = await upstream.json();
    const result = target.transformResponse(data);
    return Response.json(result, { headers: corsHeaders() });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return Response.json(
        { error: 'Request timed out — the bot is thinking too long. Try a simpler question.' } as ChatProxyResponse,
        { status: 504, headers: corsHeaders() }
      );
    }
    return Response.json(
      { error: 'Failed to reach upstream service' } as ChatProxyResponse,
      { status: 502, headers: corsHeaders() }
    );
  }
};
